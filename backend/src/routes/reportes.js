import { Router } from 'express';
import { supabase } from '../db.js';
import { Parser } from 'json2csv';
import ExcelJS from 'exceljs';
import PdfPrinter from 'pdfmake';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const router = Router();

router.get('/curso', async (req, res) => {
  const { cursoId, desde, hasta, materiaId, profesorId, format: formatType } = req.query;
  if (!cursoId) return res.status(400).json({ message: 'cursoId requerido' });

  try {
    // Obtener materias del curso
    let materiaQuery = supabase
      .from('materias')
      .select('id, curso_id, nombre')
      .order('curso_id', { ascending: true });

    // Si no es 'todos', filtrar por el curso específico
    if (cursoId && cursoId !== 'todos') {
      materiaQuery = materiaQuery.eq('curso_id', cursoId);
    }

    // Si hay un filtro de materia, aplicarlo
    if (materiaId && materiaId !== 'todos') {
      materiaQuery = materiaQuery.eq('id', materiaId);
    }

    const { data: materias } = await materiaQuery;
    const materiaIds = materias?.map(m => m.id) || [];

    if (materiaIds.length === 0) {
      return formatType ? res.status(404).json({ message: 'No hay datos' }) : res.json([]);
    }

    // Obtener asistencias
    let asistQuery = supabase
      .from('asistencias')
      .select(`
        id_alumno,
        id_materia,
        presente,
        justificada,
        tarde,
        fecha,
        alumno!id_alumno(id, nombre, apellido, id_curso)
      `)
      .in('id_materia', materiaIds);

    if (desde) asistQuery = asistQuery.gte('fecha', desde);
    if (hasta) asistQuery = asistQuery.lte('fecha', hasta);

    const { data: asistenciasRaw, error } = await asistQuery;
    if (error) throw error;

    // Deduplicate records based on alumno + materia + fecha
    const asistencias = [];
    const seen = new Set();

    for (const a of asistenciasRaw) {
      const key = `${a.id_alumno}-${a.id_materia}-${a.fecha}`;
      if (!seen.has(key)) {
        seen.add(key);
        asistencias.push(a);
      }
    }

    // Agrupar por alumno
    const alumnosMap = new Map();

    asistencias.forEach(a => {
      const alumnoId = a.id_alumno;

      if (!alumnosMap.has(alumnoId)) {
        alumnosMap.set(alumnoId, {
          id_alumno: alumnoId,
          nombre: a.alumno?.nombre || '',
          apellido: a.alumno?.apellido || '',
          curso: cursoId === 'todos' ? '' : undefined,
          presentes: 0,
          ausentes: 0,
          tardes: 0,
          justificados: 0,
          total: 0
        });
      }

      const alumno = alumnosMap.get(alumnoId);
      alumno.total++;

      if (a.presente) {
        alumno.presentes++;
      } else if (a.tarde) {
        alumno.tardes++;
      } else if (a.justificada) {
        alumno.justificados++;
      } else {
        alumno.ausentes++;
      }
    });

    let rows = Array.from(alumnosMap.values())
      .sort((a, b) => {
        // Si estamos mostrando todos los cursos, ordenar primero por curso y luego por apellido
        if (cursoId === 'todos') {
          return (a.curso || '').localeCompare(b.curso || '') ||
            a.apellido.localeCompare(b.apellido) ||
            a.nombre.localeCompare(b.nombre);
        }
        return a.apellido.localeCompare(b.apellido) || a.nombre.localeCompare(b.nombre);
      });

    if (formatType === 'csv') {
      const fields = ['id_alumno', 'apellido', 'nombre'];
      if (cursoId === 'todos') fields.push('curso');
      fields.push('presentes', 'ausentes', 'tardes', 'justificados', 'total');

      const parser = new Parser({ fields });
      const csv = parser.parse(rows);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="reporte_curso.csv"');
      return res.send(csv);
    } else if (formatType === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Reporte');

      const columns = [
        { header: 'Apellido', key: 'apellido', width: 20 },
        { header: 'Nombre', key: 'nombre', width: 20 }
      ];

      // Agregar columna de curso solo si se seleccionaron todos los cursos
      if (cursoId === 'todos') {
        columns.push({ header: 'Curso', key: 'curso', width: 25 });
      }

      // Agregar el resto de las columnas
      columns.push(
        { header: 'Presentes', key: 'presentes', width: 10 },
        { header: 'Ausentes', key: 'ausentes', width: 10 },
        { header: 'Tardes', key: 'tardes', width: 10 },
        { header: 'Justificados', key: 'justificados', width: 12 },
        { header: 'Total', key: 'total', width: 10 }
      );

      // Set the columns first
      worksheet.columns = columns;

      // Then add the rows
      worksheet.addRows(rows);
      worksheet.getRow(1).font = { bold: true };

      const buffer = await workbook.xlsx.writeBuffer();
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=reporte_curso.xlsx');
      return res.send(buffer);
    } else if (formatType === 'pdf') {
      const fonts = {
        Helvetica: {
          normal: 'Helvetica',
          bold: 'Helvetica-Bold',
          italics: 'Helvetica-Oblique',
          bolditalics: 'Helvetica-BoldOblique'
        }
      };

      const printer = new PdfPrinter(fonts);
      const docDefinition = {
        content: [
          { text: 'Reporte de Asistencia' + (cursoId === 'todos' ? ' - Todos los Cursos' : ''), style: 'header' },
          {
            table: {
              headerRows: 1,
              widths: cursoId === 'todos' ?
                ['*', '*', '*', 'auto', 'auto', 'auto', 'auto', 'auto'] :
                ['*', '*', 'auto', 'auto', 'auto', 'auto', 'auto'],
              body: [
                cursoId === 'todos' ?
                  ['Curso', 'Apellido', 'Nombre', 'Presentes', 'Ausentes', 'Tardes', 'Justificados', 'Total'] :
                  ['Apellido', 'Nombre', 'Presentes', 'Ausentes', 'Tardes', 'Justificados', 'Total'],
                ...rows.map(row => {
                  const baseRow = [
                    row.apellido,
                    row.nombre,
                    row.presentes.toString(),
                    row.ausentes.toString(),
                    row.tardes.toString(),
                    row.justificados.toString(),
                    row.total.toString()
                  ];

                  // Insertar el curso al principio si es necesario
                  if (cursoId === 'todos') {
                    baseRow.unshift(row.curso || 'Sin curso');
                  }

                  return baseRow;
                })
              ]
            }
          }
        ],
        styles: {
          header: {
            fontSize: 18,
            bold: true,
            margin: [0, 0, 0, 10]
          }
        },
        defaultStyle: {
          font: 'Helvetica'
        }
      };

      const pdfDoc = printer.createPdfKitDocument(docDefinition);
      let chunks = [];

      pdfDoc.on('data', (chunk) => chunks.push(chunk));

      return new Promise((resolve) => {
        pdfDoc.on('end', () => {
          const result = Buffer.concat(chunks);
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', 'attachment; filename=reporte_curso.pdf');
          res.send(result);
          resolve();
        });
        pdfDoc.end();
      });
    }
    return res.json(rows);
  } catch (e) {
    console.error('Error en GET /reportes/curso:', e);
    return res.status(500).json({ message: 'Error' });
  }
});

