import 'dotenv/config';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'changeme',
    database: process.env.DB_NAME || 'gestor_asistencias',
    charset: 'utf8mb4_general_ci'
  });
  try {
    const email = process.env.ADMIN_EMAIL || 'admin@colegio.local';
    const pass = process.env.ADMIN_PASSWORD || 'admin123';
    const dni = process.env.ADMIN_DNI || '00000000';
    const nombre = 'Admin';
    const apellido = 'Sistema';
    const [rows] = await conn.execute('SELECT id_usuario FROM usuarios WHERE email = ? LIMIT 1', [email]);
    if (rows.length) {
      console.log('Admin ya existe');
      await conn.end();
      return;
    }
    const hash = await bcrypt.hash(pass, 10);
    await conn.execute(
      'INSERT INTO usuarios (nombre, apellido, dni, email, `contraseña`, rol) VALUES (?,?,?,?,?,?)',
      [nombre, apellido, dni, email, hash, 'admin']
    );
    console.log('Admin creado:', email, 'pass:', pass);
  } catch (e) {
    console.error(e);
  } finally {
    try { await conn.end(); } catch {}
  }
}

main();
