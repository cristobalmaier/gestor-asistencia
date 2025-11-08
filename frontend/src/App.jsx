import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import PasarLista from './pages/PasarLista.jsx'
import Informes from './pages/Informes.jsx'
import Calendario from './pages/Calendario.jsx'
import Historial from './pages/Historial.jsx'
import { ProtectedRoute } from './components/ProtectedRoute.jsx'
import Layout from './components/Layout.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
      <Route path="/pasar-lista" element={<ProtectedRoute><Layout><PasarLista /></Layout></ProtectedRoute>} />
      <Route path="/informes" element={<ProtectedRoute><Layout><Informes /></Layout></ProtectedRoute>} />
      <Route path="/calendario" element={<ProtectedRoute><Layout><Calendario /></Layout></ProtectedRoute>} />
      <Route path="/historial" element={<ProtectedRoute><Layout><Historial /></Layout></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
