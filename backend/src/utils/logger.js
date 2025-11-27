import { supabase } from '../db.js';

/**
 * Registra una acción en el historial del sistema
 * @param {Object} params - Parámetros de la acción a registrar
 * @param {string} params.idUsuario - ID del usuario que realiza la acción
 * @param {string} params.accion - Nombre de la acción (ej: 'CREAR_ASISTENCIA', 'ACTUALIZAR_ASISTENCIA')
 * @param {string} params.tablaAfectada - Nombre de la tabla afectada (ej: 'asistencias')
 * @param {string} params.idRegistroAfectado - ID del registro afectado
 * @param {Object} [params.detalles] - Detalles adicionales de la acción
 * @returns {Promise<Object>} - Resultado de la inserción
 */
export const registrarAccion = async ({
  idUsuario,
  accion,
  tablaAfectada,
  idRegistroAfectado,
  detalles = {}
}) => {
  try {
    const registro = {
      id_usuario: idUsuario,
      accion: {
        tipo: accion,
        ...detalles
      },
      tabla_afectada: tablaAfectada,
      id_registro_afectado: idRegistroAfectado,
      fecha_hora: new Date().toISOString()
    };

    console.log('Registrando acción en historial:', {
      usuario: idUsuario,
      accion,
      tabla: tablaAfectada,
      registro: idRegistroAfectado
    });

    const { data, error } = await supabase
      .from('historial-registro')
      .insert([registro])
      .select();

    if (error) {
      console.error('Error al registrar acción en el historial:', error);
      // No lanzamos el error para no interrumpir el flujo principal
      return null;
    }

    console.log('✅ Acción registrada exitosamente');
    return data?.[0] || null;
  } catch (error) {
    console.error('Error en registrarAccion:', error);
    // No lanzamos el error para no interrumpir el flujo principal
    return null;
  }
};

// Tipos de acciones comunes
export const ACCIONES = {
  // Autenticación
  INICIO_SESION: 'INICIO_SESION',
  REGISTRO_USUARIO: 'REGISTRO_USUARIO',
  CIERRE_SESION: 'CIERRE_SESION',
  
  // Usuarios
  CREAR_USUARIO: 'CREAR_USUARIO',
  ACTUALIZAR_USUARIO: 'ACTUALIZAR_USUARIO',
  ELIMINAR_USUARIO: 'ELIMINAR_USUARIO',
  ACTUALIZAR_PERFIL: 'ACTUALIZAR_PERFIL',
  
  // Asistencias
  CREAR_ASISTENCIA: 'CREAR_ASISTENCIA',
  ACTUALIZAR_ASISTENCIA: 'ACTUALIZAR_ASISTENCIA',
  ELIMINAR_ASISTENCIA: 'ELIMINAR_ASISTENCIA',
  CARGA_LISTA_ASISTENCIA: 'CARGA_LISTA_ASISTENCIA',
  
  // Cursos
  CREAR_CURSO: 'CREAR_CURSO',
  ACTUALIZAR_CURSO: 'ACTUALIZAR_CURSO',
  ELIMINAR_CURSO: 'ELIMINAR_CURSO',
  
  // Materias
  CREAR_MATERIA: 'CREAR_MATERIA',
  ACTUALIZAR_MATERIA: 'ACTUALIZAR_MATERIA',
  ELIMINAR_MATERIA: 'ELIMINAR_MATERIA',
  
  // Alumnos
  CREAR_ALUMNO: 'CREAR_ALUMNO',
  ACTUALIZAR_ALUMNO: 'ACTUALIZAR_ALUMNO',
  ELIMINAR_ALUMNO: 'ELIMINAR_ALUMNO'
};

// Tablas comunes
export const TABLAS = {
  ASISTENCIAS: 'asistencias',
  CURSOS: 'cursos',
  USUARIOS: 'usuarios',
  MATERIAS: 'materias'
};
