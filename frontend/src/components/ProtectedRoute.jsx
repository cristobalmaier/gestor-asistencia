import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

<<<<<<< HEAD
export function ProtectedRoute({ children }) {
  const { token, loading } = useAuth()
  const loc = useLocation()
  
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
  
  if (!token) return <Navigate to="/login" state={{ from: loc }} replace />
=======
export function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, hasRole, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return null; // O un componente de carga
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Si se requiere un rol específico y el usuario no lo tiene, redirigir
  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to="/" replace />
  }

>>>>>>> 85a3886e9ac1e62fd0c635a261412016d991e7b4
  return children
}
