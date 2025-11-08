import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ClipboardCheck, Calendar, FileText, History, LogOut, LayoutDashboard } from 'lucide-react'

const itemsByRole = (rol) => {
  const base = [{ to: '/', label: 'Inicio', icon: LayoutDashboard }]
  if (rol === 'preceptor') return [...base,
    { to: '/pasar-lista', label: 'Pasar lista', icon: ClipboardCheck },
    { to: '/informes', label: 'Informes', icon: FileText },
    { to: '/calendario', label: 'Calendario', icon: Calendar },
    { to: '/historial', label: 'Historial', icon: History },
  ]
  if (rol === 'profesor') return [...base,
    { to: '/pasar-lista', label: 'Pasar lista', icon: ClipboardCheck },
    { to: '/informes', label: 'Informes', icon: FileText },
    { to: '/calendario', label: 'Calendario', icon: Calendar },
  ]
  if (rol === 'directivo') return [...base,
    { to: '/informes', label: 'Informes', icon: FileText },
    { to: '/calendario', label: 'Calendario', icon: Calendar },
    { to: '/historial', label: 'Historial', icon: History },
  ]
  if (rol === 'alumno') return [...base,
    { to: '/informes', label: 'Informes', icon: FileText },
    { to: '/calendario', label: 'Calendario', icon: Calendar },
  ]
  if (rol === 'padre') return [...base,
    { to: '/informes', label: 'Informes', icon: FileText },
  ]
  return base
}

export default function Sidebar() {
  const { user, logout } = useAuth()
  const items = itemsByRole(user?.rol)
  return (
    <aside className="w-72 bg-white border-r border-[var(--border)] min-h-screen flex flex-col sticky top-0">
      <div className="p-6 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <ClipboardCheck className="text-white" size={20} />
          </div>
          <div>
            <div className="font-bold text-lg text-[var(--text-primary)]">Asistencias</div>
            <div className="text-xs text-[var(--text-secondary)]">Sistema de Gestión</div>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink 
            key={to} 
            to={to} 
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium text-sm
              ${isActive 
                ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-slate-50'
              }
            `}
          >
            <Icon size={20} strokeWidth={2} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      
      <div className="p-4 border-t border-[var(--border)] space-y-3">
        <div className="flex items-center gap-3 px-3 py-2 bg-slate-50 rounded-xl">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
            {user?.nombre?.[0]}{user?.apellido?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-[var(--text-primary)] truncate">
              {user?.nombre} {user?.apellido}
            </div>
            <div className="text-xs text-[var(--text-secondary)] capitalize">{user?.rol}</div>
          </div>
        </div>
        
        <button onClick={logout} className="btn btn-ghost w-full justify-start">
          <LogOut size={18} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
