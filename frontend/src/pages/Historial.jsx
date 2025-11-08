import { useEffect, useState } from 'react'
import api from '../services/api'

export default function Historial() {
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [idUsuario, setIdUsuario] = useState('')
  const [rows, setRows] = useState([])

  const cargar = async () => {
    const params = {}
    if (desde) params.desde = desde
    if (hasta) params.hasta = hasta
    if (idUsuario) params.id_usuario = idUsuario
    const { data } = await api.get('/historial', { params })
    setRows(data)
  }

  useEffect(() => { cargar() }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Historial de Modificaciones</h1>
        <p className="text-[var(--text-secondary)] mt-1">Auditoría de cambios en el sistema</p>
      </div>

      <div className="card card-body">
        <div className="grid md:grid-cols-4 gap-4">
          <div>
            <label className="label">Desde</label>
            <input type="date" className="input" value={desde} onChange={e => setDesde(e.target.value)} />
          </div>
          <div>
            <label className="label">Hasta</label>
            <input type="date" className="input" value={hasta} onChange={e => setHasta(e.target.value)} />
          </div>
          <div>
            <label className="label">ID Usuario</label>
            <input className="input" value={idUsuario} onChange={e => setIdUsuario(e.target.value)} placeholder="Opcional" />
          </div>
          <div className="flex items-end">
            <button onClick={cargar} className="w-full btn btn-primary">Buscar</button>
          </div>
        </div>
      </div>

      <div className="table-card">
        <table className="min-w-full">
          <thead className="table-head">
            <tr>
              <th className="text-left px-6 py-4">Fecha y hora</th>
              <th className="text-left px-6 py-4">Usuario</th>
              <th className="text-left px-6 py-4">Acción</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id_historial}>
                <td className="px-6 py-4">
                  <span className="font-medium text-[var(--text-primary)]">
                    {new Date(r.fecha_hora).toLocaleString('es-ES')}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="badge badge-neutral">ID: {r.id_usuario}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-[var(--text-secondary)]">{r.accion}</span>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td className="px-6 py-12 text-center text-[var(--text-secondary)]" colSpan={3}>No hay registros para mostrar</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
