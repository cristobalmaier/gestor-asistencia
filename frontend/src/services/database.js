import { supabase, TABLES } from '../lib/supabase';

// Operaciones para la tabla de alumnos
export const alumnoService = {
  // Obtener todos los alumnos
  getAll: async () => {
    const { data, error } = await supabase
      .from(TABLES.ALUMNOS)
      .select(`
        *,
        ${TABLES.CURSOS} (id, curso, turno)
      `);
    
    if (error) throw error;
    return data;
  },

  // Obtener un alumno por ID
  getById: async (id) => {
    const { data, error } = await supabase
      .from(TABLES.ALUMNOS)
      .select(`
        *,
        ${TABLES.CURSOS} (id, curso, turno)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Crear un nuevo alumno
  create: async (alumnoData) => {
    const { data, error } = await supabase
      .from(TABLES.ALUMNOS)
      .insert([alumnoData])
      .select();
    
    if (error) throw error;
    return data[0];
  },

  // Actualizar un alumno
  update: async (id, updates) => {
    const { data, error } = await supabase
      .from(TABLES.ALUMNOS)
      .update(updates)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data[0];
  },

  // Eliminar un alumno
  delete: async (id) => {
    const { error } = await supabase
      .from(TABLES.ALUMNOS)
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  },

  // Obtener inasistencias de un alumno
  getInasistencias: async (alumnoId) => {
    const { data, error } = await supabase
      .from('inasistencias')
      .select('*')
      .eq('alumno_id', alumnoId);
    
    if (error) throw error;
    return data;
  },
};

// Operaciones para la tabla de cursos
export const cursoService = {
  // Obtener todos los cursos
  getAll: async () => {
    const { data, error } = await supabase
      .from(TABLES.CURSOS)
      .select('*')
      .order('curso');
    
    if (error) throw error;
    return data;
  },

  // Obtener un curso por ID
  getById: async (id) => {
    const { data, error } = await supabase
      .from(TABLES.CURSOS)
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },
};

// Operaciones para la tabla de materias
export const materiaService = {
  // Obtener todas las materias
  getAll: async () => {
    const { data, error } = await supabase
      .from(TABLES.MATERIAS)
      .select(`
        *,
        ${TABLES.CURSOS} (id, curso, turno)
      `);
    
    if (error) throw error;
    return data;
  },

  // Obtener materias por curso
  getByCurso: async (cursoId) => {
    const { data, error } = await supabase
      .from(TABLES.MATERIAS)
      .select('*')
      .eq('curso_id', cursoId);
    
    if (error) throw error;
    return data;
  },
};

// Operaciones para el historial académico
export const historialService = {
  // Obtener historial de un alumno
  getByAlumno: async (alumnoId) => {
    const { data, error } = await supabase
      .from('historial_alumno')
      .select(`
        *,
        ${TABLES.MATERIAS} (id, nombre)
      `)
      .eq('id_alumno', alumnoId);
    
    if (error) throw error;
    return data;
  },

  // Agregar registro al historial
  addRegistro: async (registroData) => {
    const { data, error } = await supabase
      .from('historial_alumno')
      .insert([registroData])
      .select();
    
    if (error) throw error;
    return data[0];
  },
};

// Operaciones para la gestión de usuarios
export const usuarioService = {
  // Obtener todos los usuarios con sus roles
  getAllWithRoles: async () => {
    const { data, error } = await supabase
      .from('usuarios_roles')
      .select(`
        *,
        user:user_id (id, email, created_at)
      `);
    
    if (error) throw error;
    return data;
  },

  // Asignar rol a un usuario
  asignarRol: async (userId, rol) => {
    const { data, error } = await supabase
      .from('usuarios_roles')
      .upsert([
        { user_id: userId, rol }
      ], {
        onConflict: 'user_id'
      });
    
    if (error) throw error;
    return data;
  },

  // Obtener rol de un usuario
  getRol: async (userId) => {
    const { data, error } = await supabase
      .from('usuarios_roles')
      .select('rol')
      .eq('user_id', userId)
      .single();
    
    if (error) return null;
    return data?.rol;
  },
};

export default {
  alumno: alumnoService,
  curso: cursoService,
  materia: materiaService,
  historial: historialService,
  usuario: usuarioService,
};
