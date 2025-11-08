import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  const { desde, hasta, id_usuario } = req.query;
  const conds = [];
  const params = [];
  if (desde) { conds.push('h.fecha_hora >= ?'); params.push(desde); }
  if (hasta) { conds.push('h.fecha_hora <= ?'); params.push(hasta); }
  if (id_usuario) { conds.push('h.id_usuario = ?'); params.push(id_usuario); }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  try {
    const rows = await query(`
      SELECT h.id_historial, h.id_usuario, h.accion, h.fecha_hora, 
             u.nombre, u.apellido
      FROM historial h
      LEFT JOIN usuarios u ON u.id_usuario = h.id_usuario
      ${where} 
      ORDER BY h.fecha_hora DESC
    `, params);
    return res.json(rows);
  } catch (e) { return res.status(500).json({ message: 'Error' }); }
});

export default router;
