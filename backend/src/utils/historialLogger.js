import { supabase } from '../db.js';

/**
 * Registra una acción en el historial
 * @param {Object} options - Opciones de logging
 * @param {string} options.id_usuario - ID del usuario que realiza la acción
 * @param {string} options.tabla_afectada - Nombre de la tabla modificada
 * @param {string} options.accion - Descripción o tipo de acción (CREATE, UPDATE, DELETE, etc)
 * @param {string} options.id_registro_afectado - ID del registro modificado
 * @param {Object} options.detalles - Detalles adicionales de la acción
 * @returns {Promise<void>}
 */
export async function registrarHistorial({
  id_usuario,
  tabla_afectada,
  accion,
  id_registro_afectado,
  detalles = null
}) {
  try {
    const { error } = await supabase
      .from('historial-registro')
      .insert({
        id_usuario,
        tabla_afectada,
        accion: typeof accion === 'object' ? JSON.stringify(accion) : accion,
        id_registro_afectado,
        detalles,
        fecha_hora: new Date().toISOString()
      });

    if (error) {
      console.error('Error registrando historial:', error);
    }
  } catch (e) {
    console.error('Error en registrarHistorial:', e);
  }
}

/**
 * Middleware para registrar acciones automáticamente
 * Debe usarse en las rutas que quieras auditar
 */
export function loggerMiddleware(tabla_afectada, accionTipo = 'ACCION') {
  return async (req, res, next) => {
    // Guardar el método original de res.json para interceptarlo
    const originalJson = res.json;

    res.json = function(data) {
      // Si la respuesta fue exitosa, registrar en historial
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const id_usuario = req.user?.id_usuario;
        const id_registro = data?.id || req.params?.id || 'desconocido';
        
        if (id_usuario) {
          registrarHistorial({
            id_usuario,
            tabla_afectada,
            accion: `${req.method} ${accionTipo}`,
            id_registro_afectado: id_registro,
            detalles: JSON.stringify({
              metodo: req.method,
              path: req.path,
              body: req.body
            })
          }).catch(e => console.error('Error logging:', e));
        }
      }

      return originalJson.call(this, data);
    };

    next();
  };
}
