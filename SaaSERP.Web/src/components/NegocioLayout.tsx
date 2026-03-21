import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useParams, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Scissors, Calendar, ListOrdered, ArrowLeft, Settings, Car, Coffee, Briefcase, Users, Archive, LogOut } from 'lucide-react';
import axiosInstance from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';

const NegocioLayout: React.FC = () => {
    const location = useLocation();
    const { negocioId } = useParams();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [negocio, setNegocio] = useState<any>(null);

    useEffect(() => {
        axiosInstance.get('/negocios').then(res => {
            const current = res.data.find((n: any) => n.id.toString() === negocioId);
            if(current) setNegocio(current);
        });
    }, [negocioId]);

    const basePath = `/negocio/${negocioId}`;
    
    const menuItems: { path: string; name: string; icon: React.ReactNode }[] = [];
    const rol = user?.rol;

    // Solo los Meseros NO ven el Dashboard por defecto
    if (rol !== 'Mesero') {
        menuItems.push({ path: `${basePath}/dashboard`, name: 'Resumen Local', icon: <LayoutDashboard size={20} /> });
    }

    // Distribución lógica de módulos según el Sistema Asignado
    if (negocio?.sistemaAsignado === 'TAQUERIA' || negocio?.sistemaAsignado === 'RESTAURANTES') {
        if (rol === 'SuperAdmin' || rol === 'Admin') {
            menuItems.push({ path: `${basePath}/catalogos`, name: 'Menú (Platillos)', icon: <Coffee size={20} /> });
            if (negocio.usaMesas) {
                menuItems.push({ path: `${basePath}/recursos`, name: 'Control de Mesas', icon: <Users size={20} /> });
            }
        }
        
        // Mesero puede ver POS, Admin/SuperAdmin también. Cocina NO.
        if (rol !== 'Cocina') {
            menuItems.push({ path: `${basePath}/pos`, name: 'Punto de Venta', icon: <ListOrdered size={20} /> });
        }
        
        // Cocina puede ver KDS, Admin/SuperAdmin también, Operativos también. Mesero NO.
        if (rol !== 'Mesero') {
            menuItems.push({ path: `${basePath}/operacion`, name: 'Cocina (KDS)', icon: <div className="relative"><ListOrdered size={20} /><div className="absolute -bottom-1 -right-1 w-2 h-2 bg-orange-500 rounded-full animate-ping"></div></div> });
        }
    } else if (negocio?.sistemaAsignado === 'CITAS') {
        menuItems.push({ path: `${basePath}/catalogos`, name: 'Servicios', icon: <Scissors size={20} /> });
        menuItems.push({ path: `${basePath}/recursos`, name: 'Especialistas', icon: <Users size={20} /> });
        menuItems.push({ path: `${basePath}/citas`, name: 'Agenda / Citas', icon: <Calendar size={20} /> });
    } else if (negocio?.sistemaAsignado === 'PARQUEADERO') {
        menuItems.push({ path: `${basePath}/operacion`, name: 'Caseta Vehículos', icon: <Car size={20} /> });
    } else {
        // Fallback genérico si no tiene sistema definido o es un giro mixto
        menuItems.push({ path: `${basePath}/catalogos`, name: 'Servicios', icon: <Briefcase size={20} /> });
        menuItems.push({ path: `${basePath}/recursos`, name: 'Recursos Físicos', icon: <Users size={20} /> });
        menuItems.push({ path: `${basePath}/citas`, name: 'Agenda / Citas', icon: <Calendar size={20} /> });
        menuItems.push({ path: `${basePath}/operacion`, name: 'Punto de Venta', icon: <ListOrdered size={20} /> });
    }

    // Configuración es común para Admin / SuperAdmin
    if (rol === 'SuperAdmin' || rol === 'Admin') {
        menuItems.push({ path: `${basePath}/historial`, name: 'Historial', icon: <Archive size={20} /> });
        menuItems.push({ path: `${basePath}/configuracion`, name: 'Ajustes', icon: <Settings size={20} /> });
    }



    return (
        <div className="flex h-screen bg-slate-50 relative overflow-hidden text-slate-900 font-sans">
            {/* Background Decorations Específicos del Negocio (Tono Naranja/Rosa) */}
            <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-orange-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-rose-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

            {/* Glassmorphism Sidebar del Negocio */}
            <aside className="w-64 flex flex-col backdrop-blur-xl bg-white/70 border-r border-white/20 shadow-xl z-10 m-4 rounded-3xl overflow-hidden relative">
                <div className="p-6 border-b border-slate-200/50 bg-white/50 text-slate-800">
                    <button onClick={() => navigate('/negocios')} className="flex items-center text-xs font-bold text-slate-400 hover:text-orange-500 mb-2 transition-colors">
                        <ArrowLeft size={14} className="mr-1" /> Volver a Global
                    </button>
                    <h1 className="text-xl font-black tracking-tight leading-tight">{negocio?.nombre || 'Cargando...'}</h1>
                    <p className="text-xs text-orange-500 font-bold tracking-widest uppercase mt-1">
                        Workspace {negocio?.sistemaAsignado ? `· ${negocio.sistemaAsignado}` : ''}
                    </p>
                </div>

                <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
                    {menuItems.map((item) => {
                        const isActive = location.pathname.startsWith(item.path);
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all duration-300 ease-in-out ${
                                    isActive 
                                        ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-lg shadow-orange-500/30 font-semibold scale-105' 
                                        : 'text-slate-500 hover:bg-white hover:text-orange-500 hover:shadow-md'
                                }`}
                            >
                                {item.icon}
                                <span>{item.name}</span>
                            </Link>
                        )
                    })}
                </nav>

                {/* User Info + Logout */}
                {user && (
                    <div className="p-4 border-t border-slate-200/50 bg-white/30">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center text-white font-black text-sm">
                                {user.email.charAt(0).toUpperCase()}
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-xs font-bold text-slate-700 truncate">{user.email}</p>
                                <p className="text-xs text-orange-500 font-bold">{user.rol}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => { logout(); navigate('/login'); }}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-slate-500 hover:text-red-500 hover:bg-red-50 transition-all font-medium"
                        >
                            <LogOut size={16} /> Cerrar Sesión
                        </button>
                    </div>
                )}
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 p-8 h-screen overflow-y-auto relative z-10">
                <div className="max-w-7xl mx-auto h-full animate-fade-in-up">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default NegocioLayout;
