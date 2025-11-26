import { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Iniciar sesión con email y contraseña usando el backend personalizado
  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user: userData } = response.data;

      // Guardar token en localStorage
      localStorage.setItem('token', token);

      // Actualizar estado
      setUser(userData);
      setIsAuthenticated(true);

      return response.data;
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  };

  // Cerrar sesión
  const logout = async () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
  };

  const signUp = async (email, password, data) => {
    const { nombre, apellido } = data;
    try {
      const response = await api.post('/auth/signup', { email, password, nombre, apellido });
      return response.data;
    } catch (error) {
      console.error('Error en signUp:', error);
      throw error;
    }
  };

  // Verificar si el usuario tiene un rol específico
  const hasRole = (role) => {
    if (!user) return false;
    return user.rol === role;
  };

  // Verificar si el usuario tiene alguno de los roles especificados
  const hasAnyRole = (roles) => {
    if (!user) return false;
    return roles.includes(user.rol);
  };

  // Verificar si es admin
  const isAdmin = () => {
    return user?.rol === 'admin' || user?.is_admin === true;
  };

  useEffect(() => {
    // Verificar si hay un token guardado al cargar
    const checkAuth = async () => {
      const token = localStorage.getItem('token');

      if (token) {
        try {
          // Verificar el token con el backend
          const response = await api.get('/auth/me');
          setUser(response.data);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Token inválido:', error);
          localStorage.removeItem('token');
          setUser(null);
          setIsAuthenticated(false);
        }
      }

      setLoading(false);
    };

    checkAuth();
  }, []);

  const value = {
    user,
    loading,
    login,
    logout,
    userRole: user?.rol,
    hasRole,
    hasAnyRole,
    isAdmin,
    isAuthenticated,
    signUp,
  };

  return (
    <AuthCtx.Provider value={value}>
      {!loading && children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthCtx);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}
