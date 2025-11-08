import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const rows = await query('SELECT id_curso, nombre, anio, division FROM cursos ORDER BY anio, division, nombre');
    return res.json(rows);
  } catch (e) { return res.status(500).json({ message: 'Error' }); }
});

router.get('/:id/alumnos', async (req, res) => {
  const { id } = req.params;
  try {
    const rows = await query(`
      SELECT u.id_usuario AS id_alumno, u.nombre, u.apellido, u.dni, u.email
      FROM alumnos_cursos ac
      JOIN usuarios u ON u.id_usuario = ac.id_alumno
      WHERE ac.id_curso = ?
      ORDER BY u.apellido, u.nombre
    `, [id]);
    return res.json(rows);
  } catch (e) { return res.status(500).json({ message: 'Error' }); }
});

router.get('/:id/materias', async (req, res) => {
  const { id } = req.params;
  try {
    const rows = await query(`
      SELECT m.id_materia, m.nombre, m.id_profesor, u.nombre AS profesor_nombre, u.apellido AS profesor_apellido
      FROM materias m
      LEFT JOIN usuarios u ON u.id_usuario = m.id_profesor
      WHERE m.id_curso = ?
      ORDER BY m.nombre
    `, [id]);
    return res.json(rows);
  } catch (e) { return res.status(500).json({ message: 'Error' }); }
});

router.get('/:id/estado', async (req, res) => {
  const { id } = req.params; // curso
  const { fecha } = req.query;
  if (!fecha) return res.status(400).json({ message: 'fecha requerida (YYYY-MM-DD)' });
  try {
    const tot = await query(`
      SELECT 
        SUM(CASE WHEN a.estado = 'Presente' THEN 1 ELSE 0 END) AS presentes,
        SUM(CASE WHEN a.estado = 'Ausente' THEN 1 ELSE 0 END) AS ausentes,
        SUM(CASE WHEN a.estado = 'Tarde' THEN 1 ELSE 0 END) AS tardes,
        SUM(CASE WHEN a.estado = 'Justificado' THEN 1 ELSE 0 END) AS justificados,
        COUNT(*) AS total
      FROM asistencias a
      JOIN materias m ON m.id_materia = a.id_materia
      WHERE m.id_curso = ? AND a.fecha = ?
    `, [id, fecha]);
    const hay = await query(`
      SELECT COUNT(*) AS c FROM asistencias a
      JOIN materias m ON m.id_materia = a.id_materia
      WHERE m.id_curso = ? AND a.fecha = ?
    `, [id, fecha]);
    const lista_pasada = (hay[0]?.c || 0) > 0;
    return res.json({ fecha, lista_pasada, resumen: tot[0] });
  } catch (e) { return res.status(500).json({ message: 'Error' }); }
});

export default router;
