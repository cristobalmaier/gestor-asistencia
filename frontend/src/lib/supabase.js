import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const TABLES = {
  USUARIOS: 'usuarios',
  ALUMNOS: 'alumno',
  CURSOS: 'curso',
  MATERIAS: 'materias',
  HISTORIAL: 'historial_alumno',
  USUARIOS_ROLES: 'usuarios_roles'
};

export const ROLES = {
  ADMIN: 'admin',
  PROFESOR: 'profesor',
  PADRE: 'padre',
  ALUMNO: 'alumno',
  PRECEPTOR: 'preceptor',
  DIRECTIVO: 'directivo'
};
