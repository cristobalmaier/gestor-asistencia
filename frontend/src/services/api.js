import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
})

api.interceptors.request.use((config) => {

  if (config.url === '/auth/signup') {
    return config
  }
  
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  } else {
    console.warn('No hay token disponible para la petición:', config.url)
  }
  return config
}, (error) => {
  return Promise.reject(error)
})

// Interceptor de respuesta para manejar errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // El servidor respondió con un código de estado fuera del rango 2xx
      if (error.response.status === 401) {
        // Token inválido o expirado - limpiar y redirigir al login
        console.warn('Token inválido o expirado. Limpiando sesión...')
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        // Solo redirigir si no estamos ya en la página de login
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
      }
      console.error('Error de respuesta:', {
        status: error.response.status,
        data: error.response.data,
        url: error.config?.url
      })
    } else if (error.request) {
      // La petición se hizo pero no se recibió respuesta
      console.error('Error de red:', error.request)
    } else {
      // Algo pasó al configurar la petición
      console.error('Error:', error.message)
    }
    return Promise.reject(error)
  }
)

// Dashboard statistics
export const getDashboardStats = async () => {
  try {
    const response = await api.get('/reportes/dashboard')
    return response.data
  } catch (error) {
    console.error('Error en getDashboardStats:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    })
    throw error
  }
}

export default api
