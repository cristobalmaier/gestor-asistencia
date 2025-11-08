import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function ProtectedRoute({ children }) {
  const { token, loading } = useAuth()
  const loc = useLocation()
  if (loading) return null
  if (!token) return <Navigate to="/login" state={{ from: loc }} replace />
  return children
}
