import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
    /** 'SuperAdmin' = sólo acceso al Panel Global. 'Tenant' = sólo acceso al negocio asignado. */
    requiredRole?: 'SuperAdmin' | 'Tenant' | 'Any';
    /** Optional array of allowed roles inside a Tenant view (e.g. ['Admin', 'Mesero']) */
    allowedTenantRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole = 'Any', allowedTenantRoles }) => {
    const { user, isLoading } = useAuth();
    const { negocioId } = useParams();

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-violet-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    // Sin sesión → Login
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Zona SuperAdmin: sólo Admins
    if (requiredRole === 'SuperAdmin') {
        const isAdmin = user.rol === 'SuperAdmin' || user.rol === 'AdminNegocio';
        if (!isAdmin) {
            // Si es operador, mandarlo a su negocio
            if (user.negocioId) {
                if (user.rol === 'Mesero') return <Navigate to={`/negocio/${user.negocioId}/pos`} replace />;
                if (user.rol === 'Cocinero') return <Navigate to={`/negocio/${user.negocioId}/operacion`} replace />;
                if (user.rol === 'Cajero') return <Navigate to={`/negocio/${user.negocioId}/operacion`} replace />;
                return <Navigate to={`/negocio/${user.negocioId}/dashboard`} replace />;
            }
            return <Navigate to="/login" replace />;
        }
    }

    // Zona Tenant: verificar que el negocioId de la URL coincida con el del token
    if (requiredRole === 'Tenant' && negocioId) {
        const isAdmin = user.rol === 'SuperAdmin' || user.rol === 'AdminNegocio';
        // SuperAdmins pueden entrar a cualquier negocio
        if (!isAdmin && user.negocioId !== parseInt(negocioId)) {
            // Redirigir a su propio negocio si lo tiene
            if (user.negocioId) {
                if (user.rol === 'Mesero') return <Navigate to={`/negocio/${user.negocioId}/pos`} replace />;
                if (user.rol === 'Cocinero') return <Navigate to={`/negocio/${user.negocioId}/operacion`} replace />;
                if (user.rol === 'Cajero') return <Navigate to={`/negocio/${user.negocioId}/operacion`} replace />;
                return <Navigate to={`/negocio/${user.negocioId}/dashboard`} replace />;
            }
            return <Navigate to="/login" replace />;
        }

        // Si hay restricción de roles, verificar si el usuario tiene permiso
        if (allowedTenantRoles && !allowedTenantRoles.includes(user.rol)) {
            // REDIRECT FALLBACK (Evitar loops asegurando que el destino SÍ permite este rol)
            if (user.rol === 'Mesero') return <Navigate to={`/negocio/${negocioId}/pos`} replace />;
            if (user.rol === 'Cocinero') return <Navigate to={`/negocio/${negocioId}/operacion`} replace />;
            if (user.rol === 'Cajero') return <Navigate to={`/negocio/${negocioId}/operacion`} replace />; 
            return <Navigate to={`/negocio/${negocioId}/dashboard`} replace />;
        }
    }

    return <>{children}</>;
};

export default ProtectedRoute;
