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
        usuario:usuarios(id, nombre, apellido, email)
      `);
    
    // Aplicar filtros
    if (desde) query = query.gte('fecha_hora', desde);ñ
    if (hasta) query = query.lte('fecha_hora', hasta + 'T23:59:59'); // Incluir todo el día
    if (id_usuario) query = query.eq('id_usuario', id_usuario);
    
    // Ordenar por fecha más reciente primero
    query = query.order('fecha_hora', { ascending: false });
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error en la consulta a historial-registro:', error);
      throw error;
    }
    
    // Formatear los datos para la respuesta
    const formattedData = data.map(item => ({
      id_historial: item.id,
      id_usuario: item.id_usuario,
      accion: item.accion,
      fecha_hora: item.fecha_hora,
      tabla_afectada: item.tabla_afectada,
      id_registro_afectado: item.id_registro_afectado,
      usuario: item.usuario ? {
        id: item.usuario.id,
        nombre: item.usuario.nombre || '',
        apellido: item.usuario.apellido || '',
        email: item.usuario.email
      } : null
    }));
    
    return res.json(formattedData);
  } catch (e) {
    console.error('Error en GET /historial:', e);
    return res.status(500).json({ message: 'Error' });
  }
});

export default router;
