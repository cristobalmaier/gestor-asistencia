import { Router } from 'express';
import { supabase } from '../db.js';
import bcrypt from 'bcryptjs';
import { authorize } from '../middleware/roleAuth.js';
import { authenticate } from '../middleware/auth.js';
import { registrarAccion, ACCIONES, TABLAS } from '../utils/logger.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Obtener todos los usuarios (Solo admin)
router.get('/', authorize(['admin']), async (req, res) => {
  try {
    const { data: usuarios, error: usuariosError } = await supabase
      .from('users')
      .select('id, email, nombre, apellido, rol')
      .order('apellido')
      .order('nombre');

    if (usuariosError) throw usuariosError;

    const { data: roles } = await supabase
      .from('usuarios_roles')
      .select('user_id, rol');

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

  if (!nombre || !apellido || !email || !rol || !password || password.length < 6) {
    return res.status(400).json({ message: 'Campos inválidos o contraseña muy corta (mínimo 6)' });
  }

  try {
    const rolesPermitidos = ['admin', 'profesor', 'preceptor', 'directivo', 'alumno', 'padre'];
    if (!rolesPermitidos.includes(rol)) {
      return res.status(400).json({ message: `Rol no válido: ${rol}` });
    }

    // 1. Crear usuario en AUTH
    const { data: authCreated, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nombre, apellido, rol }
    });

    if (authError) {
      return res.status(400).json({ message: 'Error al crear usuario en Auth', error: authError.message });
    }

    const userId = authCreated.user.id;
    console.log("UUID generado por AUTH:", userId);

    // 2. Crear HASH de la contraseña para guardarla en public.users
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Guardar en public.users (sin repetir Auth, solo los datos extra)
    const { error: userInsertError } = await supabase
      .from('users', { schema: 'public' })
      .update({  // ⚠ Usamos update porque el trigger ya creó el registro con ese ID
        nombre,
        apellido,
        rol,
        contraseña: hashedPassword,
        full_name: `${nombre} ${apellido}`,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (userInsertError) {
      console.error("Error al guardar la contraseña en public.users:", userInsertError);
      return res.status(500).json({ message: 'Error al guardar contraseña', error: userInsertError.message });
    }

    return res.json({ ok: true, id: userId, email, nombre, apellido, rol });

  } catch (e) {
    console.error("Error en POST /usuarios:", e);
    return res.status(500).json({ message: 'Error interno', error: e.message });
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

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const updateData = {};
    if (nombre) updateData.nombre = nombre;
    if (apellido) updateData.apellido = apellido;
    if (email) updateData.email = email;
    if (password && password.length >= 6) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    updateData.full_name = `${nombre || user.nombre} ${apellido || user.apellido}`;
    updateData.updated_at = new Date().toISOString();

    const { data: updated, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (rol) {
      await supabase.from('usuarios_roles')
      .upsert({ user_id: id, rol }, { onConflict: 'user_id' });
    }

    await registrarAccion({
      idUsuario: req.user?.id_usuario,
      accion: ACCIONES.ACTUALIZAR_USUARIO,
      tablaAfectada: TABLAS.USUARIOS,
      idRegistroAfectado: id,
      detalles: { cambios: updateData }
    });

    return res.json({ ok: true, usuario: updated });

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
      .select('*')
      .eq('id', id)
      .single();

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    await supabase.from('usuarios_roles').delete().eq('user_id', id);
    await supabase.from('users').delete().eq('id', id);
    await supabase.auth.admin.deleteUser(id);

    await registrarAccion({
      idUsuario: req.user?.id_usuario,
      accion: ACCIONES.ELIMINAR_USUARIO,
      tablaAfectada: TABLAS.USUARIOS,
      idRegistroAfectado: id,
      detalles: { usuario: user.email }
    });

    return res.json({ ok: true });

  } catch (e) {
    console.error('Error en DELETE /usuarios/:id:', e);
    return res.status(500).json({ message: 'Error al eliminar usuario' });
  }
});

// Buscar profesores por nombre/apellido
router.get('/profesores/search', async (req, res) => {
  const { busqueda } = req.query;
  if (!busqueda) return res.json([]);

  try {
    const term = `%${busqueda}%`;
    const { data } = await supabase
      .from('users')
      .select('id, email, nombre, apellido, rol')
      .eq('rol', 'profesor')
      .or(`nombre.ilike.${term},apellido.ilike.${term}`);

    const mapped = (data || []).map(u => ({
      id_usuario: u.id,
      nombre: u.nombre,
      apellido: u.apellido,
      email: u.email,
      rol: u.rol
    }));
    return res.json(mapped);
  } catch (e) {
    console.error("Error buscando profesores:", e);
    return res.status(500).json({ message: 'Error al buscar profesores' });
  }
});

// Buscar alumnos por nombre/apellido
router.get('/alumnos/search', async (req, res) => {
  const { busqueda } = req.query;
  if (!busqueda) return res.json([]);

  try {
    const term = `%${busqueda}%`;
    const { data } = await supabase
      .from('alumno')
      .select('id, nombre, apellido, dni')
      .or(`nombre.ilike.${term},apellido.ilike.${term}`);

    const mapped = (data || []).map(a => ({
      id_usuario: a.id,
      nombre: a.nombre,
      apellido: a.apellido,
      dni: a.dni
    }));
    return res.json(mapped);
  } catch (e) {
    console.error("Error buscando alumnos:", e);
    return res.status(500).json({ message: 'Error al buscar alumnos' });
  }
});

export default router;
