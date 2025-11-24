import { Router } from 'express';
import { supabase } from '../db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/login', async (req, res) => {
  console.log('Solicitud de inicio de sesión recibida:', req.body);
  const { email, password } = req.body || {};

  if (!email || !password) {
    console.log('Faltan credenciales');
    return res.status(400).json({ message: 'Email y contraseña requeridos' });
  }

  try {
    console.log(`Buscando usuario: ${email}`);

    // Buscar en la tabla teachers
    const { data: teacher, error: teacherError } = await supabase
      .from('teachers')
      .select('*')
      .eq('email', email)
      .single();

    if (teacherError || !teacher) {
      console.error('Usuario no encontrado en teachers:', email, teacherError);
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    console.log('Usuario encontrado en teachers:', teacher.email);

    // Verificar si el usuario está activo
    if (!teacher.is_active) {
      console.log('Usuario inactivo:', email);
      return res.status(403).json({ message: 'Usuario inactivo' });
    }

    // Verificar la contraseña
    let passwordMatch = false;

    // 1. Primero intentar con bcrypt (método preferido)
    if (teacher.contraseña && (teacher.contraseña.startsWith('$2a$') || teacher.contraseña.startsWith('$2b$'))) {
      try {
        console.log('Verificando contraseña con bcrypt...');
        passwordMatch = await bcrypt.compare(password, teacher.contraseña);
        console.log('Resultado de bcrypt.compare:', passwordMatch);
      } catch (error) {
        console.error('Error al verificar la contraseña con bcrypt:', error);
      }
    }

    // 2. Si no coincidió con bcrypt, intentar comparación directa (solo para desarrollo)
    if (!passwordMatch && teacher.contraseña === password) {
      console.log('Contraseña en texto plano coincide');
      passwordMatch = true;

      // Hashear la contraseña para almacenarla de forma segura
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Actualizar la contraseña a su versión hasheada
      const { error: updateError } = await supabase
        .from('teachers')
        .update({ contraseña: hashedPassword })
        .eq('id', teacher.id);

      if (updateError) {
        console.error('Error al actualizar la contraseña:', updateError);
      } else {
        console.log('Contraseña actualizada a formato hasheado');
      }
    }

    if (!passwordMatch) {
      console.error('Contraseña incorrecta para el usuario:', email);
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // Obtener el rol del usuario desde usuarios_roles (acepta todos los roles)
    console.log('Buscando rol del usuario...');
    const { data: userRole, error: roleError } = await supabase
      .from('usuarios_roles')
      .select('rol')
      .eq('user_id', teacher.user_id || teacher.id)
      .maybeSingle();

    if (roleError) {
      console.log('Error al buscar rol:', roleError);
    }

    const role = userRole?.rol || 'profesor';
    console.log('Rol asignado:', role);

    // Crear el token JWT
    const payload = {
      id_usuario: teacher.user_id || teacher.id,
      nombre: teacher.first_name,
      apellido: teacher.last_name,
      email: teacher.email,
      rol: role,
      is_admin: role === 'admin'
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || 'super_secret_jwt_key', { expiresIn: '12h' });

    console.log('✅ Login exitoso para:', email);

    // Devolver el token y los datos del usuario
    return res.json({
      token,
      user: payload
    });

  } catch (e) {
    console.error('Error en login:', e);
    return res.status(500).json({
      message: 'Error en el servidor durante el inicio de sesión',
      error: process.env.NODE_ENV === 'development' ? e.message : undefined
    });
  }
});

router.get('/me', authenticate, async (req, res) => {
  const { id_usuario } = req.user || {};
  try {
    // Buscar en teachers
    const { data: teacher } = await supabase
      .from('teachers')
      .select('*')
      .or(`id.eq.${id_usuario},user_id.eq.${id_usuario}`)
      .single();

    if (teacher) {
      // Obtener el rol del usuario desde usuarios_roles
      const { data: userRole, error: roleError } = await supabase
        .from('usuarios_roles')
        .select('rol')
        .eq('user_id', teacher.user_id || teacher.id)
        .maybeSingle();

      if (roleError) {
        console.log('Error al buscar rol:', roleError);
      }

      const role = userRole?.rol || 'profesor';

      // Construir respuesta con información del usuario
      return res.json({
        id_usuario: teacher.user_id || teacher.id,
        nombre: teacher.first_name,
        apellido: teacher.last_name,
        email: teacher.email,
        dni: teacher.dni,
        rol: role
      });
    }

    return res.status(404).json({ message: 'Usuario no encontrado' });
  } catch (e) {
    console.error('Error en /me:', e);
    return res.status(500).json({ message: 'Error' });
  }
});

export default router;
