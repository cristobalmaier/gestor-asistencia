import { useEffect, useState } from 'react'
import api from '../services/api'

export default function Historial() {
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [idUsuario, setIdUsuario] = useState('')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)

  const humanizeKey = (k) => {
    return k
      .replace(/([A-Z])/g, ' $1')
      .replace(/[_-]/g, ' ')
      .replace(/^./, s => s.toUpperCase())
  }

  const renderAccion = (accion) => {
    if (!accion) return <span className="text-gray-400 italic">Sin acción registrada</span>
    if (typeof accion === 'object') {
      return <pre className="text-xs bg-gray-50 p-2 rounded border border-gray-200 overflow-x-auto">{JSON.stringify(accion, null, 2)}</pre>
    }
    // Intenta parsear JSON
    try {
      const parsed = JSON.parse(accion)
      if (parsed && typeof parsed === 'object') {
        // Casos conocidos
        const tipo = parsed.tipo || parsed.type || ''
        if (tipo === 'CARGA_LISTA' || tipo === 'CARGA_LIST') {
          const curso = parsed.cursoId || parsed.cursoid || parsed.curso || parsed.cursoID || ''
          const materia = parsed.materiaId || parsed.materiaid || parsed.materia || ''
          const fecha = parsed.fecha || ''
          const cantidad = parsed.cantidad ?? parsed.count ?? ''
          return (
            <div className="space-y-1">
              <div className="font-semibold text-gray-900">Carga de lista masiva</div>
              <div className="text-sm text-gray-600 space-y-0.5">
                {curso && <div>Curso: <span className="font-medium">{curso}</span></div>}
                {materia && <div>Materia: <span className="font-medium">{materia}</span></div>}
                {fecha && <div>Fecha: <span className="font-medium">{fecha}</span></div>}
                {cantidad && <div>Cantidad de registros: <span className="font-medium">{cantidad}</span></div>}
              </div>
            </div>
          )
        }
        // Genérico: mostrar pares clave: valor en forma legible
        return (
          <div className="space-y-1">
            {Object.entries(parsed).map(([k, v]) => (
              <div key={k} className="text-sm">
                <span className="font-medium text-gray-700">{humanizeKey(k)}:</span>{' '}
                <span className="text-gray-900">{String(v)}</span>
              </div>
            ))}
          </div>
        )
      }
    } catch (e) {
      // no JSON
    }
    // si no es JSON, devolver tal cual
    return <span className="text-sm text-gray-700">{accion}</span>
  }

  const formatearFechaHora = (fechaHora) => {
    if (!fechaHora) return '-'
    try {
      const fecha = new Date(fechaHora)
      const fechaStr = fecha.toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      })
      const horaStr = fecha.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      })
      return (
        <div className="space-y-0.5">
          <div className="font-medium text-gray-900">{fechaStr}</div>
          <div className="text-xs text-gray-500">{horaStr}</div>
        </div>
      )
    } catch (e) {
      return fechaHora
    }
  }

  const cargar = async () => {
    const params = {}
    if (desde) params.desde = desde
    if (hasta) params.hasta = hasta
    if (idUsuario) params.id_usuario = idUsuario
    try {
      setLoading(true)
      const { data } = await api.get('/historial', { params })
      setRows(data)
    } catch (err) {
      console.error('Error cargando historial', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [])

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Historial de Modificaciones</h1>
        <p className="text-gray-600 mt-1">Auditoría de cambios en el sistema</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="grid md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1.5">Desde</label>
            <input type="date" className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors" value={desde} onChange={e => setDesde(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1.5">Hasta</label>
            <input type="date" className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors" value={hasta} onChange={e => setHasta(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1.5">ID Usuario</label>
            <input className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 bg-white placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors" value={idUsuario} onChange={e => setIdUsuario(e.target.value)} placeholder="Opcional" />
          </div>
          <div className="flex items-end">
            <button onClick={cargar} className="w-full inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors disabled:opacity-50" disabled={loading}>{loading ? 'Buscando...' : 'Buscar'}</button>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50 text-gray-600 text-xs font-medium uppercase tracking-wide">
            <tr>
              <th className="text-left px-6 py-4">Fecha y hora</th>
              <th className="text-left px-6 py-4">Usuario</th>
              <th className="text-left px-6 py-4">Acción</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id_historial} className="transition-colors duration-100 hover:bg-gray-50 border-b border-gray-100 last:border-0">
                <td className="px-6 py-4">
                  {formatearFechaHora(r.fecha_hora)}
                </td>
                <td className="px-6 py-4">
                  {r.nombre && r.apellido ? (
                    <div className="space-y-0.5">
                      <div className="font-medium text-gray-900">{r.apellido}, {r.nombre}</div>
                      <div className="text-xs text-gray-500">ID: {r.id_usuario}</div>
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">ID: {r.id_usuario}</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {renderAccion(r.accion)}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td className="px-6 py-12 text-center text-gray-600" colSpan={3}>No hay registros para mostrar</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
