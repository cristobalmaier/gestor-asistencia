import { createContext, useContext, useEffect, useState } from 'react';
import { supabase, ROLES } from '../lib/supabase';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

<<<<<<< HEAD
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
=======
  // Verificar sesión al cargar
  useEffect(() => {
    // Obtener la sesión actual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });
>>>>>>> 85a3886e9ac1e62fd0c635a261412016d991e7b4

    // Escuchar cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Obtener el rol del usuario
          const { data: roleData } = await supabase
            .from('usuarios_roles')
            .select('rol')
            .eq('user_id', session.user.id)
            .single();
          
          setUserRole(roleData?.rol || null);
        } else {
          setUserRole(null);
        }
        
        setLoading(false);
      },
      // Corregir el error de sintaxis agregando el parámetro options
      { refresh: true, reload: true }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Iniciar sesión con email y contraseña
  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

<<<<<<< HEAD
  const logout = () => {
    clearAuth()
  }

  return (
    <AuthCtx.Provider value={{ user, token, login, logout, loading, clearAuth }}>
      {children}
=======
    if (error) throw error;
    return data;
  };

  // Cerrar sesión
  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setUserRole(null);
  };

  // Registrar nuevo usuario
  const signUp = async (email, password, userData) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nombre: userData.nombre,
          apellido: userData.apellido,
        },
      },
    });

    if (error) throw error;
    return data;
  };

  // Verificar si el usuario tiene un rol específico
  const hasRole = (role) => {
    if (!userRole) return false;
    return userRole === role;
  };

  // Verificar si el usuario tiene alguno de los roles especificados
  const hasAnyRole = (roles) => {
    if (!userRole) return false;
    return roles.includes(userRole);
  };

  const value = {
    user,
    session,
    loading,
    login,
    logout,
    signUp,
    userRole,
    hasRole,
    hasAnyRole,
    isAuthenticated: !!user,
  };

  return (
    <AuthCtx.Provider value={value}>
      {!loading && children}
>>>>>>> 85a3886e9ac1e62fd0c635a261412016d991e7b4
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
