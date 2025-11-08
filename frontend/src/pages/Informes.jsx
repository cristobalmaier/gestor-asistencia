import { useEffect, useState } from 'react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

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
  const [loading, setLoading] = useState(false)
  const [profesores, setProfesores] = useState([])
  const [alumnos, setAlumnos] = useState([])
  const [busquedaProfesor, setBusquedaProfesor] = useState('')
  const [busquedaAlumno, setBusquedaAlumno] = useState('')

  useEffect(() => { 
    api.get('/cursos').then(({ data }) => setCursos(data))
  }, [])

  useEffect(() => {
    setMaterias([])
    setMateriaId('')
    if (cursoId) {
      api.get(`/cursos/${cursoId}/materias`).then(({ data }) => setMaterias(data))
    }
  }, [cursoId])

  // Buscar profesores
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (busquedaProfesor.trim()) {
        api.get('/usuarios/profesores', { params: { busqueda: busquedaProfesor } })
          .then(({ data }) => setProfesores(data))
          .catch(() => setProfesores([]))
      } else {
        setProfesores([])
        setProfesorId('')
      }
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [busquedaProfesor])

  // Buscar alumnos
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (busquedaAlumno.trim()) {
        api.get('/usuarios/alumnos', { params: { busqueda: busquedaAlumno } })
          .then(({ data }) => setAlumnos(data))
          .catch(() => setAlumnos([]))
      } else {
        setAlumnos([])
        setAlumnoId('')
      }
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [busquedaAlumno])

  // Limpiar alumnoId cuando se cambia de tab
  useEffect(() => {
    setAlumnoId('')
    setMateriaId('')
    setRows([])
    setBusquedaAlumno('')
    setBusquedaProfesor('')
    setProfesorId('')
  }, [tab])

  const validarFechas = () => {
    if (desde && hasta) {
      const fechaDesde = new Date(desde)
      const fechaHasta = new Date(hasta)
      if (fechaDesde > fechaHasta) {
        toast.error('La fecha desde debe ser anterior a la fecha hasta')
        return false
      }
    }
    return true
  }

  const cargar = async () => {
    if (!validarFechas()) return

    try {
      setLoading(true)
      if (tab === 'curso') {
        if (!cursoId) {
          toast.error('Seleccione un curso para continuar')
          return
        }
        const { data } = await api.get('/reportes/curso', { 
          params: { 
            cursoId, 
            desde: desde || undefined, 
            hasta: hasta || undefined, 
            materiaId: materiaId || undefined, 
            profesorId: profesorId || undefined 
          } 
        })
        setRows(data)
      } else {
        if (['padre','directivo','preceptor','profesor'].includes(user.rol) && !alumnoId) {
          toast.error('Seleccione un alumno para continuar')
          return
        }
        const params = { desde: desde || undefined, hasta: hasta || undefined, materiaId: materiaId || undefined }
        if (['padre','directivo','preceptor','profesor'].includes(user.rol) && alumnoId) params.alumnoId = alumnoId
        const { data } = await api.get('/reportes/alumno', { params })
        setRows(data)
      }
    } catch (error) {
      toast.error('Error al cargar los datos')
      console.error('Error al cargar los datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const descargarReporte = async (format) => {
    try {
      const params = new URLSearchParams()
      if (desde) params.set('desde', desde)
      if (hasta) params.set('hasta', hasta)
      
      let url = ''
      if (tab === 'curso') {
        if (!cursoId) {
          toast.error('Seleccione un curso para continuar')
          return
        }
        if (cursoId) params.set('cursoId', cursoId)
        if (materiaId) params.set('materiaId', materiaId)
        if (profesorId) params.set('profesorId', profesorId)
        params.set('format', format)
        url = `${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}/reportes/curso?${params.toString()}`
      } else {
        if (['padre','directivo','preceptor','profesor'].includes(user.rol) && alumnoId) params.set('alumnoId', alumnoId)
        if (materiaId) params.set('materiaId', materiaId)
        params.set('format', format)
        url = `${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}/reportes/alumno?${params.toString()}`
      }
      
      // Usamos fetch para manejar mejor la respuesta
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Error al generar el reporte')
      }
      
      // Creamos un enlace temporal para la descarga
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.setAttribute('download', `reporte_${tab}.${format}`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      
      // Mostrar notificación de éxito
      toast.success('Reporte generado correctamente', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      })
      
    } catch (error) {
      console.error('Error al descargar el reporte:', error)
      toast.error('Error al generar el reporte', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      })
    }
  }

  return (
    <div className="space-y-6">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Informes</h1>
        <p className="text-gray-600 mt-1">Consulta y descarga reportes de asistencia</p>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        {user.rol !== 'alumno' && (
          <button 
            onClick={() => setTab('curso')} 
            className={`px-4 py-3 font-semibold text-sm transition-colors border-b-2 ${
              tab==='curso' 
                ? 'border-primary-600 text-primary-600' 
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Por curso
          </button>
        )}
        <button 
          onClick={() => setTab('alumno')} 
          className={`px-4 py-3 font-semibold text-sm transition-colors border-b-2 ${
            tab==='alumno' 
              ? 'border-primary-600 text-primary-600' 
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Por alumno
        </button>
      </div>

      {tab === 'curso' && user.rol !== 'alumno' && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          <div className="grid md:grid-cols-5 gap-4">
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
                <option value="">Todas</option>
                {materias.map(m => (<option key={m.id_materia} value={m.id_materia}>{m.nombre}</option>))}
              </select>
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-900 mb-1.5">Profesor</label>
              <input 
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 bg-white placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors" 
                placeholder="Buscar por nombre o apellido..." 
                value={busquedaProfesor} 
                onChange={e => {
                  setBusquedaProfesor(e.target.value)
                  if (!e.target.value) setProfesorId('')
                }}
              />
              {profesores.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {profesores.map(prof => (
                    <button
                      key={prof.id_usuario}
                      type="button"
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                      onClick={() => {
                        setProfesorId(prof.id_usuario)
                        setBusquedaProfesor(`${prof.apellido}, ${prof.nombre}`)
                        setProfesores([])
                      }}
                    >
                      <div className="font-medium text-gray-900">{prof.apellido}, {prof.nombre}</div>
                      <div className="text-xs text-gray-500">{prof.email}</div>
                    </button>
                  ))}
                </div>
              )}
              {profesorId && busquedaProfesor && (
                <input type="hidden" value={profesorId} />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1.5">Desde</label>
              <input type="date" className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors" value={desde} onChange={e => setDesde(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1.5">Hasta</label>
              <input type="date" className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors" value={hasta} onChange={e => setHasta(e.target.value)} />
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={cargar} 
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
              {loading ? 'Cargando...' : 'Buscar'}
            </button>
            
            <button 
              onClick={() => descargarReporte('pdf')} 
              className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              PDF
            </button>
            
            <button 
              onClick={() => descargarReporte('excel')} 
              className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Excel
            </button>
            
            <button 
              onClick={() => descargarReporte('csv')} 
              className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium bg-gray-600 text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 17v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V3" />
              </svg>
              CSV
            </button>
          </div>
        </div>
      )}

      {tab === 'alumno' && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          <div className="grid md:grid-cols-4 gap-4">
            {user.rol !== 'alumno' && (
              <div className="relative">
                <label className="block text-sm font-medium text-gray-900 mb-1.5">Alumno</label>
                <input 
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 bg-white placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors" 
                  value={busquedaAlumno} 
                  onChange={e => {
                    setBusquedaAlumno(e.target.value)
                    if (!e.target.value) setAlumnoId('')
                  }}
                  placeholder="Buscar por nombre o apellido..." 
                />
                {alumnos.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                    {alumnos.map(alumno => (
                      <button
                        key={alumno.id_usuario}
                        type="button"
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                        onClick={() => {
                          setAlumnoId(alumno.id_usuario)
                          setBusquedaAlumno(`${alumno.apellido}, ${alumno.nombre}`)
                          setAlumnos([])
                        }}
                      >
                        <div className="font-medium text-gray-900">{alumno.apellido}, {alumno.nombre}</div>
                        {alumno.dni && <div className="text-xs text-gray-500">DNI: {alumno.dni}</div>}
                      </button>
                    ))}
                  </div>
                )}
                {alumnoId && busquedaAlumno && (
                  <input type="hidden" value={alumnoId} />
                )}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1.5">Materia</label>
              <select className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors disabled:bg-gray-50 disabled:text-gray-500" value={materiaId} onChange={e => setMateriaId(e.target.value)} disabled={!cursoId && user.rol !== 'alumno'}>
                <option value="">Todas</option>
                {materias.map(m => (<option key={m.id_materia} value={m.id_materia}>{m.nombre}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1.5">Desde</label>
              <input type="date" className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors" value={desde} onChange={e => setDesde(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1.5">Hasta</label>
              <input type="date" className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors" value={hasta} onChange={e => setHasta(e.target.value)} />
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={cargar} 
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
              {loading ? 'Cargando...' : 'Buscar'}
            </button>
            
            <button 
              onClick={() => descargarReporte('pdf')} 
              className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              PDF
            </button>
            
            <button 
              onClick={() => descargarReporte('excel')} 
              className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Excel
            </button>
            
            <button 
              onClick={() => descargarReporte('csv')} 
              className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium bg-gray-600 text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 17v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V3" />
              </svg>
              CSV
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50 text-gray-600 text-xs font-medium uppercase tracking-wide">
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
              <tr key={i} className="transition-colors duration-100 hover:bg-gray-50 border-b border-gray-100 last:border-0">
                {tab === 'curso' ? (
                  <>
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">{r.apellido}, {r.nombre}</span>
                    </td>
                    <td className="px-6 py-4"><span className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium bg-green-50 text-green-700 border border-green-200">{r.presentes}</span></td>
                    <td className="px-6 py-4"><span className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium bg-red-50 text-red-700 border border-red-200">{r.ausentes}</span></td>
                    <td className="px-6 py-4"><span className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">{r.tardes}</span></td>
                    <td className="px-6 py-4"><span className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium bg-primary-50 text-primary-700 border border-primary-200">{r.justificados}</span></td>
                    <td className="px-6 py-4"><span className="font-semibold text-gray-900">{r.total}</span></td>
                  </>
                ) : (
                  <>
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">{new Date(r.fecha).toLocaleDateString('es-ES')}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{r.materia}</td>
                    <td className="px-6 py-4"><span className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">{r.estado}</span></td>
                  </>
                )}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td className="px-6 py-12 text-center text-gray-600" colSpan={tab === 'curso' ? 6 : 3}>No hay datos para mostrar</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
