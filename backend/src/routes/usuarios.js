import { Router } from 'express';
import { supabase } from '../db.js';
import bcrypt from 'bcryptjs';

const router = Router();

// Obtener todos los usuarios (teachers, padres, etc.)
router.get('/', async (req, res) => {
  try {
    // Obtener teachers
    const { data: teachers, error: teachersError } = await supabase
      .from('teachers')
      .select(`
        id,
        user_id,
        first_name,
        last_name,
        email,
        dni,
        employment_status,
        is_active,
        user_roles(role)
      `)
      .order('last_name')
      .order('first_name');
    
    if (teachersError) throw teachersError;
    
    // Obtener padres
    const { data: padres, error: padresError } = await supabase
      .from('padres')
      .select(`
        id,
        user_id,
        nombre,
        apellido,
        email,
        dni,
        telefono
      `)
      .order('apellido')
      .order('nombre');
    
    if (padresError) throw padresError;
    
    // Transformar teachers al formato esperado
    const usuarios = [
      ...teachers.map(t => ({
        id: t.user_id || t.id,
        nombre: t.first_name,
        apellido: t.last_name,
        email: t.email,
        dni: t.dni,
        rol: t.user_roles?.[0]?.role || 'teacher',
        tipo: 'teacher'
      })),
      ...padres.map(p => ({
        id: p.user_id || p.id,
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
    return res.status(500).json({ message: 'Error' });
  }
});

// Crear usuario
router.post('/', async (req, res) => {
  const { nombre, apellido, email, rol, password } = req.body || {};
  
  if (!nombre || !apellido || !email || !rol || !password) {
    return res.status(400).json({ message: 'Todos los campos son requeridos' });
  }
  
  try {
    if (rol === 'teacher' || rol === 'admin') {
      // Crear teacher
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const { data: teacher, error: teacherError } = await supabase
        .from('teachers')
        .insert({
          first_name: nombre,
          last_name: apellido,
          email: email,
          dni: email, // Temporal, deberías tener un campo DNI
          employment_status: 'titular',
          is_active: true,
          contraseña: hashedPassword
        })
        .select()
        .single();
      
      if (teacherError) throw teacherError;
      
      // Crear rol si es necesario
      if (teacher.user_id) {
        await supabase
          .from('user_roles')
          .insert({
            user_id: teacher.user_id,
            role: rol
          });
      }
      
      return res.json({
        id: teacher.user_id || teacher.id,
        nombre: teacher.first_name,
        apellido: teacher.last_name,
        email: teacher.email,
        rol: rol
      });
    }
    
    return res.status(400).json({ message: 'Rol no soportado' });
  } catch (e) {
    console.error('Error en POST /usuarios:', e);
    return res.status(500).json({ message: 'Error al crear usuario' });
  }
});

// Actualizar usuario
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, apellido, email, rol, password } = req.body || {};
  
  try {
    // Buscar si es teacher
    const { data: teacher } = await supabase
      .from('teachers')
      .select('*')
      .or(`id.eq.${id},user_id.eq.${id}`)
      .single();
    
    if (teacher) {
      const updateData = {};
      if (nombre) updateData.first_name = nombre;
      if (apellido) updateData.last_name = apellido;
      if (email) updateData.email = email;
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
      
      // Actualizar rol si es necesario
      if (rol && teacher.user_id) {
        await supabase
          .from('user_roles')
          .upsert({
            user_id: teacher.user_id,
            role: rol
          }, {
            onConflict: 'user_id'
          });
      }
      
      return res.json({
        id: updated.user_id || updated.id,
        nombre: updated.first_name,
        apellido: updated.last_name,
        email: updated.email,
        rol: rol || 'teacher'
      });
    }
    
    return res.status(404).json({ message: 'Usuario no encontrado' });
  } catch (e) {
    console.error('Error en PUT /usuarios/:id:', e);
    return res.status(500).json({ message: 'Error al actualizar usuario' });
  }
});

// Eliminar usuario
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    // Buscar teacher
    const { data: teacher } = await supabase
      .from('teachers')
      .select('id')
      .or(`id.eq.${id},user_id.eq.${id}`)
      .single();
    
    if (teacher) {
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
