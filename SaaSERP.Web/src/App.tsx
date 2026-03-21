import React from 'react';
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
              <ProtectedRoute requiredRole="Tenant" allowedTenantRoles={['SuperAdmin', 'Admin', 'Operativo', 'Cocina']}>
                <NegocioDashboard />
              </ProtectedRoute>
            } />
            <Route path="pos" element={
              <ProtectedRoute requiredRole="Tenant" allowedTenantRoles={['SuperAdmin', 'Admin', 'Operativo', 'Mesero']}>
                <PuntoDeVenta />
              </ProtectedRoute>
            } />
            <Route path="catalogos" element={
              <ProtectedRoute requiredRole="Tenant" allowedTenantRoles={['SuperAdmin', 'Admin', 'Operativo']}>
                <Catalogos />
              </ProtectedRoute>
            } />
            <Route path="recursos" element={
              <ProtectedRoute requiredRole="Tenant" allowedTenantRoles={['SuperAdmin', 'Admin', 'Operativo']}>
                <Recursos />
              </ProtectedRoute>
            } />
            <Route path="citas" element={
              <ProtectedRoute requiredRole="Tenant" allowedTenantRoles={['SuperAdmin', 'Admin', 'Operativo']}>
                <Citas />
              </ProtectedRoute>
            } />
            <Route path="historial" element={
              <ProtectedRoute requiredRole="Tenant" allowedTenantRoles={['SuperAdmin', 'Admin', 'Operativo']}>
                <Historial />
              </ProtectedRoute>
            } />
            <Route path="operacion" element={
              <ProtectedRoute requiredRole="Tenant" allowedTenantRoles={['SuperAdmin', 'Admin', 'Operativo', 'Cocina']}>
                <Operacion />
              </ProtectedRoute>
            } />
            <Route path="configuracion" element={<div className="p-8"><h2 className="text-3xl font-black">Ajustes</h2></div>} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
