import { Router } from 'express';
import { supabase } from '../db.js';
import { TIPO_EVENTO } from '../constants/enums.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/roleAuth.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

router.get('/', async (req, res) => {
  const { fecha, cursoId } = req.query;

  try {
    let query = supabase
      .from('eventos')
      .select(`
        id,
        titulo,
        descripcion,
        fecha_inicio,
        fecha_fin,
        tipo_evento,
        id_curso,
        curso:curso(id, curso, turno)
      `);

    if (fecha) {
      // Buscar eventos que incluyan esta fecha
      query = query
        .lte('fecha_inicio', fecha)
        .or(`fecha_fin.is.null,fecha_fin.gte.${fecha}`);
    }

    if (cursoId) {
      query = query.eq('id_curso', cursoId);
    }

    query = query.order('fecha_inicio', { ascending: false });

    const { data: eventos, error } = await query;

    if (error) throw error;

    // Transformar al formato esperado
    const transformed = eventos.map(e => {
      return {
        id_evento: e.id,
        fecha: e.fecha_inicio.split('T')[0], // Extraer solo la fecha
        titulo: e.titulo,
        descripcion: e.descripcion,
        id_curso: e.id_curso,
        curso_nombre: e.curso?.curso || null
      };
    });

    return res.json(transformed);
  } catch (e) {
    console.error('Error en GET /calendario:', e);
    return res.status(500).json({ message: 'Error' });
  }
});

router.post('/', authorize(['admin', 'preceptor']), async (req, res) => {
  const { fecha, titulo, descripcion, cursoId } = req.body || {};

  if (!fecha) return res.status(400).json({ message: 'fecha requerida' });
  if (!titulo) return res.status(400).json({ message: 'titulo requerido' });

  try {
    // Convertir fecha a timestamp
    const fechaInicio = new Date(fecha).toISOString();

    const { data: evento, error } = await supabase
      .from('eventos')
      .insert({
        titulo: titulo,
        descripcion: descripcion || null,
        fecha_inicio: fechaInicio,
        fecha_fin: null,
        tipo_evento: TIPO_EVENTO.OTRO,
        id_curso: cursoId || null,
        created_by: req.user.id_usuario
      })
      .select()
      .single();

    if (error) throw error;

    return res.json({ ok: true, id: evento.id });
  } catch (e) {
    console.error('Error en POST /calendario:', e);
    return res.status(500).json({ message: 'Error' });
  }
});

router.put('/:id', authorize(['admin', 'preceptor']), async (req, res) => {
  const { id } = req.params;
  const { fecha, titulo, descripcion, cursoId } = req.body || {};

  if (!titulo) return res.status(400).json({ message: 'titulo requerido' });

  try {
    // 1. Verify existence and permissions
    const { data: existingEvent, error: fetchError } = await supabase
      .from('eventos')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;
    if (!existingEvent) return res.status(404).json({ message: 'Evento no encontrado' });

    if (existingEvent.created_by !== req.user.id_usuario && req.user.rol !== 'admin') {
      return res.status(403).json({ message: 'No tienes permiso para editar este evento' });
    }

    // 2. Prepare update data
    const updates = {
      titulo,
      descripcion: descripcion || null,
      id_curso: cursoId || null
    };

    if (fecha) {
      updates.fecha_inicio = new Date(fecha).toISOString();
    }

    // 3. Update
    const { error: updateError } = await supabase
      .from('eventos')
      .update(updates)
      .eq('id', id);

    if (updateError) throw updateError;

    return res.json({ ok: true });
  } catch (e) {
    console.error('Error en PUT /calendario/:id:', e);
    return res.status(500).json({ message: 'Error al actualizar el evento' });
  }
});

router.delete('/:id', authorize(['admin', 'preceptor']), async (req, res) => {
  const { id } = req.params;

  try {
    // Primero verificamos si el evento existe
    const { data: evento, error: fetchError } = await supabase
      .from('eventos')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;
    if (!evento) {
      return res.status(404).json({ message: 'Evento no encontrado' });
    }

    // Verificar que el usuario tiene permiso para eliminar el evento
    // (solo el creador o un administrador pueden eliminar)
    if (evento.created_by !== req.user.id_usuario && req.user.rol !== 'admin') {
      return res.status(403).json({ message: 'No tienes permiso para eliminar este evento' });
    }

    // Eliminar el evento
    const { error: deleteError } = await supabase
      .from('eventos')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    return res.json({ ok: true });
  } catch (e) {
    console.error('Error en DELETE /calendario/:id:', e);
    return res.status(500).json({ message: 'Error al eliminar el evento' });
  }
});

export default router;
