import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  const { desde, hasta, id_usuario } = req.query;
  const conds = [];
  const params = [];
  if (desde) { conds.push('fecha_hora >= ?'); params.push(desde); }
  if (hasta) { conds.push('fecha_hora <= ?'); params.push(hasta); }
  if (id_usuario) { conds.push('id_usuario = ?'); params.push(id_usuario); }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  try {
    const rows = await query(`SELECT id_historial, id_usuario, accion, fecha_hora FROM historial ${where} ORDER BY fecha_hora DESC`, params);
    return res.json(rows);
  } catch (e) { return res.status(500).json({ message: 'Error' }); }
});

export default router;
