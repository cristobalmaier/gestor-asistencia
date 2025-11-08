import { useEffect, useMemo, useState } from 'react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'


export default function Calendario() {
  const { user } = useAuth()
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0,10))
  const [cursos, setCursos] = useState([])
  const [cursoId, setCursoId] = useState('')
  const [eventos, setEventos] = useState([])
  const [desc, setDesc] = useState('')
  const [resumen, setResumen] = useState(null)

  useEffect(() => { api.get('/cursos').then(({ data }) => setCursos(data)) }, [])

  const cargar = async () => {
    const params = {}
    if (fecha) params.fecha = fecha
    if (cursoId) params.cursoId = cursoId
    const { data } = await api.get('/calendario', { params })
    setEventos(data)

    if (fecha && cursoId) {
      // Resumen del día por curso
      const { data: rows } = await api.get('/asistencias', { params: { cursoId, desde: fecha, hasta: fecha } })
      const tot = rows.reduce((acc, r) => {
        acc.total++;
        acc.presentes += r.estado === 'Presente' ? 1 : 0
        acc.ausentes += r.estado === 'Ausente' ? 1 : 0
        acc.tardes += r.estado === 'Tarde' ? 1 : 0
        acc.justificados += r.estado === 'Justificado' ? 1 : 0
        return acc
      }, { total: 0, presentes: 0, ausentes: 0, tardes: 0, justificados: 0 })
      setResumen(tot)
    } else {
      setResumen(null)
    }
  }

  useEffect(() => { cargar() }, [fecha, cursoId])

  const crearEvento = async () => {
    if (!fecha || !desc) return alert('Fecha y descripción requeridas')
    try {
      await api.post('/calendario', { fecha, descripcion: desc, cursoId: cursoId || null })
      setDesc('')
      await cargar()
    } catch (e) { alert('No se pudo crear el evento (requiere preceptor o admin)') }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Calendario</h1>
        <p className="text-[var(--text-secondary)] mt-1">Eventos y actividades del curso</p>
      </div>

      <div className="card card-body">
        <div className="grid md:grid-cols-4 gap-4">
          <div>
            <label className="label">Fecha</label>
            <input type="date" className="input" value={fecha} onChange={e => setFecha(e.target.value)} />
          </div>
          <div>
            <label className="label">Curso</label>
            <select className="select" value={cursoId} onChange={e => setCursoId(e.target.value)}>
              <option value="">Todos los cursos</option>
              {cursos.map(c => (<option key={c.id_curso} value={c.id_curso}>{c.nombre} {c.anio}°{c.division}</option>))}
            </select>
          </div>
        </div>
      </div>

      {['preceptor','admin'].includes(user.rol) && (
        <div className="card card-body">
          <h3 className="font-semibold text-[var(--text-primary)] mb-4">Crear nuevo evento</h3>
          <div className="grid md:grid-cols-4 gap-4 items-end">
            <div className="md:col-span-3">
              <label className="label">Descripción</label>
              <input className="input" placeholder="Ej: Acto escolar 9hs" value={desc} onChange={e => setDesc(e.target.value)} />
            </div>
            <div>
              <button onClick={crearEvento} className="w-full btn btn-primary">Agregar evento</button>
            </div>
          </div>
        </div>
      )}

      {resumen && (
        <div className="card card-body">
          <h3 className="font-semibold text-[var(--text-primary)] mb-4">Resumen del día</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-emerald-50 rounded-xl">
              <div className="text-2xl font-bold text-emerald-700">{resumen.presentes}</div>
              <div className="text-xs text-emerald-600 font-medium mt-1">Presentes</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-xl">
              <div className="text-2xl font-bold text-red-700">{resumen.ausentes}</div>
              <div className="text-xs text-red-600 font-medium mt-1">Ausentes</div>
            </div>
            <div className="text-center p-3 bg-amber-50 rounded-xl">
              <div className="text-2xl font-bold text-amber-700">{resumen.tardes}</div>
              <div className="text-xs text-amber-600 font-medium mt-1">Tarde</div>
            </div>
            <div className="text-center p-3 bg-indigo-50 rounded-xl">
              <div className="text-2xl font-bold text-indigo-700">{resumen.justificados}</div>
              <div className="text-xs text-indigo-600 font-medium mt-1">Justificados</div>
            </div>
          </div>
        </div>
      )}

      <div className="table-card">
        <table className="min-w-full">
          <thead className="table-head">
            <tr>
              <th className="text-left px-6 py-4">Fecha</th>
              <th className="text-left px-6 py-4">Curso</th>
              <th className="text-left px-6 py-4">Descripción</th>
            </tr>
          </thead>
          <tbody>
            {eventos.map(ev => (
              <tr key={ev.id_evento}>
                <td className="px-6 py-4">
                  <span className="font-medium text-[var(--text-primary)]">{new Date(ev.fecha).toLocaleDateString('es-ES')}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-[var(--text-secondary)]">{ev.id_curso || 'Todos'}</span>
                </td>
                <td className="px-6 py-4">{ev.descripcion}</td>
              </tr>
            ))}
            {eventos.length === 0 && (
              <tr><td className="px-6 py-12 text-center text-[var(--text-secondary)]" colSpan={3}>No hay eventos para mostrar</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
