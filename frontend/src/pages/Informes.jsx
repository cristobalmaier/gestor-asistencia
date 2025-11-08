import { useEffect, useState } from 'react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function Informes() {
  const { user } = useAuth()
  const [tab, setTab] = useState(user.rol === 'alumno' ? 'alumno' : 'curso')
  const [cursos, setCursos] = useState([])
  const [materias, setMaterias] = useState([])
  const [cursoId, setCursoId] = useState('')
  const [materiaId, setMateriaId] = useState('')
  const [profesorId, setProfesorId] = useState('')
  const [alumnoId, setAlumnoId] = useState('')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [rows, setRows] = useState([])

  useEffect(() => { api.get('/cursos').then(({ data }) => setCursos(data)) }, [])
  useEffect(() => { if (cursoId) api.get(`/cursos/${cursoId}/materias`).then(({ data }) => setMaterias(data)) }, [cursoId])

  const cargar = async () => {
    if (tab === 'curso') {
      if (!cursoId) return alert('Seleccione curso')
      const { data } = await api.get('/reportes/curso', { params: { cursoId, desde: desde || undefined, hasta: hasta || undefined, materiaId: materiaId || undefined, profesorId: profesorId || undefined } })
      setRows(data)
    } else {
      const params = { desde: desde || undefined, hasta: hasta || undefined, materiaId: materiaId || undefined }
      if (['padre','directivo','preceptor','profesor'].includes(user.rol) && alumnoId) params.alumnoId = alumnoId
      const { data } = await api.get('/reportes/alumno', { params })
      setRows(data)
    }
  }

  const descargarCSV = () => {
    const params = new URLSearchParams()
    if (desde) params.set('desde', desde)
    if (hasta) params.set('hasta', hasta)
    if (tab === 'curso') {
      if (cursoId) params.set('cursoId', cursoId)
      if (materiaId) params.set('materiaId', materiaId)
      if (profesorId) params.set('profesorId', profesorId)
      params.set('format', 'csv')
      window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}/reportes/curso?${params.toString()}`, '_blank')
    } else {
      if (['padre','directivo','preceptor','profesor'].includes(user.rol) && alumnoId) params.set('alumnoId', alumnoId)
      if (materiaId) params.set('materiaId', materiaId)
      params.set('format', 'csv')
      window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}/reportes/alumno?${params.toString()}`, '_blank')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Informes</h1>
        <p className="text-[var(--text-secondary)] mt-1">Consulta y descarga reportes de asistencia</p>
      </div>

      <div className="flex gap-2 border-b border-[var(--border)]">
        {user.rol !== 'alumno' && (
          <button 
            onClick={() => setTab('curso')} 
            className={`px-4 py-3 font-semibold text-sm transition-colors border-b-2 ${
              tab==='curso' 
                ? 'border-[var(--primary)] text-[var(--primary)]' 
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Por curso
          </button>
        )}
        <button 
          onClick={() => setTab('alumno')} 
          className={`px-4 py-3 font-semibold text-sm transition-colors border-b-2 ${
            tab==='alumno' 
              ? 'border-[var(--primary)] text-[var(--primary)]' 
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          Por alumno
        </button>
      </div>

      {tab === 'curso' && user.rol !== 'alumno' && (
        <div className="card card-body space-y-4">
          <div className="grid md:grid-cols-5 gap-4">
            <div>
              <label className="label">Curso</label>
              <select className="select" value={cursoId} onChange={e => setCursoId(e.target.value)}>
                <option value="">Seleccionar</option>
                {cursos.map(c => (<option key={c.id_curso} value={c.id_curso}>{c.nombre} {c.anio}°{c.division}</option>))}
              </select>
            </div>
            <div>
              <label className="label">Materia</label>
              <select className="select" value={materiaId} onChange={e => setMateriaId(e.target.value)}>
                <option value="">Todas</option>
                {materias.map(m => (<option key={m.id_materia} value={m.id_materia}>{m.nombre}</option>))}
              </select>
            </div>
            <div>
              <label className="label">Profesor (ID)</label>
              <input className="input" placeholder="Opcional" value={profesorId} onChange={e => setProfesorId(e.target.value)} />
            </div>
            <div>
              <label className="label">Desde</label>
              <input type="date" className="input" value={desde} onChange={e => setDesde(e.target.value)} />
            </div>
            <div>
              <label className="label">Hasta</label>
              <input type="date" className="input" value={hasta} onChange={e => setHasta(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={cargar} className="btn btn-primary">Buscar</button>
            <button onClick={descargarCSV} className="btn btn-secondary">Descargar CSV</button>
          </div>
        </div>
      )}

      {tab === 'alumno' && (
        <div className="card card-body space-y-4">
          <div className="grid md:grid-cols-4 gap-4">
            {user.rol !== 'alumno' && (
              <div>
                <label className="label">ID Alumno</label>
                <input className="input" value={alumnoId} onChange={e => setAlumnoId(e.target.value)} placeholder="Ej: 12" />
              </div>
            )}
            <div>
              <label className="label">Materia</label>
              <select className="select" value={materiaId} onChange={e => setMateriaId(e.target.value)}>
                <option value="">Todas</option>
                {materias.map(m => (<option key={m.id_materia} value={m.id_materia}>{m.nombre}</option>))}
              </select>
            </div>
            <div>
              <label className="label">Desde</label>
              <input type="date" className="input" value={desde} onChange={e => setDesde(e.target.value)} />
            </div>
            <div>
              <label className="label">Hasta</label>
              <input type="date" className="input" value={hasta} onChange={e => setHasta(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={cargar} className="btn btn-primary">Buscar</button>
            <button onClick={descargarCSV} className="btn btn-secondary">Descargar CSV</button>
          </div>
        </div>
      )}

      <div className="table-card">
        <table className="min-w-full">
          <thead className="table-head">
            <tr>
              {tab === 'curso' ? (
                <>
                  <th className="text-left px-6 py-4">Alumno</th>
                  <th className="text-left px-6 py-4">Presentes</th>
                  <th className="text-left px-6 py-4">Ausentes</th>
                  <th className="text-left px-6 py-4">Tarde</th>
                  <th className="text-left px-6 py-4">Justificados</th>
                  <th className="text-left px-6 py-4">Total</th>
                </>
              ) : (
                <>
                  <th className="text-left px-6 py-4">Fecha</th>
                  <th className="text-left px-6 py-4">Materia</th>
                  <th className="text-left px-6 py-4">Estado</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                {tab === 'curso' ? (
                  <>
                    <td className="px-6 py-4">
                      <span className="font-medium text-[var(--text-primary)]">{r.apellido}, {r.nombre}</span>
                    </td>
                    <td className="px-6 py-4"><span className="badge badge-success">{r.presentes}</span></td>
                    <td className="px-6 py-4"><span className="badge badge-error">{r.ausentes}</span></td>
                    <td className="px-6 py-4"><span className="badge badge-warning">{r.tardes}</span></td>
                    <td className="px-6 py-4"><span className="badge badge-primary">{r.justificados}</span></td>
                    <td className="px-6 py-4"><span className="font-semibold">{r.total}</span></td>
                  </>
                ) : (
                  <>
                    <td className="px-6 py-4">
                      <span className="font-medium text-[var(--text-primary)]">{new Date(r.fecha).toLocaleDateString('es-ES')}</span>
                    </td>
                    <td className="px-6 py-4">{r.materia}</td>
                    <td className="px-6 py-4"><span className="badge badge-neutral">{r.estado}</span></td>
                  </>
                )}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td className="px-6 py-12 text-center text-[var(--text-secondary)]" colSpan={tab === 'curso' ? 6 : 3}>No hay datos para mostrar</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
