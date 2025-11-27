import { Router } from 'express';
import { supabase } from '../db.js';
import bcrypt from 'bcryptjs';
import { authorize } from '../middleware/roleAuth.js';
import { authenticate } from '../middleware/auth.js';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { registrarAccion, ACCIONES, TABLAS } from '../utils/logger.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Obtener todos los usuarios (Solo admin)
router.get('/', authorize(['admin']), async (req, res) => {
  try {
    // Obtener usuarios desde public.users
    const { data: usuarios, error: usuariosError } = await supabase
      .from('users')
      .select('id, email, nombre, apellido, rol')
      .order('apellido')
      .order('nombre');

    if (usuariosError) throw usuariosError;

    // Obtener roles de usuarios_roles para obtener roles más actualizados
    const { data: roles, error: rolesError } = await supabase
      .from('usuarios_roles')
      .select('user_id, rol');

    if (rolesError) console.error('Error al obtener roles:', rolesError);

    // Transformar usuarios al formato esperado
    const usuariosFormatados = usuarios.map(u => {
      const userRole = roles?.find(r => r.user_id === u.id);
      return {
        id: u.id,
        nombre: u.nombre,
        apellido: u.apellido,
        email: u.email,
        dni: '',
        rol: userRole?.rol || u.rol || 'profesor',
        tipo: 'usuario'
      };
    });

    return res.json(usuariosFormatados);
  } catch (e) {
    console.error('Error en GET /usuarios:', e);
    return res.status(500).json({ message: 'Error al obtener usuarios' });
  }
});

