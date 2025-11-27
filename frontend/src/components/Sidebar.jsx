import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  ClipboardCheck,
  Calendar,
  FileText,
  History,
  LogOut,
  LayoutDashboard,
  Users,
  Settings
} from 'lucide-react'

const itemsByRole = (userRole) => {
  const base = [{ to: '/', label: 'Inicio', icon: LayoutDashboard }]

  // Admin tiene acceso a todo
  if (userRole === 'admin' || userRole === 'root') {
    return [
      ...base,
      { to: '/pasar-lista', label: 'Pasar lista', icon: ClipboardCheck },
      { to: '/informes', label: 'Informes', icon: FileText },
      { to: '/calendario', label: 'Calendario', icon: Calendar },
      { to: '/historial', label: 'Historial', icon: History },
      {
        type: 'divider',
        label: 'Administración'
      },
      { to: '/admin/usuarios', label: 'Gestión de Usuarios', icon: Users },
    ]
  }

  if (userRole === 'preceptor') {
    return [
      ...base,
      { to: '/pasar-lista', label: 'Pasar lista', icon: ClipboardCheck },
      { to: '/informes', label: 'Informes', icon: FileText },
      { to: '/calendario', label: 'Calendario', icon: Calendar },
      { to: '/historial', label: 'Historial', icon: History },
    ]
  }

  if (userRole === 'profesor') {
    return [
      ...base,
      { to: '/pasar-lista', label: 'Pasar lista', icon: ClipboardCheck },
      { to: '/informes', label: 'Informes', icon: FileText },
      { to: '/calendario', label: 'Calendario', icon: Calendar },
    ]
  }

  if (userRole === 'directivo') {
    return [
      ...base,
      { to: '/informes', label: 'Informes', icon: FileText },
      { to: '/calendario', label: 'Calendario', icon: Calendar },
      { to: '/historial', label: 'Historial', icon: History },
    ]
  }

  if (userRole === 'alumno') {
    return [
      ...base,
      { to: '/informes', label: 'Informes', icon: FileText },
      { to: '/calendario', label: 'Calendario', icon: Calendar },
    ]
  }

  if (userRole === 'padre') {
    return [
      ...base,
      { to: '/informes', label: 'Informes', icon: FileText },
    ]
  }

  return base
}

export default function Sidebar() {
  const { user, logout } = useAuth()
  const items = itemsByRole(user?.rol)
  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col sticky top-0 shadow-sm">
      <div className="p-6 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-600 flex items-center justify-center shadow-md">
            <ClipboardCheck className="text-white" size={20} />
          </div>
          <div>
            <div className="font-bold text-lg text-gray-900">Asistencias</div>
            <div className="text-xs text-gray-500">Sistema de Gestión</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto min-h-0">
        {items.map((item, index) => {
          // Handle dividers
          if (item.type === 'divider') {
            return (
              <div key={`divider-${index}`} className="pt-4 pb-2">
                <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {item.label}
                </p>
              </div>
            );
          }

          // Handle regular navigation items
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 font-medium text-sm
                ${isActive
                  ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }
              `}
            >
              <Icon size={20} strokeWidth={2} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200 space-y-3 bg-white flex-shrink-0">
        <div className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 rounded-lg">
          <div className="w-9 h-9 rounded-lg bg-primary-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm flex-shrink-0">
            {user?.nombre?.[0]}{user?.apellido?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-gray-900 truncate">
              {user?.nombre} {user?.apellido}
            </div>
            <div className="text-xs text-gray-500 capitalize">{user?.rol}</div>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <LogOut size={18} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