router.get('/alumno', async (req, res) => {
  const { alumnoId, desde, hasta, materiaId, format: formatType } = req.query;
  const uid = alumnoId || req.user?.id_usuario;
  if (!uid) return res.status(400).json({ message: 'alumnoId requerido' });

  try {
    let query = supabase
      .from('asistencias')
      .select(`
        fecha,
        presente,
        tarde,
        justificada,
        materia:materias(id, nombre, curso:curso(curso))
      `)
      .eq('id_alumno', uid);

    if (desde) query = query.gte('fecha', desde);
    if (hasta) query = query.lte('fecha', hasta);
    if (materiaId) query = query.eq('id_materia', materiaId);

    query = query.order('fecha', { ascending: false });

    const { data: asistencias, error } = await query;
    if (error) throw error;

    // Deduplicate records based on fecha + materia
    const uniqueAsistencias = [];
    const seen = new Set();

    for (const a of asistencias) {
      const materiaId = a.materia?.id;
      const key = `${a.fecha}-${materiaId}`;

      if (!seen.has(key)) {
        seen.add(key);
        uniqueAsistencias.push(a);
      }
    }

    const rows = uniqueAsistencias.map(a => {
      const cursoInfo = a.materia?.curso?.curso || '';

      return {
        fecha: a.fecha,
        materia: a.materia?.nombre || '',
        curso: cursoInfo,
        estado: a.presente ? 'Presente' : (a.tarde ? 'Tarde' : (a.justificada ? 'Justificado' : 'Ausente'))
      };
    });
    if (formatType === 'csv') {
      const parser = new Parser({ fields: ['fecha', 'materia', 'estado'] });
      const csv = parser.parse(rows);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="reporte_alumno.csv"');
      return res.send(csv);
    } else if (formatType === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Reporte');

      worksheet.columns = [
        { header: 'Fecha', key: 'fecha', width: 15 },
        { header: 'Materia', key: 'materia', width: 40 },
        { header: 'Estado', key: 'estado', width: 15 }
      ];

      worksheet.addRows(rows.map(row => ({
        ...row,
        fecha: format(new Date(row.fecha), 'dd/MM/yyyy', { locale: es })
      })));

      worksheet.getRow(1).font = { bold: true };

      const buffer = await workbook.xlsx.writeBuffer();
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=reporte_alumno.xlsx');
      return res.send(buffer);
    } else if (formatType === 'pdf') {
      const fonts = {
        Helvetica: {
          normal: 'Helvetica',
          bold: 'Helvetica-Bold',
          italics: 'Helvetica-Oblique',
          bolditalics: 'Helvetica-BoldOblique'
        }
      };

      const printer = new PdfPrinter(fonts);
      const docDefinition = {
        content: [
          { text: 'Reporte de Asistencia del Alumno', style: 'header' },
          {
            table: {
              headerRows: 1,
              widths: ['*', '*', 'auto'],
              body: [
                ['Fecha', 'Materia', 'Estado'],
                ...rows.map(row => [
                  format(new Date(row.fecha), 'dd/MM/yyyy', { locale: es }),
                  row.materia,
                  row.estado
                ])
              ]
            }
          }
        ],
        styles: {
          header: {
            fontSize: 18,
            bold: true,
            margin: [0, 0, 0, 10]
          }
        },
        defaultStyle: {
          font: 'Helvetica'
        }
      };

      const pdfDoc = printer.createPdfKitDocument(docDefinition);
      let chunks = [];

      pdfDoc.on('data', (chunk) => chunks.push(chunk));

      return new Promise((resolve) => {
        pdfDoc.on('end', () => {
          const result = Buffer.concat(chunks);
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', 'attachment; filename=reporte_alumno.pdf');
          res.send(result);
          resolve();
        });
        pdfDoc.end();
      });
    }
    return res.json(rows);
  } catch (e) {
    console.error('Error en GET /reportes/alumno:', e);
    return res.status(500).json({ message: 'Error' });
  }
});

