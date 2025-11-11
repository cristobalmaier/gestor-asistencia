import { createContext, useContext, useEffect, useState } from 'react';
import { supabase, ROLES } from '../lib/supabase';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  // Verificar sesión al cargar
  useEffect(() => {
    // Obtener la sesión actual
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
