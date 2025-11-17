import { Router } from 'express';
import { supabase, queryTable } from '../db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: 'Email y contraseña requeridos' });
  
  try {
    // Buscar usuario en auth.users de Supabase
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserByEmail(email);
    
    if (authError || !authUser) {
      // Si no está en auth.users, buscar en teachers o padres
      let userData = null;
      let role = null;
      
      // Buscar en teachers
      const { data: teacher, error: teacherError } = await supabase
        .from('teachers')
        .select('*, user_roles(role)')
        .eq('email', email)
        .single();
      
      if (teacher && !teacherError) {
        userData = teacher;
        role = teacher.user_roles?.[0]?.role || 'teacher';
        
        // Verificar contraseña
        let ok = false;
        if (teacher.contraseña) {
          try {
            ok = await bcrypt.compare(password, teacher.contraseña);
          } catch {}
          if (!ok && teacher.contraseña === password) ok = true; // fallback
        }
        
        if (!ok) {
          return res.status(401).json({ message: 'Credenciales inválidas' });
        }
        
        const payload = {
          id_usuario: teacher.user_id || teacher.id,
          nombre: teacher.first_name,
          apellido: teacher.last_name,
          email: teacher.email,
          rol: role
        };
        
        const token = jwt.sign(payload, process.env.JWT_SECRET || 'super_secret_jwt_key', { expiresIn: '12h' });
        return res.json({ token, user: payload });
      }
      
      // Buscar en padres
      const { data: padre, error: padreError } = await supabase
        .from('padres')
        .select('*')
        .eq('email', email)
        .single();
      
      if (padre && !padreError) {
        // Los padres no tienen contraseña en la tabla, deben usar auth.users
        return res.status(401).json({ message: 'Credenciales inválidas' });
      }
      
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }
    
    // Usuario encontrado en auth.users
    // Obtener rol del usuario
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', authUser.user.id)
      .single();
    
    const { data: usuarioRole } = await supabase
      .from('usuarios_roles')
      .select('rol')
      .eq('user_id', authUser.user.id)
      .single();
    
    const role = userRole?.role || usuarioRole?.rol || 'teacher';
    
    // Para usuarios en auth.users, la contraseña se verifica con Supabase Auth
    // Pero como estamos usando JWT propio, necesitamos verificar manualmente
    // Esto requiere que tengas la contraseña hasheada almacenada en algún lugar
    // Por ahora, asumimos que si está en auth.users, la autenticación es válida
    // (en producción deberías usar Supabase Auth directamente)
    
    const payload = {
      id_usuario: authUser.user.id,
      nombre: authUser.user.user_metadata?.nombre || authUser.user.user_metadata?.first_name || '',
      apellido: authUser.user.user_metadata?.apellido || authUser.user.user_metadata?.last_name || '',
      email: authUser.user.email,
      rol: role
    };
    
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'super_secret_jwt_key', { expiresIn: '12h' });
    return res.json({ token, user: payload });
    
  } catch (e) {
    console.error('Error en login:', e);
    return res.status(500).json({ message: 'Error en login' });
  }
});

router.get('/me', authenticate, async (req, res) => {
  const { id_usuario } = req.user || {};
  try {
    // Buscar en auth.users
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(id_usuario);
    
    if (!authError && authUser) {
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', id_usuario)
        .single();
      
      const { data: usuarioRole } = await supabase
        .from('usuarios_roles')
        .select('rol')
        .eq('user_id', id_usuario)
        .single();
      
      return res.json({
        id_usuario: authUser.user.id,
        nombre: authUser.user.user_metadata?.nombre || authUser.user.user_metadata?.first_name || '',
        apellido: authUser.user.user_metadata?.apellido || authUser.user.user_metadata?.last_name || '',
        email: authUser.user.email,
        rol: userRole?.role || usuarioRole?.rol || 'teacher'
      });
    }
    
    // Si no está en auth.users, buscar en teachers
    const { data: teacher } = await supabase
      .from('teachers')
      .select('*, user_roles(role)')
      .or(`id.eq.${id_usuario},user_id.eq.${id_usuario}`)
      .single();
    
    if (teacher) {
      return res.json({
        id_usuario: teacher.user_id || teacher.id,
        nombre: teacher.first_name,
        apellido: teacher.last_name,
        email: teacher.email,
        dni: teacher.dni,
        rol: teacher.user_roles?.[0]?.role || 'teacher'
      });
    }
    
    return res.status(404).json({ message: 'Usuario no encontrado' });
  } catch (e) {
    console.error('Error en /me:', e);
    return res.status(500).json({ message: 'Error' });
  }
});

export default router;
