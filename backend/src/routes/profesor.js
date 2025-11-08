import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

router.get('/mis-materias', async (req, res) => {
  const { id_usuario } = req.user;
  try {
    const rows = await query(`
      SELECT m.id_materia, m.nombre AS materia, c.id_curso, c.nombre AS curso, c.anio, c.division
      FROM materias m
      JOIN cursos c ON c.id_curso = m.id_curso
      WHERE m.id_profesor = ?
      ORDER BY c.anio, c.division, m.nombre
    `, [id_usuario]);
    return res.json(rows);
  } catch (e) { return res.status(500).json({ message: 'Error' }); }
});

export default router;
