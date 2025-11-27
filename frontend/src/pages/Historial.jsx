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
  const [idUsuario, setIdUsuario] = useState('')
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

  // Renderizar detalles principales según tipo de acción
  const renderDetallesPrincipales = (accion) => {
    if (!accion) return null
    const tipo = accion.tipo || ''

    switch (tipo) {
      case 'CREAR_ASISTENCIA':
      case 'ACTUALIZAR_ASISTENCIA':
        return (
          <div className="space-y-2">
            {accion.detalles?.alumno_id && (
              <div className="text-sm">
                <span className="font-medium text-gray-700">Alumno ID:</span> {accion.detalles.alumno_id}
              </div>
            )}
            {accion.detalles?.materia_id && (
              <div className="text-sm">
                <span className="font-medium text-gray-700">Materia ID:</span> {accion.detalles.materia_id}
              </div>
            )}
            {accion.detalles?.fecha && (
              <div className="text-sm">
                <span className="font-medium text-gray-700">Fecha:</span> {accion.detalles.fecha}
              </div>
            )}
            {accion.detalles?.estado_nuevo && (
              <div className="text-sm">
                <span className="font-medium text-gray-700">Estado:</span>
                <div className="mt-1 inline-flex gap-2">
                  {accion.detalles.estado_nuevo.presente && <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">Presente</span>}
                  {accion.detalles.estado_nuevo.tarde && <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">Tarde</span>}
                  {accion.detalles.estado_nuevo.justificada && <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">Justificada</span>}
                </div>
              </div>
            )}
          </div>
        )

      case 'CREAR_USUARIO':
      case 'ACTUALIZAR_USUARIO':
        return (
          <div className="space-y-2">
            {accion.detalles?.email && (
              <div className="text-sm">
                <span className="font-medium text-gray-700">Email:</span> {accion.detalles.email}
              </div>
            )}
            {accion.detalles?.nombre && (
              <div className="text-sm">
                <span className="font-medium text-gray-700">Nombre:</span> {accion.detalles.nombre}
              </div>
            )}
            {accion.detalles?.apellido && (
              <div className="text-sm">
                <span className="font-medium text-gray-700">Apellido:</span> {accion.detalles.apellido}
              </div>
            )}
            {accion.detalles?.rol && (
              <div className="text-sm">
                <span className="font-medium text-gray-700">Rol:</span> <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">{accion.detalles.rol}</span>
              </div>
            )}
          </div>
        )

      case 'INICIO_SESION':
        return (
          <div className="text-sm">
            <span className="font-medium text-gray-700">Usuario autenticado correctamente</span>
          </div>
        )

      default:
        return accion.detalles ? (
          <div className="text-sm text-gray-600">
            <details className="cursor-pointer">
              <summary className="font-medium text-gray-700 hover:text-gray-900">Ver detalles</summary>
              <div className="mt-2 bg-gray-50 p-2 rounded text-xs overflow-x-auto">
                <pre>{JSON.stringify(accion.detalles, null, 2)}</pre>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Desde</label>
              <input 
                type="date" 
                value={desde} 
                onChange={e => setDesde(e.target.value)} 
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Hasta</label>
              <input 
                type="date" 
                value={hasta} 
                onChange={e => setHasta(e.target.value)} 
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Usuario</label>
              <input 
                type="text"
                value={idUsuario} 
                onChange={e => setIdUsuario(e.target.value)} 
                placeholder="ID o nombre..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
              />
            </div>
            <div className="flex items-end">
              <button 
                onClick={cargar} 
                disabled={loading}
                className="w-full px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    Buscando...
                  </>
                ) : (
                  <>
                    Buscar
                  </>
                )}
              </button>
            </div>
          </div>
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
