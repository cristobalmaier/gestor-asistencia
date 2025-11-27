import { Router } from 'express';
import { supabase } from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  const { desde, hasta, id_usuario, nombre } = req.query;

  try {
    let query = supabase
      .from('historial-registro')
      .select(`
        id,
        id_usuario,
        accion,
        fecha_hora,
        tabla_afectada,
        id_registro_afectado,
        detalles
      `);

    // Aplicar filtros
    if (desde) query = query.gte('fecha_hora', desde);
    if (hasta) query = query.lte('fecha_hora', hasta + 'T23:59:59'); // Incluir todo el día
    if (id_usuario) query = query.eq('id_usuario', id_usuario);
    // Nota: El filtro por nombre se aplica después de obtener los datos

    // Ordenar por fecha más reciente primero
    query = query.order('fecha_hora', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error en la consulta a historial-registro:', error);
      throw error;
    }

    // Obtener información de usuarios desde public.users
    const usuariosSet = new Set(data.map(d => d.id_usuario).filter(Boolean));

    // Sets para recolectar IDs de alumnos y materias de los detalles
    const alumnosIdsSet = new Set();
    const materiasIdsSet = new Set();

    data.forEach(item => {
      let accion = item.accion;
      if (typeof accion === 'string') {
        try { accion = JSON.parse(accion); } catch (e) { }
      }
      const detalles = accion.detalles || accion;

      if (detalles?.alumno_id) alumnosIdsSet.add(detalles.alumno_id);
      if (detalles?.materia_id) materiasIdsSet.add(detalles.materia_id);
    });

    let usuariosMap = {};
    let alumnosMap = {};
    let materiasMap = {};
    let filteredData = [...data];

    // 1. Fetch Usuarios
    if (usuariosSet.size > 0) {
      let query = supabase.from('users').select('id, nombre, apellido, email');

      if (nombre) {
        query = query.or(`nombre.ilike.%${nombre}%,apellido.ilike.%${nombre}%`);
      } else {
        query = query.in('id', Array.from(usuariosSet));
      }

      const { data: usuarios, error: usuariosError } = await query;

      if (!usuariosError && usuarios) {
        usuariosMap = usuarios.reduce((acc, u) => ({ ...acc, [u.id]: u }), {});
        if (nombre) {
          const usuariosIds = new Set(usuarios.map(u => u.id));
          filteredData = data.filter(item => usuariosIds.has(item.id_usuario));
        }
      }
    }

    // 2. Fetch Alumnos
    if (alumnosIdsSet.size > 0) {
      const { data: alumnos } = await supabase
        .from('alumno')
        .select('id, nombre, apellido')
        .in('id', Array.from(alumnosIdsSet));

      if (alumnos) {
        alumnosMap = alumnos.reduce((acc, a) => ({ ...acc, [a.id]: `${a.nombre} ${a.apellido}` }), {});
      }
    }

    // 3. Fetch Materias
    if (materiasIdsSet.size > 0) {
      const { data: materias } = await supabase
        .from('materias')
        .select('id, nombre')
        .in('id', Array.from(materiasIdsSet));

      if (materias) {
        materiasMap = materias.reduce((acc, m) => ({ ...acc, [m.id]: m.nombre }), {});
      }
    }

    // Formatear los datos para la respuesta
    const formattedData = filteredData.map(item => {
      let accion = item.accion;
      if (typeof accion === 'string') {
        try { accion = JSON.parse(accion); } catch (e) { }
      }

      // Enriquecer detalles con nombres
      const detalles = accion.detalles || accion;
      const enrichedDetalles = { ...detalles };

      if (enrichedDetalles.alumno_id && alumnosMap[enrichedDetalles.alumno_id]) {
        enrichedDetalles.alumno_nombre = alumnosMap[enrichedDetalles.alumno_id];
      }
      if (enrichedDetalles.materia_id && materiasMap[enrichedDetalles.materia_id]) {
        enrichedDetalles.materia_nombre = materiasMap[enrichedDetalles.materia_id];
      }

      // Actualizar accion con los detalles enriquecidos
      if (accion.detalles) {
        accion.detalles = enrichedDetalles;
      } else {
        accion = enrichedDetalles;
      }

      const usuario = usuariosMap[item.id_usuario];

      return {
        id_historial: item.id,
        id_usuario: item.id_usuario,
        usuario: usuario ? {
          id: usuario.id,
          nombre: usuario.nombre || '',
          apellido: usuario.apellido || '',
          email: usuario.email
        } : { nombre: 'Usuario desconocido', apellido: '', email: '' },
        accion: accion,
        tabla_afectada: item.tabla_afectada,
        id_registro_afectado: item.id_registro_afectado,
        fecha_hora: item.fecha_hora,
        detalles: enrichedDetalles // Enviar también como propiedad directa por si acaso
      };
    });

    return res.json(formattedData);
  } catch (e) {
    console.error('Error en GET /historial:', e);
    return res.status(500).json({ message: 'Error al obtener historial' });
  }
});

export default router;
