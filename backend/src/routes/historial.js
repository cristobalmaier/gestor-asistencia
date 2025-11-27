import { Router } from 'express';
import { supabase } from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  const { desde, hasta, id_usuario } = req.query;
  
  try {
    let query = supabase
      .from('historial-registro')
      .select(`
        id,
        id_usuario,
        accion,
        fecha_hora,
        tabla_afectada,
        id_registro_afectado,
        detalles
      `);
    
    // Aplicar filtros
    if (desde) query = query.gte('fecha_hora', desde);
    if (hasta) query = query.lte('fecha_hora', hasta + 'T23:59:59'); // Incluir todo el día
    if (id_usuario) query = query.eq('id_usuario', id_usuario);
    
    // Ordenar por fecha más reciente primero
    query = query.order('fecha_hora', { ascending: false });
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error en la consulta a historial-registro:', error);
      throw error;
    }
    
    // Obtener información de usuarios desde public.users
    const usuariosSet = new Set(data.map(d => d.id_usuario).filter(Boolean));
    let usuariosMap = {};
    
    if (usuariosSet.size > 0) {
      const { data: usuarios, error: usuariosError } = await supabase
        .from('users')
        .select('id, nombre, apellido, email')
        .in('id', Array.from(usuariosSet));
      
      if (!usuariosError && usuarios) {
        usuariosMap = usuarios.reduce((acc, u) => {
          acc[u.id] = u;
          return acc;
        }, {});
      }
    }
    
    // Formatear los datos para la respuesta
    const formattedData = data.map(item => {
      // Parsear la acción si es JSON
      let accion = item.accion;
      if (typeof accion === 'string') {
        try {
          accion = JSON.parse(accion);
        } catch (e) {
          // Si no es JSON válido, mantenerlo como string
        }
      }
      
      const usuario = usuariosMap[item.id_usuario];
      
      return {
        id_historial: item.id,
        id_usuario: item.id_usuario,
        usuario: usuario ? {
          id: usuario.id,
          nombre: usuario.nombre || '',
          apellido: usuario.apellido || '',
          email: usuario.email
        } : { nombre: 'Usuario desconocido', apellido: '', email: '' },
        accion: accion,
        tabla_afectada: item.tabla_afectada,
        id_registro_afectado: item.id_registro_afectado,
        fecha_hora: item.fecha_hora,
        detalles: item.detalles
      };
    });
    
    return res.json(formattedData);
  } catch (e) {
    console.error('Error en GET /historial:', e);
    return res.status(500).json({ message: 'Error al obtener historial' });
  }
});

export default router;
