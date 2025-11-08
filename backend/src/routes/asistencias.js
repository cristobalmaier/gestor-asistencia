import { Router } from 'express';
import { pool, query } from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  const { cursoId, alumnoId, materiaId, profesorId, preceptorId, desde, hasta } = req.query;
  const conds = [];
  const params = [];
  if (alumnoId) { conds.push('a.id_alumno = ?'); params.push(alumnoId); }
  if (materiaId) { conds.push('a.id_materia = ?'); params.push(materiaId); }
  if (profesorId) { conds.push('a.id_profesor = ?'); params.push(profesorId); }
  if (preceptorId) { conds.push('a.id_preceptor = ?'); params.push(preceptorId); }
  if (desde) { conds.push('a.fecha >= ?'); params.push(desde); }
  if (hasta) { conds.push('a.fecha <= ?'); params.push(hasta); }
  if (cursoId) { conds.push('m.id_curso = ?'); params.push(cursoId); }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  try {
    const rows = await query(`
      SELECT a.id_asistencia, a.id_alumno, u.nombre AS alumno_nombre, u.apellido AS alumno_apellido,
             a.id_materia, m.nombre AS materia,
             a.id_profesor, p.nombre AS profesor_nombre, p.apellido AS profesor_apellido,
             a.id_preceptor, pr.nombre AS preceptor_nombre, pr.apellido AS preceptor_apellido,
             a.fecha, a.estado, a.hora_registro, m.id_curso
      FROM asistencias a
      JOIN usuarios u ON u.id_usuario = a.id_alumno
      JOIN materias m ON m.id_materia = a.id_materia
      LEFT JOIN usuarios p ON p.id_usuario = a.id_profesor
      LEFT JOIN usuarios pr ON pr.id_usuario = a.id_preceptor
      ${where}
      ORDER BY a.fecha DESC, alumno_apellido, alumno_nombre
    `, params);
    return res.json(rows);
  } catch (e) { return res.status(500).json({ message: 'Error' }); }
});

router.get('/dia', async (req, res) => {
  const { cursoId, materiaId, fecha } = req.query;
  if (!cursoId || !materiaId || !fecha) return res.status(400).json({ message: 'cursoId, materiaId y fecha son requeridos' });
  try {
    const alumnos = await query(`
      SELECT u.id_usuario AS id_alumno, u.nombre, u.apellido
      FROM alumnos_cursos ac JOIN usuarios u ON u.id_usuario = ac.id_alumno
      WHERE ac.id_curso = ?
      ORDER BY u.apellido, u.nombre
    `, [cursoId]);
    const asist = await query(`
      SELECT id_alumno, estado FROM asistencias WHERE id_materia = ? AND fecha = ?
    `, [materiaId, fecha]);
    const map = new Map(asist.map(r => [r.id_alumno, r.estado]));
    const data = alumnos.map(a => ({ ...a, estado: map.get(a.id_alumno) || null }));
    return res.json({ alumnos: data });
  } catch (e) { return res.status(500).json({ message: 'Error' }); }
});

router.post('/pasar-lista', async (req, res) => {
  const { cursoId, materiaId, fecha, items } = req.body || {};
  if (!cursoId || !materiaId || !fecha || !Array.isArray(items)) {
    return res.status(400).json({ message: 'cursoId, materiaId, fecha, items requeridos' });
  }
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    for (const it of items) {
      const { alumnoId, estado } = it;
      if (!alumnoId || !estado) continue;
      const [belongs] = await conn.execute('SELECT 1 FROM alumnos_cursos WHERE id_alumno = ? AND id_curso = ? LIMIT 1', [alumnoId, cursoId]);
      if (belongs.length === 0) continue;
      await conn.execute('DELETE FROM asistencias WHERE id_alumno = ? AND id_materia = ? AND fecha = ?', [alumnoId, materiaId, fecha]);
      const rol = req.user?.rol;
      const id_profesor = rol === 'profesor' ? req.user.id_usuario : null;
      const id_preceptor = rol === 'preceptor' ? req.user.id_usuario : null;
      await conn.execute(
        'INSERT INTO asistencias (id_alumno, id_materia, id_profesor, id_preceptor, fecha, estado) VALUES (?,?,?,?,?,?)',
        [alumnoId, materiaId, id_profesor, id_preceptor, fecha, estado]
      );
    }
    await conn.execute('INSERT INTO historial (id_usuario, accion) VALUES (?, ?)', [req.user.id_usuario, JSON.stringify({ tipo: 'CARGA_LISTA', cursoId, materiaId, fecha, cantidad: items.length })]);
    await conn.commit();
    return res.json({ ok: true });
  } catch (e) {
    try { await conn.rollback(); } catch {}
    return res.status(500).json({ message: 'Error' });
  } finally { conn.release(); }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body || {};
  if (!estado) return res.status(400).json({ message: 'estado requerido' });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [prevRows] = await conn.execute('SELECT * FROM asistencias WHERE id_asistencia = ? FOR UPDATE', [id]);
    if (!prevRows.length) { await conn.rollback(); return res.status(404).json({ message: 'No encontrada' }); }
    const prev = prevRows[0];
    const rol = req.user?.rol;
    const id_profesor = rol === 'profesor' ? req.user.id_usuario : prev.id_profesor;
    const id_preceptor = rol === 'preceptor' ? req.user.id_usuario : prev.id_preceptor;
    await conn.execute('UPDATE asistencias SET estado = ?, id_profesor = ?, id_preceptor = ? WHERE id_asistencia = ?', [estado, id_profesor, id_preceptor, id]);
    await conn.execute('INSERT INTO historial (id_usuario, accion) VALUES (?, ?)', [req.user.id_usuario, JSON.stringify({ tipo: 'MODIFICA_ASISTENCIA', id, antes: prev.estado, despues: estado })]);
    await conn.commit();
    return res.json({ ok: true });
  } catch (e) {
    try { await conn.rollback(); } catch {}
    return res.status(500).json({ message: 'Error' });
  } finally { conn.release(); }
});

export default router;
