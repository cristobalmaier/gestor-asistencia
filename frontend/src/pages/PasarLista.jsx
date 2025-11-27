import { useEffect, useMemo, useState } from 'react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import StatusPill from '../components/StatusPill'
import { CheckCircleIcon } from '@heroicons/react/24/outline'

const ESTADOS = ['Presente', 'Ausente', 'Tarde', 'Justificado']

export default function PasarLista() {
  const { user } = useAuth()
  const [cursos, setCursos] = useState([])
  const [materias, setMaterias] = useState([])
  const [misMaterias, setMisMaterias] = useState([])
  const [cursoId, setCursoId] = useState('')
  const [materiaId, setMateriaId] = useState('')
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10))
  const [alumnos, setAlumnos] = useState([])
  const [estadoCurso, setEstadoCurso] = useState(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [existingAttendanceId, setExistingAttendanceId] = useState(null)
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
    // Si no hay curso seleccionado, cargar todos los alumnos
    if (!cursoId) {
      try {
        const response = await api.get('/alumnos')
        console.log('Todos los alumnos cargados:', response.data)
        setAlumnos(response.data || [])
        setExistingAttendanceId(null)
        setIsEditing(false)
        return
      } catch (error) {
        console.error('Error al cargar todos los alumnos:', error)
        setAlumnos([])
        return
      }
    }

    // Si hay un curso seleccionado, cargar según el curso
    if (!puedeBuscar) return
    console.log('Cargando lista con:', { cursoId, materiaId, fecha })

    try {
      const response = await api.get('/asistencias/dia', {
        params: {
          cursoId,
          materiaId,
          fecha
        }
      })
      console.log('Respuesta del servidor:', response.data)

      const data = response.data
      setAlumnos(data.alumnos || [])

      // Verificar si hay asistencia existente para esta fecha
      if (data.existingAttendance) {
        console.log('Asistencia existente encontrada:', data.existingAttendance)
        setExistingAttendanceId(data.existingAttendance.id)
        setIsEditing(false) // Ya pasaron lista -> mostrar botón Editar
      } else {
        console.log('No se encontró asistencia existente para esta fecha')
        setExistingAttendanceId(null)
        setIsEditing(true) // No pasaron lista -> acceso rápido con botones
      }
    } catch (error) {
      console.error('Error al cargar la lista:', error)
      setAlumnos([])
      setExistingAttendanceId(null)
      setIsEditing(false)
    }
  }

  const guardar = async () => {
    try {
      const items = alumnos.filter(a => a.estado).map(a => ({
        alumnoId: a.id_alumno,
        estado: a.estado,
        asistenciaId: a.asistencia_id // For updates
      }))

      // OPTIMISTIC UPDATE: Switch mode immediately, show success after 1s
      const wasEditing = isEditing
      setIsEditing(false)

      setTimeout(() => {
        setShowSuccessModal(true)
        setTimeout(() => setShowSuccessModal(false), 3000)
      }, 1000)

      // Defer the network request to allow the UI to paint the success modal first
      setTimeout(async () => {
        try {
          // Always use POST /pasar-lista which handles upsert (create or update)
          await api.post('/asistencias/pasar-lista', {
            cursoId,
            materiaId,
            fecha,
            items
          })

          // Reload data in background to get the new IDs
          await cargarLista()

          if (!isProfesor) {
            const { data } = await api.get(`/cursos/${cursoId}/estado`, { params: { fecha } })
            setEstadoCurso(data)
          }
        } catch (error) {
          // If it fails, revert UI changes and show error
          console.error('Error al guardar la asistencia:', error)
          setShowSuccessModal(false)
          setIsEditing(wasEditing)
          alert('Ocurrió un error al guardar la asistencia. Por favor intente nuevamente.')
        }
      }, 0)
    } catch (error) {
      console.error('Error al preparar datos:', error)
      alert('Ocurrió un error inesperado')
    }
  }

  const eliminarAsistencia = async () => {
    if (!existingAttendanceId) return
    if (!window.confirm('¿Estás seguro de que deseas eliminar este registro de asistencia?')) return

    try {
      await api.delete(`/asistencias/${existingAttendanceId}`)
      setAlumnos(prev => prev.map(a => ({ ...a, estado: null })))
      setExistingAttendanceId(null)
      setIsEditing(false)

      if (!isProfesor) {
        const { data } = await api.get(`/cursos/${cursoId}/estado`, { params: { fecha } })
        setEstadoCurso(data)
      }

      // Show success message
      setShowSuccessModal(true)
      setTimeout(() => setShowSuccessModal(false), 3000)
    } catch (error) {
      console.error('Error al eliminar la asistencia:', error)
      alert('Ocurrió un error al eliminar la asistencia')
    }
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
              <select className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors" value={`${cursoId}|${materiaId}`} onChange={e => { const [c, m] = e.target.value.split('|'); setCursoId(c); setMateriaId(m); }}>
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
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">
              {isEditing ? 'Editando Asistencia' : 'Vista de Asistencia'}
            </h3>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Editar
              </button>
            )}
          </div>
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
                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => setAlumnos(prev => prev.map(x => x.id_alumno === a.id_alumno ? { ...x, estado: 'Presente' } : x))}
                            className={`px-3 py-1 text-xs font-medium rounded-md border transition-colors ${a.estado === 'Presente'
                              ? 'bg-green-600 text-white border-green-600 shadow-sm'
                              : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                              }`}
                            title="Marcar como Presente"
                          >
                            Presente
                          </button>
                          <button
                            onClick={() => setAlumnos(prev => prev.map(x => x.id_alumno === a.id_alumno ? { ...x, estado: 'Ausente' } : x))}
                            className={`px-3 py-1 text-xs font-medium rounded-md border transition-colors ${a.estado === 'Ausente'
                              ? 'bg-red-600 text-white border-red-600 shadow-sm'
                              : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                              }`}
                            title="Marcar como Ausente"
                          >
                            Ausente
                          </button>
                          <button
                            onClick={() => setAlumnos(prev => prev.map(x => x.id_alumno === a.id_alumno ? { ...x, estado: 'Tarde' } : x))}
                            className={`px-3 py-1 text-xs font-medium rounded-md border transition-colors ${a.estado === 'Tarde'
                              ? 'bg-yellow-500 text-white border-yellow-500 shadow-sm'
                              : 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100'
                              }`}
                            title="Marcar como Tarde"
                          >
                            Tarde
                          </button>
                          <button
                            onClick={() => setAlumnos(prev => prev.map(x => x.id_alumno === a.id_alumno ? { ...x, estado: 'Justificado' } : x))}
                            className={`px-3 py-1 text-xs font-medium rounded-md border transition-colors ${a.estado === 'Justificado'
                              ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                              : 'bg-primary-50 text-primary-700 border-primary-200 hover:bg-primary-100'
                              }`}
                            title="Marcar como Justificado"
                          >
                            Justificado
                          </button>
                        </>
                      ) : (
                        <StatusPill value={a.estado} />
                      )}
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
          {isEditing && existingAttendanceId && (
            <>
              <button
                onClick={eliminarAsistencia}
                className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors shadow-sm"
              >
                Eliminar Asistencia
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium bg-yellow-500 text-white hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-colors shadow-sm"
              >
                Cancelar Edición
              </button>
            </>
          )}
          <button
            onClick={guardar}
            className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors shadow-sm ${isEditing
              ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
              : 'bg-primary-600 hover:bg-primary-700 focus:ring-primary-500'
              }`}
          >
            {isEditing ? (existingAttendanceId ? 'Actualizar Asistencia' : 'Guardar Asistencia') : 'Guardar Asistencia'}
          </button>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <div className="flex flex-col items-center text-center">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <CheckCircleIcon className="h-6 w-6 text-green-600" aria-hidden="true" />
              </div>
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900">¡Éxito!</h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    La asistencia se ha guardado correctamente.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-5">
              <button
                type="button"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:text-sm"
                onClick={() => setShowSuccessModal(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
