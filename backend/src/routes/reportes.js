import { Router } from 'express';
import { query } from '../db.js';
import { Parser } from 'json2csv';

const router = Router();

router.get('/curso', async (req, res) => {
  const { cursoId, desde, hasta, materiaId, profesorId, format } = req.query;
  if (!cursoId) return res.status(400).json({ message: 'cursoId requerido' });
  const conds = ['m.id_curso = ?'];
  const params = [cursoId];
  if (desde) { conds.push('a.fecha >= ?'); params.push(desde); }
  if (hasta) { conds.push('a.fecha <= ?'); params.push(hasta); }
  if (materiaId) { conds.push('a.id_materia = ?'); params.push(materiaId); }
  if (profesorId) { conds.push('a.id_profesor = ?'); params.push(profesorId); }
  const where = `WHERE ${conds.join(' AND ')}`;
  try {
    const rows = await query(`
      SELECT u.id_usuario AS id_alumno, u.apellido, u.nombre,
        SUM(a.estado='Presente') AS presentes,
        SUM(a.estado='Ausente') AS ausentes,
        SUM(a.estado='Tarde') AS tardes,
        SUM(a.estado='Justificado') AS justificados,
        COUNT(*) AS total
      FROM asistencias a
      JOIN usuarios u ON u.id_usuario = a.id_alumno
      JOIN materias m ON m.id_materia = a.id_materia
      ${where}
      GROUP BY u.id_usuario, u.apellido, u.nombre
      ORDER BY u.apellido, u.nombre
    `, params);
    if (format === 'csv') {
      const parser = new Parser({ fields: ['id_alumno','apellido','nombre','presentes','ausentes','tardes','justificados','total'] });
      const csv = parser.parse(rows);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="reporte_curso.csv"');
      return res.send(csv);
    }
    return res.json(rows);
  } catch (e) { return res.status(500).json({ message: 'Error' }); }
});

router.get('/alumno', async (req, res) => {
  const { alumnoId, desde, hasta, materiaId, format } = req.query;
  const uid = alumnoId || req.user?.id_usuario;
  if (!uid) return res.status(400).json({ message: 'alumnoId requerido' });
  const conds = ['a.id_alumno = ?'];
  const params = [uid];
  if (desde) { conds.push('a.fecha >= ?'); params.push(desde); }
  if (hasta) { conds.push('a.fecha <= ?'); params.push(hasta); }
  if (materiaId) { conds.push('a.id_materia = ?'); params.push(materiaId); }
  const where = `WHERE ${conds.join(' AND ')}`;
  try {
    const rows = await query(`
      SELECT a.fecha, m.nombre AS materia, a.estado
      FROM asistencias a
      JOIN materias m ON m.id_materia = a.id_materia
      ${where}
      ORDER BY a.fecha DESC, m.nombre
    `, params);
    if (format === 'csv') {
      const parser = new Parser({ fields: ['fecha','materia','estado'] });
      const csv = parser.parse(rows);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="reporte_alumno.csv"');
      return res.send(csv);
    }
    return res.json(rows);
  } catch (e) { return res.status(500).json({ message: 'Error' }); }
});

export default router;
