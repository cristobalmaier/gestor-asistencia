import { Router } from 'express';
import { supabase } from '../db.js';

const router = Router();

router.get('/mis-materias', async (req, res) => {
  const { id_usuario } = req.user;
  if (!id_usuario) {
    return res.status(401).json({ message: 'No autenticado' });
  }
  
  try {
    // Buscar el usuario en public.users
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, nombre, apellido')
      .eq('id', id_usuario)
      .single();
    
    if (userError || !user) {
      return res.json([]);
    }
    
    // Buscar materias por el nombre del profesor
    // Si existe una relación en teacher_subjects, usar esa; si no, buscar por nombre de profesor
    let materias = [];
    
    // Opción 1: Buscar en teacher_subjects si el usuario está vinculado como profesor
    const { data: teacherSubjects } = await supabase
      .from('teacher_subjects')
      .select('subject_id')
      .eq('teacher_id', id_usuario);
    
    if (teacherSubjects && teacherSubjects.length > 0) {
      const subjectIds = teacherSubjects.map(ts => ts.subject_id);
      const { data: subjects } = await supabase
        .from('subjects')
        .select(`
          id,
          name,
          id_curso,
          curso:curso(id, curso, turno)
        `)
        .in('id', subjectIds)
        .order('name');
      
      materias = subjects || [];
    } else {
      // Opción 2: Fallback - buscar por campo profesor (text) en materias
      // Limpiar espacios en blanco y buscar con ILIKE para ser más flexible
      const nombreCompleto = `${user.nombre || ''} ${user.apellido || ''}`.trim().replace(/\s+/g, ' ');
      
      const { data: materiasData } = await supabase
        .from('materias')
        .select(`
          id,
          nombre,
          curso_id,
          curso:curso(id, curso, turno)
        `)
        .ilike('profesor', `%${nombreCompleto}%`)
        .order('nombre');
      
      materias = materiasData || [];
    }
    
    // Transformar al formato esperado
    const transformed = materias.map(m => ({
      id_materia: m.id,
      materia: m.name || m.nombre,
      id_curso: m.id_curso || m.curso_id,
      curso: m.curso?.curso || '',
      anio: null,
      division: null
    }));
    
    return res.json(transformed);
  } catch (e) {
    console.error('Error en GET /profesor/mis-materias:', e);
    return res.status(500).json({ message: 'Error' });
  }
});

export default router;
