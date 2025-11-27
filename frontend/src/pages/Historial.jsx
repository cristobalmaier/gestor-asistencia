import { useEffect, useState } from 'react'
import api from '../services/api'

// Colores para tipos de acción
const ACCION_CONFIG = {
  INICIO_SESION: { color: 'blue', label: 'Inicio de sesión' },
  REGISTRO_USUARIO: { color: 'green', label: 'Registro de usuario' },
  CREAR_USUARIO: { color: 'green', label: 'Crear usuario' },
  ACTUALIZAR_USUARIO: { color: 'yellow', label: 'Actualizar usuario' },
  ELIMINAR_USUARIO: { color: 'red', label: 'Eliminar usuario' },
  CREAR_ASISTENCIA: { color: 'blue', label: 'Registrar asistencia' },
  ACTUALIZAR_ASISTENCIA: { color: 'yellow', label: 'Actualizar asistencia' },
  ELIMINAR_ASISTENCIA: { color: 'red', label: 'Eliminar asistencia' },
  CARGA_LISTA_ASISTENCIA: { color: 'purple', label: 'Carga de lista' },
  CREAR_CURSO: { color: 'green', label: 'Crear curso' },
  ACTUALIZAR_CURSO: { color: 'yellow', label: 'Actualizar curso' },
  ELIMINAR_CURSO: { color: 'red', label: 'Eliminar curso' },
}

