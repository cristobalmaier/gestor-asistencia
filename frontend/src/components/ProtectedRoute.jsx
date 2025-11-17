import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function ProtectedRoute({ children, requiredRole }) {
  const { user, loading, hasRole } = useAuth()
  const location = useLocation()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }
  
  // Si el usuario no está autenticado, redirigir al login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  
  // Si se requiere un rol específico y el usuario no lo tiene, redirigir al inicio
  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to="/" replace />
  }
  
  return children
}
