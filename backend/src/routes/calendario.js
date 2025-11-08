import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  const { fecha, cursoId } = req.query;
  const conds = [];
  const params = [];
  if (fecha) { conds.push('fecha = ?'); params.push(fecha); }
  if (cursoId) { conds.push('id_curso = ?'); params.push(cursoId); }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  try {
    const eventos = await query(`SELECT id_evento, fecha, descripcion, id_curso FROM calendario ${where} ORDER BY fecha DESC` , params);
    return res.json(eventos);
  } catch (e) { return res.status(500).json({ message: 'Error' }); }
});

router.post('/', async (req, res) => {
  const { fecha, descripcion, cursoId } = req.body || {};
  if (!fecha) return res.status(400).json({ message: 'fecha requerida' });
  if (!['admin','preceptor'].includes(req.user?.rol)) return res.status(403).json({ message: 'Sin permisos' });
  try {
    await query('INSERT INTO calendario (fecha, descripcion, id_curso) VALUES (?,?,?)', [fecha, descripcion || null, cursoId || null]);
    return res.json({ ok: true });
  } catch (e) { return res.status(500).json({ message: 'Error' }); }
});

export default router;
