import { Router } from 'express';
import { supabase } from '../db.js';
import bcrypt from 'bcryptjs';
import { authorize } from '../middleware/roleAuth.js';
import { authenticate } from '../middleware/auth.js';
import crypto from 'crypto';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Obtener todos los usuarios (Solo admin)
router.get('/', authorize(['admin']), async (req, res) => {
  try {
    // Obtener teachers sin JOIN (consulta separada para roles)
    const { data: teachers, error: teachersError } = await supabase
      .from('teachers')
      .select('id, user_id, first_name, last_name, email, dni, employment_status, is_active')
      .order('last_name')
      .order('first_name');

    if (teachersError) throw teachersError;

    // Obtener roles de todos los teachers desde usuarios_roles
    const { data: roles, error: rolesError } = await supabase
      .from('usuarios_roles')
      .select('user_id, rol');

    if (rolesError) console.error('Error al obtener roles:', rolesError);

    // Obtener padres
    const { data: padres, error: padresError } = await supabase
      .from('padres')
      .select('id, user_id, nombre, apellido, email, dni, telefono')
      .order('apellido')
      .order('nombre');

    if (padresError) throw padresError;

    // Transformar teachers al formato esperado
    const usuarios = [
      ...teachers.map(t => {
        const userRole = roles?.find(r => r.user_id === (t.user_id || t.id));
        return {
          id: t.id,
          nombre: t.first_name,
          apellido: t.last_name,
          email: t.email,
          dni: t.dni,
          rol: userRole?.rol || 'profesor',
          tipo: 'teacher'
        };
      }),
      ...padres.map(p => ({
        id: p.id,
        nombre: p.nombre,
        apellido: p.apellido,
        email: p.email,
        dni: p.dni,
        rol: 'padre',
        tipo: 'padre'
      }))
    ];

    return res.json(usuarios);
  } catch (e) {
    console.error('Error en GET /usuarios:', e);
    return res.status(500).json({ message: 'Error al obtener usuarios' });
  }
});

// Crear usuario (Solo admin)
router.post('/', authorize(['admin']), async (req, res) => {
  const { nombre, apellido, email, rol, password, dni } = req.body || {};

  console.log("BODY RECIBIDO EN POST /usuarios:", req.body);

  if (!nombre || !apellido || !email || !rol || !password) {
    return res.status(400).json({ message: 'Todos los campos son requeridos' });
  }

  // Validación robusta de contraseña
  if (typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });
  }

  try {
    // 1. Crear usuario en Supabase Auth
    console.log('Intentando crear usuario en Supabase Auth con email:', email);
    console.log('URL de Supabase:', process.env.SUPABASE_URL);

    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name: `${nombre} ${apellido}`,
        role: rol
      }
    });

    if (authError) {
      console.error('Error detallado al crear usuario en Supabase Auth:', {
        message: authError.message,
        status: authError.status,
        code: authError.code,
        details: authError.error_description || 'Sin detalles adicionales'
      });
      throw new Error(`Error al crear el usuario en el sistema de autenticación: ${authError.message}`);
    }

    console.log('Usuario creado exitosamente en Supabase Auth:', authUser.user.id);
    const userId = authUser.user.id;

    // 2. Crear usuario en la tabla teachers
    const { data: teacher, error: teacherError } = await supabase
      .from('teachers')
      .insert({
        user_id: userId,
        first_name: nombre,
        last_name: apellido,
        email,
        dni: dni || email,
        employment_status: 'titular',
        is_active: true
      })
      .select()
      .single();

    if (teacherError) {
      console.error('Error al crear teacher:', teacherError);
      throw teacherError;
    }

    console.log('Teacher creado:', teacher.id, 'con user_id:', teacher.user_id);

    // 3. Crear o actualizar entrada en usuarios_roles
    const { error: roleError } = await supabase
      .from('usuarios_roles')
      .upsert(
        {
          user_id: userId,
          rol: rol
        },
        { onConflict: 'user_id' }
      );

    if (roleError) {
      console.error('Error al actualizar rol:', roleError);
    } else {
      console.log('Rol asignado/actualizado:', rol, 'para user_id:', userId);
    }

    return res.json({
      id: teacher.id,
      nombre: teacher.first_name,
      apellido: teacher.last_name,
      email: teacher.email,
      dni: teacher.dni,
      rol: rol
    });
  } catch (e) {
    console.error('Error en POST /usuarios:', e);
    return res.status(500).json({
      message: 'Error al crear usuario',
      error: e.message
    });
  }
});

// Actualizar usuario (Solo admin)
router.put('/:id', authorize(['admin']), async (req, res) => {
  const { id } = req.params;
  const { nombre, apellido, email, rol, password, dni } = req.body || {};

  try {
    const { data: teacher } = await supabase
      .from('teachers')
      .select('*')
      .eq('id', id)
      .single();

    if (teacher) {
      const updateData = {};
      if (nombre) updateData.first_name = nombre;
      if (apellido) updateData.last_name = apellido;
      if (email) updateData.email = email;
      if (dni) updateData.dni = dni;
      if (password) updateData.contraseña = await bcrypt.hash(password, 10);

      const { data: updated, error } = await supabase
        .from('teachers')
        .update(updateData)
        .eq('id', teacher.id)
        .select()
        .single();

      if (error) throw error;

      if (rol && teacher.user_id) {
        await supabase
          .from('usuarios_roles')
          .upsert(
            { user_id: teacher.user_id, rol: rol },
            { onConflict: 'user_id' }
          );
      }

      return res.json({
        id: updated.id,
        nombre: updated.first_name,
        apellido: updated.last_name,
        email: updated.email,
        dni: updated.dni,
        rol: rol || 'teacher'
      });
    }

    return res.status(404).json({ message: 'Usuario no encontrado' });
  } catch (e) {
    console.error('Error en PUT /usuarios/:id:', e);
    return res.status(500).json({ message: 'Error al actualizar usuario' });
  }
});

// Eliminar usuario (Solo admin)
router.delete('/:id', authorize(['admin']), async (req, res) => {
  const { id } = req.params;

  try {
    const { data: teacher } = await supabase
      .from('teachers')
      .select('id')
      .eq('id', id)
      .single();

    if (teacher) {
      if (teacher.user_id) {
        await supabase
          .from('usuarios_roles')
          .delete()
          .eq('user_id', teacher.user_id);
      }

      const { error } = await supabase
        .from('teachers')
        .delete()
        .eq('id', teacher.id);

      if (error) throw error;

      return res.json({ ok: true });
    }

    return res.status(404).json({ message: 'Usuario no encontrado' });
  } catch (e) {
    console.error('Error en DELETE /usuarios/:id:', e);
    return res.status(500).json({ message: 'Error al eliminar usuario' });
  }
});

export default router;
