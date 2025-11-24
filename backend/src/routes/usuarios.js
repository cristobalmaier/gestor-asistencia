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

  if (!nombre || !apellido || !email || !rol || !password) {
    return res.status(400).json({ message: 'Todos los campos son requeridos' });
  }

  try {
    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generar un UUID para user_id (simulando lo que haría Supabase Auth)
    const { data: uuidData } = await supabase.rpc('gen_random_uuid');
    const generatedUserId = uuidData || crypto.randomUUID();

    // Crear usuario en la tabla teachers directamente
    const { data: teacher, error: teacherError } = await supabase
      .from('teachers')
      .insert({
        user_id: generatedUserId,
        first_name: nombre,
        last_name: apellido,
        email: email,
        dni: dni || email,
        employment_status: 'titular',
        is_active: true,
        contraseña: hashedPassword
      })
      .select()
      .single();

    if (teacherError) {
      console.error('Error al crear teacher:', teacherError);
      throw teacherError;
    }

    console.log('Teacher creado:', teacher.id, 'con user_id:', teacher.user_id);

    // Crear entrada en usuarios_roles con el rol
    const { error: roleError } = await supabase
      .from('usuarios_roles')
      .insert({
        user_id: teacher.user_id,
        rol: rol
      });

    if (roleError) {
      console.error('Error al crear rol:', roleError);
    } else {
      console.log('Rol asignado:', rol, 'para user_id:', teacher.user_id);
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
    // Buscar teacher
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
      if (password) {
        updateData.contraseña = await bcrypt.hash(password, 10);
      }

      const { data: updated, error } = await supabase
        .from('teachers')
        .update(updateData)
        .eq('id', teacher.id)
        .select()
        .single();

      if (error) throw error;

      // Actualizar rol si se proporciona
      if (rol && teacher.user_id) {
        await supabase
          .from('usuarios_roles')
          .upsert({
            user_id: teacher.user_id,
            rol: rol
          }, {
            onConflict: 'user_id'
          });
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
    // Buscar teacher
    const { data: teacher } = await supabase
      .from('teachers')
      .select('id')
      .eq('id', id)
      .single();

    if (teacher) {
      // Eliminar rol primero (si tiene user_id)
      if (teacher.user_id) {
        await supabase
          .from('usuarios_roles')
          .delete()
          .eq('user_id', teacher.user_id);
      }

      // Eliminar teacher
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
