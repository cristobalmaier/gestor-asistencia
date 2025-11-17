import { Router } from 'express';
import { supabase, queryTable, insert, update as updateRecord, remove } from '../db.js';

const router = Router();

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
      const { data: materias } = await supabase
        .from('materias')
        .select('id')
        .eq('curso_id', cursoId);
      
      const materiaIds = materias?.map(m => m.id) || [];
      if (materiaIds.length > 0) {
        query = query.in('id_materia', materiaIds);
      } else {
        return res.json([]);
      }
    }
    
    query = query.order('fecha', { ascending: false });
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Transformar datos al formato esperado por el frontend
    const transformed = data.map(a => ({
      id_asistencia: a.id,
      id_alumno: a.id_alumno,
      alumno_nombre: a.alumno?.nombre || '',
      alumno_apellido: a.alumno?.apellido || '',
      id_materia: a.id_materia,
      materia: a.materia?.nombre || '',
      fecha: a.fecha,
      estado: a.presente ? 'Presente' : (a.justificada ? 'Justificado' : 'Ausente'),
      justificada: a.justificada,
      observaciones: a.observaciones
    }));
    
    return res.json(transformed);
  } catch (e) {
    console.error('Error en GET /asistencias:', e);
    return res.status(500).json({ message: 'Error' });
  }
});

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
      .select('id_alumno, presente, justificada')
      .eq('id_materia', materiaId)
      .eq('fecha', fecha);
    
    if (asistError) throw asistError;
    
    const asistMap = new Map();
    asistencias.forEach(a => {
      let estado = 'Ausente';
      if (a.presente) estado = 'Presente';
      else if (a.justificada) estado = 'Justificado';
      asistMap.set(a.id_alumno, estado);
    });
    
    const data = alumnos.map(a => ({
      id_alumno: a.id,
      nombre: a.nombre,
      apellido: a.apellido,
      estado: asistMap.get(a.id) || null
    }));
    
    return res.json({ alumnos: data });
  } catch (e) {
    console.error('Error en GET /asistencias/dia:', e);
    return res.status(500).json({ message: 'Error' });
  }
});

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
    
    for (const it of items) {
      const { alumnoId, estado } = it;
      if (!alumnoId || !estado) continue;
      
      // Verificar que el alumno pertenece al curso
      const { data: alumno } = await supabase
        .from('alumno')
        .select('id')
        .eq('id', alumnoId)
        .eq('id_curso', cursoId)
        .single();
      
      if (!alumno) continue;
      
      // Determinar presente y justificada según el estado
      const presente = estado === 'Presente';
      const justificada = estado === 'Justificado';
      
      // Eliminar asistencia existente si existe
      await supabase
        .from('asistencias')
        .delete()
        .eq('id_alumno', alumnoId)
        .eq('id_materia', materiaId)
        .eq('fecha', fecha);
      
      // Insertar nueva asistencia
      const { error: insertError } = await supabase
        .from('asistencias')
        .insert({
          id_alumno: alumnoId,
          id_materia: materiaId,
          fecha: fecha,
          presente: presente,
          justificada: justificada,
          created_by: req.user.id_usuario
        });
      
      if (insertError) {
        console.error('Error insertando asistencia:', insertError);
      }
    }
    
    return res.json({ ok: true });
  } catch (e) {
    console.error('Error en POST /asistencias/pasar-lista:', e);
    return res.status(500).json({ message: 'Error' });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body || {};
  if (!estado) return res.status(400).json({ message: 'estado requerido' });
  
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'No autenticado' });
    }
    
    // Obtener asistencia actual
    const { data: asistencia, error: fetchError } = await supabase
      .from('asistencias')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError || !asistencia) {
      return res.status(404).json({ message: 'No encontrada' });
    }
    
    // Actualizar estado
    const presente = estado === 'Presente';
    const justificada = estado === 'Justificado';
    
    const { error: updateError } = await supabase
      .from('asistencias')
      .update({
        presente: presente,
        justificada: justificada,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
    
    if (updateError) throw updateError;
    
    return res.json({ ok: true });
  } catch (e) {
    console.error('Error en PUT /asistencias/:id:', e);
    return res.status(500).json({ message: 'Error' });
  }
});

export default router;
