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
    const transformed = eventos.map(e => ({
      id_evento: e.id,
      fecha: e.fecha_inicio.split('T')[0], // Extraer solo la fecha
      descripcion: e.titulo + (e.descripcion ? ` - ${e.descripcion}` : ''),
      id_curso: e.id_curso,
      curso_nombre: e.curso?.curso || null
    }));

    return res.json(transformed);
  } catch (e) {
    console.error('Error en GET /calendario:', e);
    return res.status(500).json({ message: 'Error' });
  }
});

router.post('/', authorize(['admin', 'preceptor']), async (req, res) => {
  const { fecha, descripcion, cursoId } = req.body || {};
  if (!fecha) return res.status(400).json({ message: 'fecha requerida' });


  try {
    // Convertir fecha a timestamp
    const fechaInicio = new Date(fecha).toISOString();

    const { data: evento, error } = await supabase
      .from('eventos')
      .insert({
        titulo: descripcion || 'Evento',
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

export default router;
