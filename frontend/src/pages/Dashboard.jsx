import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import {
  ClipboardCheck,
  FileText,
  Calendar,
  History,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  CalendarDays,
  UserCog,
  Users
} from 'lucide-react'
import api, { getDashboardStats } from '../services/api'

const iconMap = {
  'Pasar lista': ClipboardCheck,
  'Informes': FileText,
  'Calendario': Calendar,
  'Historial': History,
  'Usuarios': UserCog,
}

const colorMap = {
  'Pasar lista': 'bg-primary-600',
  'Informes': 'bg-primary-700',
  'Calendario': 'bg-primary-500',
  'Historial': 'bg-gray-700',
  'Usuarios': 'bg-purple-600',
}

export default function Dashboard() {
  const { user } = useAuth()

  // Estado para las estadísticas
  const [stats, setStats] = useState(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Cargando información del usuario...</p>
        </div>
      </div>
    )
  }

  // Definir las tarjetas basadas en el rol del usuario
  const cards = []
  const userRole = user?.rol || ''

  // Agregar tarjetas según el rol
  if (['admin', 'preceptor', 'profesor'].includes(userRole)) {
    cards.push({
      to: '/pasar-lista',
      title: 'Pasar lista',
      desc: 'Registrar asistencias de estudiantes'
    })
  }

  if (['admin', 'preceptor', 'profesor', 'directivo', 'alumno', 'padre'].includes(userRole)) {
    cards.push({
      to: '/informes',
      title: 'Informes',
      desc: 'Ver y descargar reportes'
    })
  }

  if (['admin', 'preceptor', 'profesor', 'directivo', 'alumno'].includes(userRole)) {
    cards.push({
      to: '/calendario',
      title: 'Calendario',
      desc: 'Eventos y actividades del curso'
    })
  }

  if (['admin', 'preceptor', 'directivo'].includes(userRole)) {
    cards.push({
      to: '/historial',
      title: 'Historial',
      desc: 'Cambios y auditoría del sistema'
    })
  }

  if (['admin'].includes(userRole)) {
    cards.push({
      to: '/admin/usuarios',
      title: 'Usuarios',
      desc: 'Gestionar usuarios del sistema'
    })
  }

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        setError(null)
        if (['admin', 'preceptor', 'directivo'].includes(userRole)) {
          const data = await getDashboardStats()
          setStats(data)
        } else {
          setStats(null)
        }
      } catch (err) {
        setError('Error al cargar las estadísticas')
        setStats(null)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [userRole])

  const formatDate = (dateString) => {
    if (!dateString) return 'No disponible'
    // Parse YYYY-MM-DD directly to avoid timezone issues
    const [year, month, day] = dateString.split('-').map(Number)
    const date = new Date(year, month - 1, day)

    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Hola, {user?.nombre || 'Usuario'}</h1>
        <p className="text-gray-600">¿Qué te gustaría hacer hoy?</p>
      </div>

      {/* Statistics Section - Visible para admin y directivo */}
      {['admin', 'directivo'].includes(user?.rol) && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* General Attendance Percentage */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Asistencia General</p>
                {loading ? (
                  <div className="h-8 w-16 bg-gray-200 animate-pulse rounded mt-2"></div>
                ) : error ? (
                  <p className="text-sm text-red-600 mt-2">Error</p>
                ) : (
                  <p className="text-3xl font-bold text-green-600">
                    {stats?.attendanceStats?.porcentaje_asistencia ?? 0}%
                  </p>
                )}
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
            {!loading && !error && stats?.attendanceStats && (
              <p className="text-xs text-gray-500 mt-2">
                {stats.attendanceStats.presentes || 0} presentes de {stats.attendanceStats.total_asistencias || 0} registros
              </p>
            )}
          </div>
          {/* Total Students with Absences */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Estudiantes con Inasistencias</p>
                {loading ? (
                  <div className="h-8 w-16 bg-gray-200 animate-pulse rounded mt-2"></div>
                ) : error ? (
                  <p className="text-sm text-red-600 mt-2">Error</p>
                ) : (
                  <p className="text-3xl font-bold text-red-600">
                    {stats?.studentsWithMostAbsences?.length || 0}
                  </p>
                )}
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Últimos 30 días</p>
          </div>
          {/* Upcoming Events */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Próximos Eventos</p>
                {loading ? (
                  <div className="h-8 w-16 bg-gray-200 animate-pulse rounded mt-2"></div>
                ) : error ? (
                  <p className="text-sm text-red-600 mt-2">Error</p>
                ) : (
                  <p className="text-3xl font-bold text-blue-600">
                    {stats?.upcomingEvents?.length || 0}
                  </p>
                )}
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <CalendarDays className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Próximos 30 días</p>
          </div>
          {/* Total Records */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Registros</p>
                {loading ? (
                  <div className="h-8 w-16 bg-gray-200 animate-pulse rounded mt-2"></div>
                ) : error ? (
                  <p className="text-sm text-red-600 mt-2">Error</p>
                ) : (
                  <p className="text-3xl font-bold text-gray-900">
                    {stats?.attendanceStats?.total_asistencias || 0}
                  </p>
                )}
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-gray-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Últimos 30 días</p>
          </div>
        </div>
      )}

      {/* Detailed Statistics - Visible para admin y directivo */}
      {['admin', 'directivo'].includes(user?.rol) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Students with Most Absences */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Estudiantes con Mayor Inasistencia</h3>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-200 animate-pulse rounded-full"></div>
                      <div>
                        <div className="h-4 w-24 bg-gray-200 animate-pulse rounded mb-1"></div>
                        <div className="h-3 w-16 bg-gray-200 animate-pulse rounded"></div>
                      </div>
                    </div>
                    <div className="h-4 w-8 bg-gray-200 animate-pulse rounded"></div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <p className="text-sm text-red-600">Error al cargar datos</p>
            ) : stats?.studentsWithMostAbsences?.length === 0 ? (
              <p className="text-sm text-gray-500">No hay estudiantes con inasistencias en los últimos 30 días</p>
            ) : (
              <div className="space-y-3">
                {stats?.studentsWithMostAbsences?.map((student, index) => (
                  <div key={student.id_usuario} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        <span className="text-red-600 font-semibold text-sm">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{student.nombre} {student.apellido}</p>
                        <p className="text-sm text-gray-600">{student.curso_nombre}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-red-600">{student.total_inasistencias}</p>
                      <p className="text-xs text-gray-500">inasistencias</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Upcoming Events */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Próximos Eventos</h3>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-12 h-12 bg-gray-200 animate-pulse rounded-lg"></div>
                    <div className="flex-1">
                      <div className="h-4 w-32 bg-gray-200 animate-pulse rounded mb-2"></div>
                      <div className="h-3 w-24 bg-gray-200 animate-pulse rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <p className="text-sm text-red-600">Error al cargar eventos</p>
            ) : stats?.upcomingEvents?.length === 0 ? (
              <p className="text-sm text-gray-500">No hay eventos programados en los próximos 30 días</p>
            ) : (
              <div className="space-y-3">
                {stats?.upcomingEvents?.slice(0, 5).map((event) => (
                  <div key={event.id_evento} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <CalendarDays className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{event.titulo}</p>
                      {event.descripcion && (
                        <p className="text-sm text-gray-600 truncate">{event.descripcion}</p>
                      )}
                      <p className="text-sm text-gray-600">{formatDate(event.fecha)}</p>
                      <p className="text-xs text-blue-600 font-medium">{event.curso_info}</p>
                    </div>
                  </div>
                ))}
                {stats?.upcomingEvents?.length > 5 && (
                  <Link to="/calendario" className="block text-center text-sm text-blue-600 hover:text-blue-800 font-medium mt-4">
                    Ver todos los eventos →
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map(c => {
          const Icon = iconMap[c.title]
          const iconColor = colorMap[c.title] || 'bg-primary-600'
          return (
            <Link
              key={c.to}
              to={c.to}
              className="group bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg ${iconColor} flex items-center justify-center shadow-sm`}>
                  <Icon className="text-white" size={24} strokeWidth={2} />
                </div>
                <ArrowRight className="text-gray-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" size={20} />
              </div>
              <h3 className="font-semibold text-lg text-gray-900 mb-1">{c.title}</h3>
              <p className="text-sm text-gray-600">{c.desc}</p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
