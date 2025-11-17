import { Router } from 'express';
import { supabase } from '../db.js';

const router = Router();

router.get('/mis-materias', async (req, res) => {
  const { id_usuario } = req.user;
  if (!id_usuario) {
    return res.status(401).json({ message: 'No autenticado' });
  }
  
  try {
    // Buscar el teacher por user_id
    const { data: teacher, error: teacherError } = await supabase
      .from('teachers')
      .select('id, first_name, last_name')
      .or(`id.eq.${id_usuario},user_id.eq.${id_usuario}`)
      .single();
    
    if (teacherError || !teacher) {
      return res.json([]);
    }
    
    // Buscar materias asignadas al profesor
    // Opción 1: Usar teacher_subjects si está configurado
    const { data: teacherSubjects } = await supabase
      .from('teacher_subjects')
      .select('subject_id')
      .eq('teacher_id', teacher.id);
    
    const subjectIds = teacherSubjects?.map(ts => ts.subject_id) || [];
    
    let materiasQuery = supabase
      .from('materias')
      .select(`
        id,
        nombre,
        curso_id,
        curso:curso(id, curso, turno)
      `);
    
    if (subjectIds.length > 0) {
      // Si hay teacher_subjects, usar esos
      materiasQuery = materiasQuery.in('id', subjectIds);
    } else {
      // Fallback: buscar por campo profesor (text)
      materiasQuery = materiasQuery.eq('profesor', `${teacher.first_name} ${teacher.last_name}`);
    }
    
    const { data: materias, error } = await materiasQuery.order('nombre');
    
    if (error) throw error;
    
    // Transformar al formato esperado
    const transformed = materias.map(m => ({
      id_materia: m.id,
      materia: m.nombre,
      id_curso: m.curso_id,
      curso: m.curso?.curso || '',
      anio: null, // No disponible en el nuevo esquema
      division: null // No disponible en el nuevo esquema
    }));
    
    return res.json(transformed);
  } catch (e) {
    console.error('Error en GET /profesor/mis-materias:', e);
    return res.status(500).json({ message: 'Error' });
  }
});

export default router;