// Dashboard statistics endpoint
router.get('/dashboard', async (req, res) => {
  try {
    // Calcular fecha de hace 30 días
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateStr = thirtyDaysAgo.toISOString().split('T')[0];

    // Get general attendance percentage
    const { data: asistencias, error: asistError } = await supabase
      .from('asistencias')
      .select('presente, justificada')
      .gte('fecha', dateStr);

    if (asistError) throw asistError;

    const total = asistencias.length;
    const presentes = asistencias.filter(a => a.presente).length;
    const ausentes = asistencias.filter(a => !a.presente && !a.justificada).length;
    const justificados = asistencias.filter(a => a.justificada).length;
    const porcentaje = total > 0 ? Math.round((presentes * 100.0 / total) * 100) / 100 : 0;

    const attendanceStats = {
      total_asistencias: total,
      presentes,
      ausentes,
      tardes: 0, // No disponible en el nuevo esquema
      justificados,
      porcentaje_asistencia: porcentaje
    };

    // Get students with most absences in the last 30 days
    const { data: ausencias, error: ausError } = await supabase
      .from('asistencias')
      .select(`
        id_alumno,
        alumno:alumno(id, nombre, apellido, id_curso, curso:curso(id, curso))
      `)
      .eq('presente', false)
      .eq('justificada', false)
      .gte('fecha', dateStr);

    if (ausError) throw ausError;

    // Agrupar por alumno
    const alumnosMap = new Map();
    ausencias.forEach(a => {
      const id = a.id_alumno;
      if (!alumnosMap.has(id)) {
        alumnosMap.set(id, {
          id_usuario: id,
          nombre: a.alumno?.nombre || '',
          apellido: a.alumno?.apellido || '',
          total_inasistencias: 0,
          curso_nombre: a.alumno?.curso?.curso || '',
          anio: null,
          division: null
        });
      }
      alumnosMap.get(id).total_inasistencias++;
    });

    const studentsWithMostAbsences = Array.from(alumnosMap.values())
      .sort((a, b) => b.total_inasistencias - a.total_inasistencias)
      .slice(0, 5);

    // Get upcoming events (next 30 days)
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const futureDateStr = thirtyDaysFromNow.toISOString().split('T')[0];

    const { data: eventos, error: eventosError } = await supabase
      .from('eventos')
      .select(`
        id,
        titulo,
        descripcion,
        fecha_inicio,
        id_curso,
        curso:curso(id, curso)
      `)
      .gte('fecha_inicio', today)
      .lte('fecha_inicio', futureDateStr)
      .order('fecha_inicio', { ascending: true })
      .limit(10);

    if (eventosError) throw eventosError;

    const upcomingEvents = eventos.map(e => ({
      id_evento: e.id,
      fecha: e.fecha_inicio.split('T')[0],
      titulo: e.titulo,
      descripcion: e.descripcion,
      id_curso: e.id_curso,
      curso_info: e.curso ? e.curso.curso : 'General'
    }));

    res.json({
      attendanceStats,
      studentsWithMostAbsences,
      upcomingEvents
    });
  } catch (e) {
    console.error('Error fetching dashboard statistics:', e);
    console.error('Stack:', e.stack);
    return res.status(500).json({
      message: 'Error al obtener estadísticas del dashboard',
      error: process.env.NODE_ENV === 'development' ? e.message : undefined
    });
  }
});

export default router;
