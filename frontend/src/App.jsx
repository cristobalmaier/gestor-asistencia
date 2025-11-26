import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Dashboard from './pages/Dashboard.jsx'
import PasarLista from './pages/PasarLista.jsx'
import Informes from './pages/Informes.jsx'
import Calendario from './pages/Calendario.jsx'
import Historial from './pages/Historial.jsx'
import GestionUsuarios from './pages/Usuarios.jsx'
import { ProtectedRoute } from './components/ProtectedRoute.jsx'
import Layout from './components/Layout.jsx'
import { AuthProvider } from './context/AuthContext.jsx'

export default function App() {
  return (
    <AuthProvider>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Register />} />

      {/* Rutas protegidas */}
      <Route path="/" element={
        <ProtectedRoute>
          <Layout><Dashboard /></Layout>
        </ProtectedRoute>}
      />

      <Route path="/pasar-lista" element={
        <ProtectedRoute>
          <Layout><PasarLista /></Layout>
        </ProtectedRoute>}
      />

      <Route path="/informes" element={
        <ProtectedRoute>
          <Layout><Informes /></Layout>
        </ProtectedRoute>}
      />

      <Route path="/calendario" element={
        <ProtectedRoute>
          <Layout><Calendario /></Layout>
        </ProtectedRoute>}
      />

      <Route path="/historial" element={
        <ProtectedRoute>
          <Layout><Historial /></Layout>
        </ProtectedRoute>}
      />

      {/* Rutas de administración */}
      <Route
        path="/admin/usuarios"
        element={
          <ProtectedRoute requiredRole="admin">
            <Layout>
              <GestionUsuarios />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </AuthProvider>
  )
}
