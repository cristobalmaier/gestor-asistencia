import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ClipboardCheck, FileText, Calendar, History, ArrowRight } from 'lucide-react'

const iconMap = {
  'Pasar lista': ClipboardCheck,
  'Informes': FileText,
  'Calendario': Calendar,
  'Historial': History,
}

const colorMap = {
  'Pasar lista': 'bg-primary-600',
  'Informes': 'bg-primary-700',
  'Calendario': 'bg-primary-500',
  'Historial': 'bg-gray-700',
}

export default function Dashboard() {
  const { user } = useAuth()
  const cards = []
  if (['preceptor','profesor'].includes(user.rol)) cards.push({ to: '/pasar-lista', title: 'Pasar lista', desc: 'Registrar asistencias de estudiantes' })
  if (['preceptor','profesor','directivo','alumno','padre'].includes(user.rol)) cards.push({ to: '/informes', title: 'Informes', desc: 'Ver y descargar reportes' })
  if (['preceptor','profesor','directivo','alumno'].includes(user.rol)) cards.push({ to: '/calendario', title: 'Calendario', desc: 'Eventos y actividades del curso' })
  if (['preceptor','directivo'].includes(user.rol)) cards.push({ to: '/historial', title: 'Historial', desc: 'Cambios y auditoría del sistema' })
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Hola, {user.nombre}</h1>
        <p className="text-gray-600">¿Qué te gustaría hacer hoy?</p>
      </div>
      
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
