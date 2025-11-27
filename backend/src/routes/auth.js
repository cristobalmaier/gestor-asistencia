import { Router } from 'express';
import { supabase } from '../db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authenticate } from '../middleware/auth.js';
import { registrarAccion, ACCIONES, TABLAS } from '../utils/logger.js';

const router = Router();

router.post('/signup', async (req, res) => {
  const { email, password, nombre, apellido } = req.body || {};
  
  if (!email || !password || !nombre || !apellido) {
    return res.status(400).json({ message: 'Todos los campos son requeridos' });
  }

  try {
    // Hashear la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Crear usuario en public.users
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({
        email,
        contraseña: hashedPassword,
        nombre,
        apellido,
        full_name: `${nombre} ${apellido}`,
        rol: 'profesor'
      })
      .select()
      .single();

    if (userError) {
      console.error('Error al crear usuario:', userError);
      return res.status(400).json({ message: 'Error al crear usuario', error: userError.message });
    }

    // Asignar rol por defecto
    const { error: roleError } = await supabase
      .from('usuarios_roles')
      .insert({
        user_id: newUser.id,
        rol: 'profesor'
      });

    if (roleError) {
      console.error('Error al asignar rol:', roleError);
    }

    console.log('✅ Usuario registrado exitosamente:', newUser.email);
    
    // Registrar el registro de usuario en el historial
    await registrarAccion({
      idUsuario: newUser.id,
      accion: ACCIONES.REGISTRO_USUARIO,
      tablaAfectada: TABLAS.USUARIOS,
      idRegistroAfectado: newUser.id,
      detalles: {
        email: newUser.email,
        nombre: newUser.nombre,
        apellido: newUser.apellido,
        rol: 'profesor'
      }
    });

    return res.json({
      id: newUser.id,
      email: newUser.email,
      nombre: newUser.nombre,
      apellido: newUser.apellido,
      rol: 'profesor'
    });
  } catch (error) {
    console.error('Error en signup:', error);
    return res.status(500).json({
      message: 'Error en el servidor durante el registro',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.post('/login', async (req, res) => {
  console.log('Solicitud de inicio de sesión recibida:', req.body);
  const { email, password } = req.body || {};

  if (!email || !password) {
    console.log('Faltan credenciales');
    return res.status(400).json({ message: 'Email y contraseña requeridos' });
  }

  try {
    console.log(`Buscando usuario: ${email}`);

    // Buscar en la tabla public.users
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    console.log(user);
    if (userError || !user) {
      console.error('Usuario no encontrado en users:', email, userError);
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    console.log('Usuario encontrado en users:', user.email);

    // Verificar la contraseña
    let passwordMatch = false;

    // 1. Primero intentar con bcrypt (método preferido)
    if (user.contraseña && (user.contraseña.startsWith('$2a$') || user.contraseña.startsWith('$2b$'))) {
      try {
        console.log('Verificando contraseña con bcrypt...');
        passwordMatch = await bcrypt.compare(password, user.contraseña);
        console.log('Resultado de bcrypt.compare:', passwordMatch);
      } catch (error) {
        console.error('Error al verificar la contraseña con bcrypt:', error);
      }
    }

    // 2. Si no coincidió con bcrypt, intentar comparación directa (solo para desarrollo)
    if (!passwordMatch && user.contraseña === password) {
      console.log('Contraseña en texto plano coincide');
      passwordMatch = true;

      // Hashear la contraseña para almacenarla de forma segura
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Actualizar la contraseña a su versión hasheada
      const { error: updateError } = await supabase
        .from('users')
        .update({ contraseña: hashedPassword })
        .eq('id', user.id);

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

    // Obtener el rol del usuario desde usuarios_roles
    console.log('Buscando rol del usuario...');
    const { data: userRole, error: roleError } = await supabase
      .from('usuarios_roles')
      .select('rol')
      .eq('user_id', user.id)
      .maybeSingle();

    if (roleError) {
      console.log('Error al buscar rol:', roleError);
    }

    const role = userRole?.rol || user.rol || 'profesor';
    console.log('Rol asignado:', role);

    // Crear el token JWT
    const payload = {
      id_usuario: user.id,
      nombre: user.nombre,
      apellido: user.apellido,
      email: user.email,
      rol: role,
      is_admin: role === 'admin'
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || 'super_secret_jwt_key', { expiresIn: '12h' });

    console.log('✅ Login exitoso para:', email);

    // Registrar el inicio de sesión en el historial
    await registrarAccion({
      idUsuario: user.id,
      accion: ACCIONES.INICIO_SESION,
      tablaAfectada: TABLAS.USUARIOS,
      idRegistroAfectado: user.id,
      detalles: {
        email: user.email,
        nombre: user.nombre,
        apellido: user.apellido,
        rol: role
      }
    });

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
    // Buscar en public.users
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', id_usuario)
      .single();

    if (user) {
      // Obtener el rol del usuario desde usuarios_roles
      const { data: userRole, error: roleError } = await supabase
        .from('usuarios_roles')
        .select('rol')
        .eq('user_id', user.id)
        .maybeSingle();

      if (roleError) {
        console.log('Error al buscar rol:', roleError);
      }

      const role = userRole?.rol || user.rol || 'profesor';

      // Construir respuesta con información del usuario
      return res.json({
        id_usuario: user.id,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
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
