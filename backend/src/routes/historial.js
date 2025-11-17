import { Router } from 'express';
import { supabase } from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  const { desde, hasta, id_usuario } = req.query;
  
  try {
    // Nota: El esquema de Supabase no tiene una tabla "historial" directa
    // Podrías necesitar crear una tabla de auditoría o usar otra fuente
    // Por ahora, retornamos un array vacío o puedes implementar un sistema de logs
    
    // Si tienes una tabla de historial/auditoría en Supabase, úsala aquí
    // Ejemplo si existiera:
    /*
    let query = supabase
      .from('historial')
      .select(`
        id,
        id_usuario,
        accion,
        fecha_hora,
        usuario:users(id, email)
      `);
    
    if (desde) query = query.gte('fecha_hora', desde);
    if (hasta) query = query.lte('fecha_hora', hasta);
    if (id_usuario) query = query.eq('id_usuario', id_usuario);
    
    query = query.order('fecha_hora', { ascending: false });
    
    const { data, error } = await query;
    if (error) throw error;
    */
    
    // Por ahora retornamos un array vacío
    // TODO: Implementar tabla de historial en Supabase si es necesario
    return res.json([]);
  } catch (e) {
    console.error('Error en GET /historial:', e);
    return res.status(500).json({ message: 'Error' });
  }
});

export default router;
