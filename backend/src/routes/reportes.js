import { Router } from 'express';
import { query } from '../db.js';
import { Parser } from 'json2csv';
import ExcelJS from 'exceljs';
import PdfPrinter from 'pdfmake';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const router = Router();

router.get('/curso', async (req, res) => {
  const { cursoId, desde, hasta, materiaId, profesorId, format } = req.query;
  if (!cursoId) return res.status(400).json({ message: 'cursoId requerido' });
  const conds = ['m.id_curso = ?'];
  const params = [cursoId];
  if (desde) { conds.push('a.fecha >= ?'); params.push(desde); }
  if (hasta) { conds.push('a.fecha <= ?'); params.push(hasta); }
  if (materiaId) { conds.push('a.id_materia = ?'); params.push(materiaId); }
  if (profesorId) { conds.push('a.id_profesor = ?'); params.push(profesorId); }
  const where = `WHERE ${conds.join(' AND ')}`;
  try {
    const rows = await query(`
      SELECT u.id_usuario AS id_alumno, u.apellido, u.nombre,
        SUM(a.estado='Presente') AS presentes,
        SUM(a.estado='Ausente') AS ausentes,
        SUM(a.estado='Tarde') AS tardes,
        SUM(a.estado='Justificado') AS justificados,
        COUNT(*) AS total
      FROM asistencias a
      JOIN usuarios u ON u.id_usuario = a.id_alumno
      JOIN materias m ON m.id_materia = a.id_materia
      ${where}
      GROUP BY u.id_usuario, u.apellido, u.nombre
      ORDER BY u.apellido, u.nombre
    `, params);
    if (format === 'csv') {
      const parser = new Parser({ fields: ['id_alumno','apellido','nombre','presentes','ausentes','tardes','justificados','total'] });
      const csv = parser.parse(rows);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="reporte_curso.csv"');
      return res.send(csv);
    } else if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Reporte');
      
      // Headers
      worksheet.columns = [
        { header: 'Apellido', key: 'apellido', width: 20 },
        { header: 'Nombre', key: 'nombre', width: 20 },
        { header: 'Presentes', key: 'presentes', width: 10 },
        { header: 'Ausentes', key: 'ausentes', width: 10 },
        { header: 'Tardes', key: 'tardes', width: 10 },
        { header: 'Justificados', key: 'justificados', width: 12 },
        { header: 'Total', key: 'total', width: 10 }
      ];
      
      // Add data
      worksheet.addRows(rows);
      
      // Style header
      worksheet.getRow(1).font = { bold: true };
      
      // Write to buffer
      const buffer = await workbook.xlsx.writeBuffer();
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=reporte_curso.xlsx');
      return res.send(buffer);
    } else if (format === 'pdf') {
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
          { text: 'Reporte de Asistencia por Curso', style: 'header' },
          {
            table: {
              headerRows: 1,
              widths: ['*', '*', 'auto', 'auto', 'auto', 'auto', 'auto'],
              body: [
                ['Apellido', 'Nombre', 'Presentes', 'Ausentes', 'Tardes', 'Justificados', 'Total'],
                ...rows.map(row => [
                  row.apellido,
                  row.nombre,
                  row.presentes,
                  row.ausentes,
                  row.tardes,
                  row.justificados,
                  row.total
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
          res.setHeader('Content-Disposition', 'attachment; filename=reporte_curso.pdf');
          res.send(result);
          resolve();
        });
        pdfDoc.end();
      });
    }
    return res.json(rows);
  } catch (e) { return res.status(500).json({ message: 'Error' }); }
});

router.get('/alumno', async (req, res) => {
  const { alumnoId, desde, hasta, materiaId, format } = req.query;
  const uid = alumnoId || req.user?.id_usuario;
  if (!uid) return res.status(400).json({ message: 'alumnoId requerido' });
  const conds = ['a.id_alumno = ?'];
  const params = [uid];
  if (desde) { conds.push('a.fecha >= ?'); params.push(desde); }
  if (hasta) { conds.push('a.fecha <= ?'); params.push(hasta); }
  if (materiaId) { conds.push('a.id_materia = ?'); params.push(materiaId); }
  const where = `WHERE ${conds.join(' AND ')}`;
  try {
    const rows = await query(`
      SELECT a.fecha, m.nombre AS materia, a.estado
      FROM asistencias a
      JOIN materias m ON m.id_materia = a.id_materia
      ${where}
      ORDER BY a.fecha DESC, m.nombre
    `, params);
    if (format === 'csv') {
      const parser = new Parser({ fields: ['fecha','materia','estado'] });
      const csv = parser.parse(rows);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="reporte_alumno.csv"');
      return res.send(csv);
    } else if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Reporte');
      
      // Headers
      worksheet.columns = [
        { header: 'Fecha', key: 'fecha', width: 15 },
        { header: 'Materia', key: 'materia', width: 40 },
        { header: 'Estado', key: 'estado', width: 15 }
      ];
      
      // Add data with formatted dates
      worksheet.addRows(rows.map(row => ({
        ...row,
        fecha: format(new Date(row.fecha), 'dd/MM/yyyy', { locale: es })
      })));
      
      // Style header
      worksheet.getRow(1).font = { bold: true };
      
      // Write to buffer
      const buffer = await workbook.xlsx.writeBuffer();
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=reporte_alumno.xlsx');
      return res.send(buffer);
    } else if (format === 'pdf') {
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
  } catch (e) { return res.status(500).json({ message: 'Error' }); }
});

export default router;