// Crear usuario (Solo admin)
router.post('/', authorize(['admin']), async (req, res) => {
  const { nombre, apellido, email, rol, password } = req.body || {};

  console.log("BODY RECIBIDO EN POST /usuarios:", req.body);

  if (!nombre || !apellido || !email || !rol || !password) {
    return res.status(400).json({ message: 'Todos los campos son requeridos' });
  }

  // Validación robusta de contraseña
  if (typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });
  }

  try {
    // Verificar si el usuario ya existe
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ message: 'Ya existe un usuario con este correo electrónico' });
    }

    // Hashear la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 1. Verificar que el rol sea válido (admin, profesor o preceptor)
    const rolesPermitidos = ['admin', 'profesor', 'preceptor'];
    if (!rolesPermitidos.includes(rol)) {
      return res.status(400).json({ 
        message: 'Rol no válido. Los roles permitidos son: admin, profesor, preceptor' 
      });
    }

    // 2. Obtener el ID del usuario de autenticación correspondiente al rol
    const { data: authUser, error: authError } = await supabase
      .from('users')
      .select('id')
      .eq('rol', rol)
      .limit(1)
      .single();

    if (authError || !authUser) {
      console.error('Error al obtener usuario de autenticación para el rol:', rol, authError);
      throw new Error('No se pudo asociar el usuario a una cuenta de autenticación válida');
    }

    const userId = authUser.id;
    console.log('Asociando a cuenta de autenticación existente con ID:', userId);
    
    // 3. Crear el usuario en public.users
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({
        id: crypto.randomUUID(), // Nuevo ID único para este usuario
        email: email,
        nombre: nombre,
        apellido: apellido,
        rol: rol,
        full_name: `${nombre} ${apellido}`,
        auth_user_id: userId, // Referencia al usuario de autenticación
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (userError) {
      console.error('Error al crear usuario en public.users:', userError);
      throw new Error(`Error al crear el usuario: ${userError.message}`);
    }

    // Crear entrada en usuarios_roles
    const { error: roleError } = await supabase
      .from('usuarios_roles')
      .insert({
        user_id: newUser.id,
        rol: rol
      });

    if (roleError) {
      console.error('Error al crear rol:', roleError);
      // Limpiar si falla la creación del rol
      await supabase.from('users').delete().eq('id', newUser.id);
      throw new Error(`Error al asignar el rol: ${roleError.message}`);
    }

    // Registrar la creación del usuario en el historial
    await registrarAccion({
      idUsuario: req.user?.id_usuario,
      accion: ACCIONES.CREAR_USUARIO,
      tablaAfectada: TABLAS.USUARIOS,
      idRegistroAfectado: newUser.id,
      detalles: {
        email: newUser.email,
        nombre: newUser.nombre,
        apellido: newUser.apellido,
        rol: rol
      }
    });

    // Devolver el usuario en el formato esperado por el frontend
    return res.json({
      id: newUser.id,
      nombre: newUser.nombre,
      apellido: newUser.apellido,
      email: newUser.email,
      dni: '',
      rol: rol,
      tipo: 'usuario'
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
  const { nombre, apellido, email, rol, password } = req.body || {};

  try {
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (user) {
      const updateData = {};
      if (nombre) updateData.nombre = nombre;
      if (apellido) updateData.apellido = apellido;
      if (email) updateData.email = email;
      if (password) {
        const salt = await bcrypt.genSalt(10);
        updateData.contraseña = await bcrypt.hash(password, salt);
      }
      updateData.full_name = `${nombre || user.nombre} ${apellido || user.apellido}`;

      const { data: updated, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (rol) {
        await supabase
          .from('usuarios_roles')
          .upsert(
            { user_id: id, rol: rol },
            { onConflict: 'user_id' }
          );
      }

      // Registrar la actualización del usuario en el historial
      await registrarAccion({
        idUsuario: req.user?.id_usuario,
        accion: ACCIONES.ACTUALIZAR_USUARIO,
        tablaAfectada: TABLAS.USUARIOS,
        idRegistroAfectado: id,
        detalles: {
          email: updated.email,
          nombre: updated.nombre,
          apellido: updated.apellido,
          rol: rol || user.rol || 'profesor',
          cambios: updateData
        }
      });

      return res.json({
        id: updated.id,
        nombre: updated.nombre,
        apellido: updated.apellido,
        email: updated.email,
        rol: rol || user.rol || 'profesor'
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
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('id', id)
      .single();

    if (user) {
      // Eliminar entrada de usuarios_roles
      await supabase
        .from('usuarios_roles')
        .delete()
        .eq('user_id', id);

      // Eliminar usuario de public.users
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Registrar la eliminación del usuario en el historial
      await registrarAccion({
        idUsuario: req.user?.id_usuario,
        accion: ACCIONES.ELIMINAR_USUARIO,
        tablaAfectada: TABLAS.USUARIOS,
        idRegistroAfectado: id,
        detalles: {
          email: user.email,
          nombre: user.nombre,
          apellido: user.apellido
        }
      });

      return res.json({ ok: true });
    }

    return res.status(404).json({ message: 'Usuario no encontrado' });
  } catch (e) {
    console.error('Error en DELETE /usuarios/:id:', e);
    return res.status(500).json({ message: 'Error al eliminar usuario' });
  }
});

// Buscar profesores por nombre/apellido
router.get('/profesores/search', authenticate, async (req, res) => {
  const { busqueda } = req.query;

  try {
    if (!busqueda || busqueda.trim().length === 0) {
      return res.json([]);
    }

    const searchTerm = `%${busqueda}%`;
    
    // Hacer dos queries: una por nombre y otra por apellido
    const { data: porNombre } = await supabase
      .from('users')
      .select('id, email, nombre, apellido, rol')
      .eq('rol', 'profesor')
      .ilike('nombre', searchTerm);

    const { data: porApellido } = await supabase
      .from('users')
      .select('id, email, nombre, apellido, rol')
      .eq('rol', 'profesor')
      .ilike('apellido', searchTerm);

    // Combinar y eliminar duplicados
    const combinados = [...(porNombre || []), ...(porApellido || [])];
    const unicos = Array.from(new Map(combinados.map(u => [u.id, u])).values());

    return res.json(unicos.map(u => ({
      id_usuario: u.id,
      nombre: u.nombre,
      apellido: u.apellido,
      email: u.email,
      rol: u.rol
    })));
  } catch (e) {
    console.error('Error en GET /usuarios/profesores/search:', e);
    return res.status(500).json({ message: 'Error al buscar profesores' });
  }
});

// Buscar alumnos por nombre/apellido
router.get('/alumnos/search', authenticate, async (req, res) => {
  const { busqueda } = req.query;

  try {
    if (!busqueda || busqueda.trim().length === 0) {
      return res.json([]);
    }

    const searchTerm = `%${busqueda}%`;
    
    // Hacer dos queries: una por nombre y otra por apellido
    const { data: porNombre } = await supabase
      .from('alumno')
      .select('id, nombre, apellido, dni')
      .ilike('nombre', searchTerm);

    const { data: porApellido } = await supabase
      .from('alumno')
      .select('id, nombre, apellido, dni')
      .ilike('apellido', searchTerm);

    // Combinar y eliminar duplicados
    const combinados = [...(porNombre || []), ...(porApellido || [])];
    const unicos = Array.from(new Map(combinados.map(a => [a.id, a])).values());

    return res.json(unicos.map(a => ({
      id_usuario: a.id,
      nombre: a.nombre,
      apellido: a.apellido,
      dni: a.dni
    })));
  } catch (e) {
    console.error('Error en GET /usuarios/alumnos/search:', e);
    return res.status(500).json({ message: 'Error al buscar alumnos' });
  }
});

export default router;
