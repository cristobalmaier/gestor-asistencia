import { Router } from 'express';
import { query } from '../db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: 'Email y contraseña requeridos' });
  try {
    const rows = await query('SELECT id_usuario, nombre, apellido, email, dni, rol, `contraseña` AS pass FROM usuarios WHERE email = ? LIMIT 1', [email]);
    console.log('Usuario encontrado:', rows.length > 0, 'Password Hash de DB:', rows.length ? rows[0].pass : 'N/A');
    if (!rows.length) return res.status(401).json({ message: 'Credenciales inválidas' });
    const user = rows[0];
    let ok = false;
    if (user.pass) {
      try { ok = await bcrypt.compare(password, user.pass); } catch {}
      if (!ok && user.pass === password) ok = true; // fallback si la contraseña está en texto plano
    }
    if (!ok) return res.status(401).json({ message: 'Credenciales inválidas' });
    const payload = { id_usuario: user.id_usuario, nombre: user.nombre, apellido: user.apellido, email: user.email, rol: user.rol };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'super_secret_jwt_key', { expiresIn: '12h' });
    return res.json({ token, user: payload });
  } catch (e) {
    return res.status(500).json({ message: 'Error en login' });
  }
});

router.get('/me', authenticate, async (req, res) => {
  const { id_usuario } = req.user || {};
  try {
    const rows = await query('SELECT id_usuario, nombre, apellido, email, dni, rol FROM usuarios WHERE id_usuario = ? LIMIT 1', [id_usuario]);
    if (!rows.length) return res.status(404).json({ message: 'Usuario no encontrado' });
    return res.json(rows[0]);
  } catch (e) {
    return res.status(500).json({ message: 'Error' });
  }
});

export default router;
