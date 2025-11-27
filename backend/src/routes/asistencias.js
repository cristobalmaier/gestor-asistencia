import { Router } from 'express';
import { supabase, queryTable, insert, update as updateRecord, remove } from '../db.js';
import { registrarAccion, ACCIONES, TABLAS } from '../utils/logger.js';

const router = Router();

// --- GET / ---
router.get('/', async (req, res) => {
  const { cursoId, alumnoId, materiaId, profesorId, preceptorId, desde, hasta } = req.query;

  try {
    let query = supabase
      .from('asistencias')
      .select(`
        id,
        id_alumno,
        id_materia,
        fecha,
        presente,
        tarde,
        justificada,
        observaciones,
        created_by,
        alumno:alumno(id, nombre, apellido, dni),
        materia:materias(id, nombre, curso_id)
      `);

    if (alumnoId) query = query.eq('id_alumno', alumnoId);
    if (materiaId) query = query.eq('id_materia', materiaId);
    if (desde) query = query.gte('fecha', desde);
    if (hasta) query = query.lte('fecha', hasta);
    if (req.user?.id_usuario) query = query.eq('created_by', req.user.id_usuario);

    // Si hay cursoId, necesitamos filtrar por materia que pertenece al curso
    if (cursoId) {
      const { data: materias, error: materiasError } = await supabase
        .from('materias')
        .select('id')
        .eq('curso_id', cursoId);

      if (materiasError) throw materiasError;

      const materiaIds = materias?.map(m => m.id) || [];
      if (materiaIds.length > 0) {
        query = query.in('id_materia', materiaIds);
      } else {
        // Si no hay materias en el curso, el resultado debe ser vacío
        return res.json([]);
      }
    }

    query = query.order('fecha', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;

    // Transformar datos al formato esperado por el frontend
    // Lógica de estados: Presente > Tarde > Justificado > Ausente
    const transformed = data.map(a => {
      let estado = 'Ausente';
      if (a.presente) {
        estado = 'Presente';
      } else if (a.tarde) {
        estado = 'Tarde';
      } else if (a.justificada) {
        estado = 'Justificado';
      }

      return {
        id_asistencia: a.id,
        id_alumno: a.id_alumno,
        alumno_nombre: a.alumno?.nombre || '',
        alumno_apellido: a.alumno?.apellido || '',
        id_materia: a.id_materia,
        materia: a.materia?.nombre || '',
        fecha: a.fecha,
        estado: estado,
        tarde: a.tarde,
        justificada: a.justificada,
        observaciones: a.observaciones
      };
    });

    return res.json(transformed);
  } catch (e) {
    console.error('Error en GET /asistencias:', e);
    return res.status(500).json({ message: 'Error' });
  }
});


// --- GET /dia ---
router.get('/dia', async (req, res) => {
  const { cursoId, materiaId, fecha } = req.query;
  if (!cursoId || !materiaId || !fecha) {
    return res.status(400).json({ message: 'cursoId, materiaId y fecha son requeridos' });
  }

  try {
    // Obtener alumnos del curso
    const { data: alumnos, error: alumnosError } = await supabase
      .from('alumno')
      .select('id, nombre, apellido')
      .eq('id_curso', cursoId)
      .order('apellido')
      .order('nombre');

    if (alumnosError) throw alumnosError;

    // Obtener asistencias del día
    const { data: asistencias, error: asistError } = await supabase
      .from('asistencias')
      .select('id, id_alumno, presente, tarde, justificada')
      .eq('id_materia', materiaId)
      .eq('fecha', fecha);

    if (asistError) throw asistError;

    const asistMap = new Map();
    let existingAttendanceId = null;

    asistencias.forEach(a => {
      let estado = 'Ausente';
      if (a.presente) {
        estado = 'Presente';
      } else if (a.tarde) {
        estado = 'Tarde';
      } else if (a.justificada) {
        estado = 'Justificado';
      }
      asistMap.set(a.id_alumno, { estado, id: a.id });
      if (!existingAttendanceId) existingAttendanceId = a.id;
    });

    const data = alumnos.map(a => {
      const asist = asistMap.get(a.id);
      return {
        id_alumno: a.id,
        nombre: a.nombre,
        apellido: a.apellido,
        estado: asist?.estado || null,
        asistencia_id: asist?.id || null
      };
    });

    return res.json({
      alumnos: data,
      existingAttendance: existingAttendanceId ? { id: existingAttendanceId } : null
    });

    return res.json({ alumnos: data });
  } catch (e) {
    console.error('Error en GET /asistencias/dia:', e);
    return res.status(500).json({ message: 'Error' });
  }
});


// --- POST /pasar-lista ---
router.post('/pasar-lista', async (req, res) => {
  const { cursoId, materiaId, fecha, items } = req.body || {};
  if (!cursoId || !materiaId || !fecha || !Array.isArray(items)) {
    return res.status(400).json({ message: 'cursoId, materiaId, fecha, items requeridos' });
  }

  try {
    // Verificar que el usuario tenga permisos
    if (!req.user) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    const operations = [];
    const createdBy = req.user.id_usuario;

    // Obtener nombres de curso y materia para el log
    const { data: cursoData } = await supabase
      .from('curso')
      .select('curso')
      .eq('id', cursoId)
      .single();

    const { data: materiaData } = await supabase
      .from('materias')
      .select('nombre')
      .eq('id', materiaId)
      .single();

    const cursoNombre = cursoData?.curso || 'Desconocido';
    const materiaNombre = materiaData?.nombre || 'Desconocida';

    const stats = {
      presentes: 0,
      ausentes: 0,
      tardes: 0,
      justificados: 0,
      total: 0
    };

    for (const it of items) {
      const { alumnoId, estado } = it;
      if (!alumnoId || !estado) continue;

      // 1. Verificar que el alumno pertenece al curso
      const { data: alumno, error: alumnoError } = await supabase
        .from('alumno')
        .select('id')
        .eq('id', alumnoId)
        .eq('id_curso', cursoId)
        .single();

      if (alumnoError || !alumno) {
        console.warn(`Alumno ${alumnoId} no encontrado o no pertenece al curso ${cursoId}.`);
        continue;
      }

      // 2. Preparar el objeto de asistencia
      const presente = estado === 'Presente';
      const tarde = estado === 'Tarde';
      const justificada = estado === 'Justificado';

      // Actualizar estadísticas
      stats.total++;
      if (presente) stats.presentes++;
      else if (tarde) stats.tardes++;
      else if (justificada) stats.justificados++;
      else stats.ausentes++;

      const record = {
        id_alumno: alumnoId,
        id_materia: materiaId,
        fecha: fecha,
        presente: presente,
        tarde: tarde,
        justificada: justificada,
        created_by: createdBy,
      };

      // 3. Buscar asistencia existente para el alumno/materia/fecha
      const { data: existing, error: fetchError } = await supabase
        .from('asistencias')
        .select('id')
        .eq('id_alumno', alumnoId)
        .eq('id_materia', materiaId)
        .eq('fecha', fecha)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      // 4. Decidir si actualizar o insertar (Upsert)
      if (existing) {
        operations.push(
          supabase
            .from('asistencias')
            .update(record)
            .eq('id', existing.id)
        );
      } else {
        operations.push(
          supabase
            .from('asistencias')
            .insert(record)
        );
      }
    } // Fin del for

    // Ejecutar todas las operaciones de forma concurrente
    await Promise.all(operations);

    // Log de la acción masiva (una sola vez)
    await registrarAccion({
      idUsuario: createdBy,
      accion: ACCIONES.CARGA_LISTA_ASISTENCIA,
      tablaAfectada: TABLAS.ASISTENCIAS,
      idRegistroAfectado: `${cursoId}-${materiaId}-${fecha}`, // ID compuesto lógico
      detalles: {
        curso: cursoNombre,
        materia: materiaNombre,
        fecha: fecha,
        resumen: stats
      }
    });

    return res.json({ ok: true, message: 'Lista pasada con éxito.' });
  } catch (e) {
    console.error('Error en POST /asistencias/pasar-lista:', e);
    return res.status(500).json({ message: 'Error' });
  }
}); // Fin del router.post


// --- PUT /:id ---
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { estado, observaciones } = req.body || {}; // Añadida observaciones si se requiere
  if (!estado) return res.status(400).json({ message: 'estado requerido' });

  try {
    if (!req.user) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    // Obtener asistencia actual (opcional, solo si necesitas validación o datos adicionales)
    const { error: fetchError } = await supabase
      .from('asistencias')
      .select('id')
      .eq('id', id)
      .single();

    if (fetchError && fetchError.code === 'PGRST116') {
      return res.status(404).json({ message: 'No encontrada' });
    } else if (fetchError) {
      throw fetchError;
    }

    // Preparar datos de actualización
    const updateData = {
      presente: estado === 'Presente',
      tarde: estado === 'Tarde', // Asumiendo que 'Tarde' puede ser un estado por sí solo
      justificada: estado === 'Justificado',
      // updated_at: new Date().toISOString() // Mejor dejar que la DB o el trigger lo maneje
    };
    if (observaciones !== undefined) updateData.observaciones = observaciones;

    // Supabase maneja por defecto que los valores booleanos no especificados son false al actualizar.
    // Si necesitas garantizar que solo uno es true, usa lógica explícita:
    // presente: estado === 'Presente',
    // tarde: estado === 'Tarde',
    // justificada: estado === 'Justificado',

    const { error: updateError } = await supabase
      .from('asistencias')
      .update(updateData)
      .eq('id', id);

    if (updateError) throw updateError;

    // Log de la acción de actualización
    await registrarAccion({
      idUsuario: req.user.id_usuario,
      accion: ACCIONES.ACTUALIZAR_ASISTENCIA,
      tablaAfectada: TABLAS.ASISTENCIAS,
      idRegistroAfectado: id,
      detalles: {
        estado_anterior: {
          presente: updateData.presente,
          tarde: updateData.tarde,
          justificada: updateData.justificada
        },
        estado_nuevo: {
          presente: updateData.presente,
          tarde: updateData.tarde,
          justificada: updateData.justificada
        }
      }
    });

    return res.json({ ok: true });
  } catch (e) {
    console.error('Error en PUT /asistencias/:id:', e);
    return res.status(500).json({ message: 'Error' });
  }
});

export default router;