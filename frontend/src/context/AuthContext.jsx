import { createContext, useContext, useEffect, useState } from 'react'
import api from '../services/api'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  const clearAuth = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  useEffect(() => {
    const checkAuth = () => {
      const t = localStorage.getItem('token')
      const u = localStorage.getItem('user')
      if (t && u) {
        setToken(t)
        try { 
          setUser(JSON.parse(u)) 
        } catch (e) {
          console.error('Error parsing user from localStorage:', e)
          clearAuth()
        }
      } else {
        // Si no hay token/usuario en localStorage, limpiar estado
        setToken(null)
        setUser(null)
      }
      setLoading(false)
    }

    // Verificar al cargar
    checkAuth()

    // Escuchar cambios en localStorage (cuando el interceptor limpia el token)
    const handleStorageChange = (e) => {
      if (e.key === 'token' || e.key === 'user') {
        checkAuth()
      }
    }

    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, []) // Solo ejecutar una vez al montar

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    setToken(data.token)
    setUser(data.user)
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
  }

  const logout = () => {
    clearAuth()
  }

  return (
    <AuthCtx.Provider value={{ user, token, login, logout, loading, clearAuth }}>
      {children}
    </AuthCtx.Provider>
  )
}

export function useAuth() {
  return useContext(AuthCtx)
}
