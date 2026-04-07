import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
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
import Papelera from './pages/Papelera';
import Trabajadores from './pages/Trabajadores';
import CRM from './pages/CRM';
import Lealtad from './pages/Lealtad';
import WhatsAppWeb from './pages/WhatsAppWeb';
import { App as CapApp } from '@capacitor/app';

function App() {
  // ── Bug Fix 1: Android back button should navigate back, not exit the app ──
  useEffect(() => {
    let listenerHandle: { remove: () => void } | null = null;

    const registerBackButton = async () => {
      listenerHandle = await CapApp.addListener('backButton', () => {
        if (window.history.length > 1) {
          window.history.back();
        } else {
          // Only exit if there is no history to go back to
          CapApp.exitApp();
        }
      });
    };

    registerBackButton();

    // ── Bug Fix 2: Request camera permission at startup (triggers Android dialog) ──
    const requestCameraPermission = async () => {
      try {
        if (navigator.mediaDevices?.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          // Immediately release — we only needed to trigger the permission dialog
          stream.getTracks().forEach(t => t.stop());
        }
      } catch {
        // Permission denied or no camera — non-fatal, just continue
      }
    };

    requestCameraPermission();

    return () => {
      listenerHandle?.remove();
    };
  }, []);

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
            <Route path="papelera" element={<Papelera />} />
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
            <Route path="trabajadores" element={
              <ProtectedRoute requiredRole="Tenant" allowedTenantRoles={['SuperAdmin', 'AdminNegocio']}>
                <Trabajadores />
              </ProtectedRoute>
            } />
            <Route path="crm" element={
              <ProtectedRoute requiredRole="Tenant" allowedTenantRoles={['SuperAdmin', 'AdminNegocio']}>
                <CRM />
              </ProtectedRoute>
            } />
            <Route path="lealtad" element={
              <ProtectedRoute requiredRole="Tenant" allowedTenantRoles={['SuperAdmin', 'AdminNegocio']}>
                <Lealtad />
              </ProtectedRoute>
            } />
            <Route path="whatsapp" element={
              <ProtectedRoute requiredRole="Tenant" allowedTenantRoles={['SuperAdmin', 'AdminNegocio', 'Cajero', 'Mesero', 'Cocinero']}>
                <WhatsAppWeb />
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
