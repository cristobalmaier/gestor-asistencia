import { Router } from 'express';
import { supabase } from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { data: cursos, error } = await supabase
      .from('curso')
      .select('*')
      .order('curso');

    if (error) throw error;

    // Transformar al formato esperado (si el frontend espera anio y division)
    // Nota: El esquema de Supabase solo tiene 'curso' y 'turno'
    // Puedes necesitar ajustar esto según cómo quieras mapear los datos
    const transformed = cursos.map(c => ({
      id_curso: c.id,
      nombre: c.curso,
      turno: c.turno,
      // Para compatibilidad, puedes parsear el curso si tiene formato "1°A" o similar
      curso: c.curso
    }));

    return res.json(transformed);
  } catch (e) {
    console.error('Error en GET /cursos:', e);
    return res.status(500).json({ message: 'Error' });
  }
});

router.get('/alumnos', async (req, res) => {
  try {
    const { data: alumnos, error } = await supabase
      .from('alumno')
      .select('id, nombre, apellido, dni, email, id_curso, curso:curso_id(curso)')
      .order('apellido')
      .order('nombre');

    if (error) throw error;

    const transformed = alumnos.map(a => ({
      id_alumno: a.id,
      nombre: a.nombre,
      apellido: a.apellido,
      dni: a.dni,
      email: a.email,
      id_curso: a.id_curso,
      curso_nombre: a.curso?.curso || 'Sin curso'
    }));

    return res.json(transformed);
  } catch (e) {
    console.error('Error en GET /alumnos:', e);
    return res.status(500).json({ message: 'Error retrieving all students' });
  }
});

router.get('/:id/alumnos', async (req, res) => {
  const { id } = req.params;
  try {
    const { data: alumnos, error } = await supabase
      .from('alumno')
      .select('id, nombre, apellido, dni, email, id_curso, curso:curso_id(curso)')
      .eq('id_curso', id)
      .order('apellido')
      .order('nombre');

    if (error) throw error;

    const transformed = alumnos.map(a => ({
      id_alumno: a.id,
      nombre: a.nombre,
      apellido: a.apellido,
      dni: a.dni,
      email: a.email,
      id_curso: a.id_curso,
      curso_nombre: a.curso?.curso || 'Sin curso'
    }));

    return res.json(transformed);
  } catch (e) {
    console.error('Error en GET /cursos/:id/alumnos:', e);
    return res.status(500).json({ message: 'Error retrieving students' });
  }
});

router.get('/:id/materias', async (req, res) => {
  const { id } = req.params;
  try {
    const { data: materias, error } = await supabase
      .from('materias')
      .select(`
        id,
        nombre,
        profesor,
        curso_id
      `)
      .eq('curso_id', id)
      .order('nombre');

    if (error) throw error;

    // El campo 'profesor' es texto, no hay FK a teachers en el esquema actual
    // Si el profesor está en formato "Nombre Apellido", lo separamos
    const transformed = materias.map(m => {
      const profesorParts = m.profesor ? m.profesor.trim().split(' ') : [];
      const apellido = profesorParts.length > 1 ? profesorParts.pop() : '';
      const nombre = profesorParts.join(' ');

      return {
        id_materia: m.id,
        nombre: m.nombre,
        id_profesor: null, // No hay FK en el esquema actual
        profesor_nombre: nombre || m.profesor || '',
        profesor_apellido: apellido
      };
    });

    return res.json(transformed);
  } catch (e) {
    console.error('Error en GET /cursos/:id/materias:', e);
    return res.status(500).json({ message: 'Error' });
  }
});

router.get('/:id/estado', async (req, res) => {
  const { id } = req.params; // curso
  const { fecha } = req.query;
  if (!fecha) return res.status(400).json({ message: 'fecha requerida (YYYY-MM-DD)' });

  try {
    // Obtener materias del curso
    const { data: materias } = await supabase
      .from('materias')
      .select('id')
      .eq('curso_id', id);

    const materiaIds = materias?.map(m => m.id) || [];

    if (materiaIds.length === 0) {
      return res.json({
        fecha,
        lista_pasada: false,
        resumen: {
          presentes: 0,
          ausentes: 0,
          tardes: 0,
          justificados: 0,
          total: 0
        }
      });
    }

    // Obtener asistencias del día para todas las materias del curso
    const { data: asistencias, error } = await supabase
      .from('asistencias')
      .select('presente, justificada')
      .in('id_materia', materiaIds)
      .eq('fecha', fecha);

    if (error) throw error;

    const resumen = {
      presentes: asistencias.filter(a => a.presente).length,
      ausentes: asistencias.filter(a => !a.presente && !a.justificada).length,
      tardes: 0, // No hay campo "tarde" en el nuevo esquema
      justificados: asistencias.filter(a => a.justificada).length,
      total: asistencias.length
    };

    return res.json({
      fecha,
      lista_pasada: asistencias.length > 0,
      resumen
    });
  } catch (e) {
    console.error('Error en GET /cursos/:id/estado:', e);
    return res.status(500).json({ message: 'Error' });
  }
});

export default router;
