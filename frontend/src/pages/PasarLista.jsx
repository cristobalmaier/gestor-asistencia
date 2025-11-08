import { useEffect, useMemo, useState } from 'react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import StatusPill from '../components/StatusPill'

const ESTADOS = ['Presente','Ausente','Tarde','Justificado']

export default function PasarLista() {
  const { user } = useAuth()
  const [cursos, setCursos] = useState([])
  const [materias, setMaterias] = useState([])
  const [misMaterias, setMisMaterias] = useState([])
  const [cursoId, setCursoId] = useState('')
  const [materiaId, setMateriaId] = useState('')
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0,10))
  const [alumnos, setAlumnos] = useState([])
  const [estadoCurso, setEstadoCurso] = useState(null)
  const isProfesor = user.rol === 'profesor'

  useEffect(() => {
    if (isProfesor) {
      api.get('/profesor/mis-materias').then(({ data }) => setMisMaterias(data))
    } else {
      api.get('/cursos').then(({ data }) => setCursos(data))
    }
  }, [isProfesor])

  useEffect(() => {
    if (!isProfesor && cursoId) {
      api.get(`/cursos/${cursoId}/materias`).then(({ data }) => setMaterias(data))
      if (fecha) api.get(`/cursos/${cursoId}/estado`, { params: { fecha } }).then(({ data }) => setEstadoCurso(data))
    }
  }, [cursoId, fecha, isProfesor])

  const puedeBuscar = useMemo(() => {
    if (isProfesor) return !!materiaId && !!fecha && !!cursoId
    return !!cursoId && !!materiaId && !!fecha
  }, [isProfesor, cursoId, materiaId, fecha])

  const cargarLista = async () => {
    if (!puedeBuscar) return
    const { data } = await api.get('/asistencias/dia', { params: { cursoId, materiaId, fecha } })
    setAlumnos(data.alumnos)
  }

  const guardar = async () => {
    const items = alumnos.filter(a => a.estado).map(a => ({ alumnoId: a.id_alumno, estado: a.estado }))
    await api.post('/asistencias/pasar-lista', { cursoId, materiaId, fecha, items })
    await cargarLista()
    if (!isProfesor) {
      const { data } = await api.get(`/cursos/${cursoId}/estado`, { params: { fecha } })
      setEstadoCurso(data)
    }
    alert('Asistencias registradas')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pasar Lista</h1>
        <p className="text-gray-600 mt-1">Registra la asistencia de los estudiantes</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        {isProfesor ? (
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1.5">Materia / Curso</label>
              <select className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors" value={`${cursoId}|${materiaId}`} onChange={e => { const [c,m] = e.target.value.split('|'); setCursoId(c); setMateriaId(m); }}>
                <option value="">Seleccionar</option>
                {misMaterias.map(mm => (
                  <option key={`${mm.id_curso}|${mm.id_materia}`} value={`${mm.id_curso}|${mm.id_materia}`}>{mm.curso} {mm.anio}°{mm.division} · {mm.materia}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1.5">Fecha</label>
              <input type="date" className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors" value={fecha} onChange={e => setFecha(e.target.value)} />
            </div>
            <div className="flex items-end"><button onClick={cargarLista} className="w-full inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors">Cargar alumnos</button></div>
          </div>
        ) : (
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1.5">Curso</label>
              <select className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors" value={cursoId} onChange={e => setCursoId(e.target.value)}>
                <option value="">Seleccionar</option>
                {cursos.map(c => (<option key={c.id_curso} value={c.id_curso}>{c.nombre} {c.anio}°{c.division}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1.5">Materia</label>
              <select className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors" value={materiaId} onChange={e => setMateriaId(e.target.value)}>
                <option value="">Seleccionar</option>
                {materias.map(m => (<option key={m.id_materia} value={m.id_materia}>{m.nombre} {m.profesor_apellido ? `· ${m.profesor_apellido}` : ''}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1.5">Fecha</label>
              <input type="date" className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors" value={fecha} onChange={e => setFecha(e.target.value)} />
            </div>
            <div className="flex items-end"><button onClick={cargarLista} className="w-full inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors">Cargar alumnos</button></div>
            {estadoCurso && (
              <div className="md:col-span-4">
                <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ${estadoCurso.lista_pasada ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-700 border border-gray-200'}`}>
                  {estadoCurso.lista_pasada ? '✓ Lista pasada en este curso para la fecha' : 'Sin lista para la fecha'}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {alumnos.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50 text-gray-600 text-xs font-medium uppercase tracking-wide">
              <tr>
                <th className="text-left px-6 py-4">Alumno</th>
                <th className="text-left px-6 py-4">Estado</th>
              </tr>
            </thead>
            <tbody>
              {alumnos.map(a => (
                <tr key={a.id_alumno} className="transition-colors duration-100 hover:bg-gray-50 border-b border-gray-100 last:border-0">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{a.apellido}, {a.nombre}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <StatusPill value={a.estado} />
                      <select className="max-w-xs w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors" value={a.estado || ''} onChange={e => setAlumnos(prev => prev.map(x => x.id_alumno === a.id_alumno ? { ...x, estado: e.target.value } : x))}>
                        <option value="">Seleccionar estado</option>
                        {ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {alumnos.length > 0 && (
        <div className="flex justify-end gap-3">
          <button onClick={guardar} className="inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-base font-medium bg-primary-600 text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors shadow-sm">Guardar asistencias</button>
        </div>
      )}
    </div>
  )
}
