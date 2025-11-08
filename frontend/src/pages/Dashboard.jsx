import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ClipboardCheck, FileText, Calendar, History, ArrowRight } from 'lucide-react'

const iconMap = {
  'Pasar lista': ClipboardCheck,
  'Informes': FileText,
  'Calendario': Calendar,
  'Historial': History,
}

export default function Dashboard() {
  const { user } = useAuth()
  const cards = []
  if (['preceptor','profesor'].includes(user.rol)) cards.push({ to: '/pasar-lista', title: 'Pasar lista', desc: 'Registrar asistencias de estudiantes', color: 'from-blue-500 to-cyan-500' })
  if (['preceptor','profesor','directivo','alumno','padre'].includes(user.rol)) cards.push({ to: '/informes', title: 'Informes', desc: 'Ver y descargar reportes', color: 'from-purple-500 to-pink-500' })
  if (['preceptor','profesor','directivo','alumno'].includes(user.rol)) cards.push({ to: '/calendario', title: 'Calendario', desc: 'Eventos y actividades del curso', color: 'from-amber-500 to-orange-500' })
  if (['preceptor','directivo'].includes(user.rol)) cards.push({ to: '/historial', title: 'Historial', desc: 'Cambios y auditoría del sistema', color: 'from-emerald-500 to-teal-500' })
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Hola, {user.nombre} </h1>
        <p className="text-[var(--text-secondary)]">¿Qué te gustaría hacer hoy?</p>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map(c => {
          const Icon = iconMap[c.title]
          return (
            <Link 
              key={c.to} 
              to={c.to} 
              className="group card card-body hover:shadow-lg transition-all duration-200 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center shadow-md`}>
                  <Icon className="text-white" size={24} strokeWidth={2} />
                </div>
                <ArrowRight className="text-[var(--text-secondary)] group-hover:text-[var(--primary)] group-hover:translate-x-1 transition-all" size={20} />
              </div>
              <h3 className="font-semibold text-lg text-[var(--text-primary)] mb-1">{c.title}</h3>
              <p className="text-sm text-[var(--text-secondary)]">{c.desc}</p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
