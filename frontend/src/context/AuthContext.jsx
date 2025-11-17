import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  // Iniciar sesión con email y contraseña
  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

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

  useEffect(() => {
    // Verificar la sesión actual al cargar
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Escuchar cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Obtener el rol del usuario desde la tabla de perfiles
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();
          
          if (!error && profile) {
            setUserRole(profile.role);
          }
        } else {
          setUserRole(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

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
