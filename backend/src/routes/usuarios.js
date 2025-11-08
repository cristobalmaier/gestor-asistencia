import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

// Buscar profesores por nombre o apellido
router.get('/profesores', async (req, res) => {
  const { busqueda } = req.query;
  try {
    let sql = `
      SELECT DISTINCT u.id_usuario, u.nombre, u.apellido, u.email
      FROM usuarios u
      JOIN materias m ON m.id_profesor = u.id_usuario
      WHERE u.rol = 'profesor'
    `;
    const params = [];
    
    if (busqueda) {
      sql += ` AND (u.nombre LIKE ? OR u.apellido LIKE ?)`;
      const searchTerm = `%${busqueda}%`;
      params.push(searchTerm, searchTerm);
    }
    
    sql += ` ORDER BY u.apellido, u.nombre`;
    
    const rows = await query(sql, params);
    return res.json(rows);
  } catch (e) {
    return res.status(500).json({ message: 'Error' });
  }
});

// Buscar alumnos por nombre o apellido
router.get('/alumnos', async (req, res) => {
  const { busqueda } = req.query;
  try {
    let sql = `
      SELECT DISTINCT u.id_usuario, u.nombre, u.apellido, u.email, u.dni
      FROM usuarios u
      JOIN alumnos_cursos ac ON ac.id_alumno = u.id_usuario
      WHERE u.rol = 'alumno'
    `;
    const params = [];
    
    if (busqueda) {
      sql += ` AND (u.nombre LIKE ? OR u.apellido LIKE ?)`;
      const searchTerm = `%${busqueda}%`;
      params.push(searchTerm, searchTerm);
    }
    
    sql += ` ORDER BY u.apellido, u.nombre`;
    
    const rows = await query(sql, params);
    return res.json(rows);
  } catch (e) {
    return res.status(500).json({ message: 'Error' });
  }
});

export default router;

