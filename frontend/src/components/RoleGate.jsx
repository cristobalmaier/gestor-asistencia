import { useAuth } from '../context/AuthContext'

export default function RoleGate({ roles = [], children }) {
  const { user } = useAuth()
  if (!user) return null
  if (user.rol === 'admin' || roles.includes(user.rol)) return children
  return null
}
