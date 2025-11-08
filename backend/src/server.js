import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import authRouter from './routes/auth.js';
import cursosRouter from './routes/cursos.js';
import asistenciasRouter from './routes/asistencias.js';
import reportesRouter from './routes/reportes.js';
import calendarioRouter from './routes/calendario.js';
import historialRouter from './routes/historial.js';
import profesorRouter from './routes/profesor.js';
import usuariosRouter from './routes/usuarios.js';
import { authenticate } from './middleware/auth.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authRouter);
app.use('/api/cursos', authenticate, cursosRouter);
app.use('/api/asistencias', authenticate, asistenciasRouter);
app.use('/api/reportes', authenticate, reportesRouter);
app.use('/api/calendario', authenticate, calendarioRouter);
app.use('/api/historial', authenticate, historialRouter);
app.use('/api/profesor', authenticate, profesorRouter);
app.use('/api/usuarios', authenticate, usuariosRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API escuchando en puerto ${PORT}`));