export default function Historial() {
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [nombreUsuario, setNombreUsuario] = useState('')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)

  // Obtener configuración de acción
  const getAccionConfig = (accion) => {
    const tipo = accion?.tipo || ''
    return ACCION_CONFIG[tipo] || { icon: '⚙️', color: 'gray', label: tipo || 'Acción' }
  }

  // Obtener color de badge según tipo
  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-800 border-blue-300',
      green: 'bg-green-100 text-green-800 border-green-300',
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      red: 'bg-red-100 text-red-800 border-red-300',
      purple: 'bg-purple-100 text-purple-800 border-purple-300',
      gray: 'bg-gray-100 text-gray-800 border-gray-300',
    }
    return colors[color] || colors.gray
  }

  // Helper para formatear valores en "Ver más info"
  const renderValue = (val) => {
    if (val === true) return 'Sí'
    if (val === false) return 'No'
    if (typeof val === 'object' && val !== null) {
      return (
        <div className="pl-2 border-l-2 border-gray-200 mt-1">
          {Object.entries(val).map(([subKey, subVal]) => (
            <div key={subKey} className="text-xs text-gray-600">
              <span className="font-medium capitalize">{subKey.replace(/_/g, ' ')}:</span> {renderValue(subVal)}
            </div>
          ))}
        </div>
      )
    }
    return val
  }

  // Renderizar detalles principales según tipo de acción
  const renderDetallesPrincipales = (accion) => {
    if (!accion) return null
    const tipo = accion.tipo || ''
    // Support both nested 'detalles' (legacy/expected) and flattened properties (current logger)
    const datos = accion.detalles || accion

    switch (tipo) {
      case 'CREAR_ASISTENCIA':
      case 'ACTUALIZAR_ASISTENCIA':
        return (
          <div className="space-y-2">
            <div className="text-sm">
              <span className="font-medium text-gray-700">Alumno:</span> {datos.alumno_nombre || datos.alumno_id}
            </div>
            <div className="text-sm">
              <span className="font-medium text-gray-700">Materia:</span> {datos.materia_nombre || datos.materia_id}
            </div>
            {datos.fecha && (
              <div className="text-sm">
                <span className="font-medium text-gray-700">Fecha:</span> {datos.fecha}
              </div>
            )}
            {datos.estado_nuevo && (
              <div className="text-sm">
                <span className="font-medium text-gray-700">Estado:</span>
                <div className="mt-1 inline-flex gap-2">
                  {datos.estado_nuevo.presente && <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">Presente</span>}
                  {datos.estado_nuevo.tarde && <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">Tarde</span>}
                  {datos.estado_nuevo.justificada && <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">Justificada</span>}
                </div>
              </div>
            )}
          </div>
        )

      case 'CREAR_USUARIO':
      case 'ACTUALIZAR_USUARIO':
        return (
          <div className="space-y-2">
            {datos.email && (
              <div className="text-sm">
                <span className="font-medium text-gray-700">Email:</span> {datos.email}
              </div>
            )}
            {datos.nombre && (
              <div className="text-sm">
                <span className="font-medium text-gray-700">Nombre:</span> {datos.nombre}
              </div>
            )}
            {datos.apellido && (
              <div className="text-sm">
                <span className="font-medium text-gray-700">Apellido:</span> {datos.apellido}
              </div>
            )}
            {datos.rol && (
              <div className="text-sm">
                <span className="font-medium text-gray-700">Rol:</span> <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">{datos.rol}</span>
              </div>
            )}
          </div>
        )

      case 'CARGA_LISTA_ASISTENCIA':
        return (
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-900">
              {datos.curso} - {datos.materia}
            </div>
            {datos.resumen && (
              <div className="flex flex-wrap gap-2 mt-1">
                <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded border border-green-200" title="Presentes">
                  P: {datos.resumen.presentes}
                </span>
                <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded border border-red-200" title="Ausentes">
                  A: {datos.resumen.ausentes}
                </span>
                <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded border border-yellow-200" title="Tardes">
                  T: {datos.resumen.tardes}
                </span>
                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded border border-blue-200" title="Justificados">
                  J: {datos.resumen.justificados}
                </span>
              </div>
            )}
            <div className="text-xs text-gray-500 mt-1">
              Total alumnos: {datos.resumen?.total || 0}
            </div>
            <div className="text-sm text-gray-600 mt-2">
              <details className="cursor-pointer group">
                <summary className="font-medium text-blue-600 hover:text-blue-800 text-xs list-none flex items-center gap-1">
                  <span className="group-open:hidden">▶ Ver más info</span>
                  <span className="hidden group-open:inline">▼ Ocultar info</span>
                </summary>
                <div className="mt-2 bg-gray-50 p-3 rounded-lg border border-gray-200 text-xs">
                  <div className="grid grid-cols-1 gap-2">
                    {Object.entries(datos)
                      .filter(([key]) => !['tipo', 'alumno_nombre', 'materia_nombre'].includes(key))
                      .map(([key, value]) => (
                        <div key={key} className="flex flex-col sm:flex-row sm:gap-2 border-b border-gray-100 last:border-0 pb-1 last:pb-0 items-start">
                          <span className="font-semibold text-gray-600 capitalize min-w-[100px]">{key.replace(/_/g, ' ')}:</span>
                          <span className="text-gray-800 break-all whitespace-pre-wrap flex-1">{renderValue(value)}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </details>
            </div>
          </div>
        )

      case 'INICIO_SESION':
        return (
          <div className="text-sm">
            <span className="font-medium text-gray-700">Usuario autenticado correctamente</span>
          </div>
        )

      default:
        return datos ? (
          <div className="text-sm text-gray-600">
            <details className="cursor-pointer group">
              <summary className="font-medium text-gray-700 hover:text-gray-900 list-none flex items-center gap-1">
                <span className="group-open:hidden">▶ Ver detalles</span>
                <span className="hidden group-open:inline">▼ Ocultar detalles</span>
              </summary>
              <div className="mt-2 bg-gray-50 p-3 rounded-lg border border-gray-200 text-xs">
                <div className="grid grid-cols-1 gap-2">
                  {Object.entries(datos)
                    .filter(([key]) => key !== 'tipo')
                    .map(([key, value]) => (
                      <div key={key} className="flex flex-col sm:flex-row sm:gap-2 border-b border-gray-100 last:border-0 pb-1 last:pb-0 items-start">
                        <span className="font-semibold text-gray-600 capitalize min-w-[100px]">{key.replace(/_/g, ' ')}:</span>
                        <span className="text-gray-800 break-all whitespace-pre-wrap flex-1">{renderValue(value)}</span>
                      </div>
                    ))}
                </div>
              </div>
            </details>
          </div>
        ) : null
    }
  }

  const renderAccion = (accion) => {
    if (!accion) return <span className="text-gray-400 italic">Sin acción registrada</span>

    let parsed = accion
    if (typeof accion === 'string') {
      try {
        parsed = JSON.parse(accion)
      } catch (e) {
        return <span className="text-sm text-gray-700">{accion}</span>
      }
    }

    const config = getAccionConfig(parsed)
    const colorClasses = getColorClasses(config.color)

    return (
      <div className="space-y-3">
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border font-medium text-sm ${colorClasses}`}>
          {config.label}
        </div>
        <div className="text-sm text-gray-600">
          {renderDetallesPrincipales(parsed)}
        </div>
      </div>
    )
  }

  const formatearFechaHora = (fechaHora) => {
    if (!fechaHora) return '-'
    try {
      const fecha = new Date(fechaHora)
      const fechaStr = fecha.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
      const horaStr = fecha.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
      return `${fechaStr} ${horaStr}`
    } catch (e) {
      return fechaHora
    }
  }

  const cargar = async () => {
    const params = {}
    // Formatear fechas para asegurar el formato correcto
    if (desde) params.desde = new Date(desde).toISOString().split('T')[0]
    if (hasta) params.hasta = new Date(hasta).toISOString().split('T')[0]
    if (nombreUsuario) params.nombre = nombreUsuario

    try {
      setLoading(true)
      const { data } = await api.get('/historial', {
        params,
        paramsSerializer: params => {
          return Object.entries(params)
            .filter(([_, value]) => value !== '' && value !== null && value !== undefined)
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
            .join('&')
        }
      })
      setRows(data || [])
    } catch (err) {
      console.error('Error cargando historial', err)
      // Mostrar mensaje de error al usuario
      alert('Error al cargar el historial. Por favor, intente nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    cargar()
  }

  const limpiarFiltros = () => {
    setDesde('')
    setHasta('')
    setNombreUsuario('')
    cargar() // Cargar sin filtros al limpiar
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Historial de Actividades</h1>
          <p className="text-gray-600 mt-2">Registro completo de todas las acciones realizadas en el sistema</p>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filtrar por:</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="desde" className="block text-sm font-medium text-gray-700 mb-1">
                Desde
              </label>
              <input
                type="date"
                id="desde"
                value={desde}
                onChange={(e) => setDesde(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label htmlFor="hasta" className="block text-sm font-medium text-gray-700 mb-1">
                Hasta
              </label>
              <input
                type="date"
                id="hasta"
                value={hasta}
                onChange={(e) => setHasta(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de Usuario
              </label>
              <input
                type="text"
                id="nombre"
                value={nombreUsuario}
                onChange={(e) => setNombreUsuario(e.target.value)}
                placeholder="Buscar por nombre..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <div className="flex items-end space-x-2">
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? 'Buscando...' : 'Buscar'}
              </button>
              <button
                type="button"
                onClick={limpiarFiltros}
                className="px-4 py-2.5 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Limpiar
              </button>
            </div>
          </form>
        </div>

        {/* Tabla de historial */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {rows.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-600 text-lg font-medium">No hay registros para mostrar</p>
              <p className="text-gray-500 text-sm mt-1">Intenta cambiar los filtros</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Fecha y Hora</span>
                    </th>
                    <th className="px-6 py-3 text-left">
                      <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Usuario</span>
                    </th>
                    <th className="px-6 py-3 text-left">
                      <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Acción Realizada</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {rows.map((r, idx) => (
                    <tr
                      key={r.id_historial}
                      className={`transition-colors duration-100 hover:bg-gray-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}
                    >
                      {/* Fecha y Hora */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{formatearFechaHora(r.fecha_hora)}</div>
                      </td>

                      {/* Usuario */}
                      <td className="px-6 py-4">
                        {r.usuario && (r.usuario.nombre || r.usuario.apellido) ? (
                          <div>
                            <div className="font-semibold text-gray-900">{r.usuario.apellido}, {r.usuario.nombre}</div>
                            <div className="text-sm text-gray-500 mt-0.5">{r.usuario.email}</div>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm border border-gray-200">
                            <span className="font-mono text-xs">{r.id_usuario?.substring(0, 8)}...</span>
                          </div>
                        )}
                      </td>

                      {/* Acción */}
                      <td className="px-6 py-4">
                        {renderAccion(r.accion)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer con contador */}
          {rows.length > 0 && (
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-3">
              <p className="text-sm text-gray-600">
                Mostrando <span className="font-semibold text-gray-900">{rows.length}</span> registro{rows.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
