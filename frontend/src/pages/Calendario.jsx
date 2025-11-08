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
        <h1 className="text-2xl font-bold text-gray-900">Calendario</h1>
        <p className="text-gray-600 mt-1">Eventos y actividades del curso</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="grid md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1.5">Fecha</label>
            <input type="date" className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors" value={fecha} onChange={e => setFecha(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1.5">Curso</label>
            <select className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors" value={cursoId} onChange={e => setCursoId(e.target.value)}>
              <option value="">Todos los cursos</option>
              {cursos.map(c => (<option key={c.id_curso} value={c.id_curso}>{c.nombre} {c.anio}°{c.division}</option>))}
            </select>
          </div>
        </div>
      </div>

      {['preceptor','admin'].includes(user.rol) && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Crear nuevo evento</h3>
          <div className="grid md:grid-cols-4 gap-4 items-end">
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-900 mb-1.5">Descripción</label>
              <input className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 bg-white placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors" placeholder="Ej: Acto escolar 9hs" value={desc} onChange={e => setDesc(e.target.value)} />
            </div>
            <div>
              <button onClick={crearEvento} className="w-full inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors">Agregar evento</button>
            </div>
          </div>
        </div>
      )}

      {resumen && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Resumen del día</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-700">{resumen.presentes}</div>
              <div className="text-xs text-green-600 font-medium mt-1">Presentes</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="text-2xl font-bold text-red-700">{resumen.ausentes}</div>
              <div className="text-xs text-red-600 font-medium mt-1">Ausentes</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="text-2xl font-bold text-yellow-700">{resumen.tardes}</div>
              <div className="text-xs text-yellow-600 font-medium mt-1">Tarde</div>
            </div>
            <div className="text-center p-4 bg-primary-50 rounded-lg border border-primary-200">
              <div className="text-2xl font-bold text-primary-700">{resumen.justificados}</div>
              <div className="text-xs text-primary-600 font-medium mt-1">Justificados</div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50 text-gray-600 text-xs font-medium uppercase tracking-wide">
            <tr>
              <th className="text-left px-6 py-4">Fecha</th>
              <th className="text-left px-6 py-4">Curso</th>
              <th className="text-left px-6 py-4">Descripción</th>
            </tr>
          </thead>
          <tbody>
            {eventos.map(ev => (
              <tr key={ev.id_evento} className="transition-colors duration-100 hover:bg-gray-50 border-b border-gray-100 last:border-0">
                <td className="px-6 py-4">
                  <span className="font-medium text-gray-900">{new Date(ev.fecha).toLocaleDateString('es-ES')}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-gray-600">{ev.id_curso || 'Todos'}</span>
                </td>
                <td className="px-6 py-4 text-gray-900">{ev.descripcion}</td>
              </tr>
            ))}
            {eventos.length === 0 && (
              <tr><td className="px-6 py-12 text-center text-gray-600" colSpan={3}>No hay eventos para mostrar</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
