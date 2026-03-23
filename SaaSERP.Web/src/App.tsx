import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import NegocioLayout from './components/NegocioLayout';
import Dashboard from './pages/Dashboard';
import Negocios from './pages/Negocios';
import Catalogos from './pages/Catalogos';
import Recursos from './pages/Recursos';
import Operacion from './pages/Operacion';
import NegocioDashboard from './pages/NegocioDashboard';
import PuntoDeVenta from './pages/PuntoDeVenta';
import Citas from './pages/Citas';
import Historial from './pages/Historial';
import Login from './pages/Login';
import Usuarios from './pages/Usuarios';
import Configuracion from './pages/Configuracion';
import Ajustes from './pages/Ajustes';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Ruta Pública: Login */}
          <Route path="/login" element={<Login />} />

          {/* Raíz → redirigir al Login por defecto */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* ZONA SÚPER ADMIN GLOBAL — Solo con Rol Admin/SuperAdmin */}
          <Route
            path="/"
            element={
              <ProtectedRoute requiredRole="SuperAdmin">
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="negocios" element={<Negocios />} />
            <Route path="usuarios" element={<Usuarios />} />
            <Route path="configuracion" element={<Configuracion />} />
          </Route>

          {/* ZONA TENANT — Aislada por NegocioId del Token */}
          <Route
            path="/negocio/:negocioId"
            element={
              <ProtectedRoute requiredRole="Tenant">
                <NegocioLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={
              <ProtectedRoute requiredRole="Tenant" allowedTenantRoles={['SuperAdmin', 'AdminNegocio']}>
                <NegocioDashboard />
              </ProtectedRoute>
            } />
            <Route path="pos" element={
              <ProtectedRoute requiredRole="Tenant" allowedTenantRoles={['SuperAdmin', 'AdminNegocio', 'Cajero', 'Mesero']}>
                <PuntoDeVenta />
              </ProtectedRoute>
            } />
            <Route path="catalogos" element={
              <ProtectedRoute requiredRole="Tenant" allowedTenantRoles={['SuperAdmin', 'AdminNegocio']}>
                <Catalogos />
              </ProtectedRoute>
            } />
            <Route path="recursos" element={
              <ProtectedRoute requiredRole="Tenant" allowedTenantRoles={['SuperAdmin', 'AdminNegocio']}>
                <Recursos />
              </ProtectedRoute>
            } />
            <Route path="citas" element={
              <ProtectedRoute requiredRole="Tenant" allowedTenantRoles={['SuperAdmin', 'AdminNegocio', 'Cajero']}>
                <Citas />
              </ProtectedRoute>
            } />
            <Route path="historial" element={
              <ProtectedRoute requiredRole="Tenant" allowedTenantRoles={['SuperAdmin', 'AdminNegocio', 'Cajero']}>
                <Historial />
              </ProtectedRoute>
            } />
            <Route path="operacion" element={
              <ProtectedRoute requiredRole="Tenant" allowedTenantRoles={['SuperAdmin', 'AdminNegocio', 'Cajero', 'Cocinero']}>
                <Operacion />
              </ProtectedRoute>
            } />
            <Route path="configuracion" element={
              <ProtectedRoute requiredRole="Tenant" allowedTenantRoles={['SuperAdmin', 'AdminNegocio']}>
                <Ajustes />
              </ProtectedRoute>
            } />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
