import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useParams, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Scissors, Calendar, ListOrdered, ArrowLeft, Settings, Car, Coffee, Briefcase, Users, Archive, LogOut, Menu, X } from 'lucide-react';
import axiosInstance from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';

const NegocioLayout: React.FC = () => {
    const location = useLocation();
    const { negocioId } = useParams();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [negocio, setNegocio] = useState<any>(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const cargarNegocio = async () => {
            const isAdmin = user?.rol === 'SuperAdmin' || user?.rol === 'AdminNegocio';
            if (isAdmin) {
                // Los admins pueden listar todos los negocios y filtrar por la URL
                const res = await axiosInstance.get('/negocios');
                const current = res.data.find((n: any) => n.id.toString() === negocioId);
                if (current) setNegocio(current);
            } else {
                // Meseros, Cajeros, Cocineros: solo acceden a su propio negocio
                const res = await axiosInstance.get('/negocios/mio');
                setNegocio(res.data);
            }
        };
        cargarNegocio();
    }, [negocioId, user?.rol]);

    const basePath = `/negocio/${negocioId}`;
    
    const menuItems: { path: string; name: string; icon: React.ReactNode }[] = [];
    const rol = user?.rol;

    // Solo los Administradores ven el Dashboard por defecto
    if (rol === 'SuperAdmin' || rol === 'AdminNegocio') {
        menuItems.push({ path: `${basePath}/dashboard`, name: 'Resumen Local', icon: <LayoutDashboard size={20} /> });
    }

    // Distribución lógica de módulos según el Sistema Asignado
    if (negocio?.sistemaAsignado === 'TAQUERIA' || negocio?.sistemaAsignado === 'RESTAURANTES') {
        if (rol === 'SuperAdmin' || rol === 'AdminNegocio') {
            menuItems.push({ path: `${basePath}/catalogos`, name: 'Menú (Platillos)', icon: <Coffee size={20} /> });
            if (negocio.usaMesas) {
                menuItems.push({ path: `${basePath}/recursos`, name: 'Control de Mesas', icon: <Users size={20} /> });
            }
        }
        
        // Cualesquiera excepto Cocinero ven POS
        if (rol !== 'Cocinero') {
            menuItems.push({ path: `${basePath}/pos`, name: 'Punto de Venta', icon: <ListOrdered size={20} /> });
        }
        
        // Cualesquiera excepto Mesero ven KDS
        if (rol !== 'Mesero') {
            menuItems.push({ path: `${basePath}/operacion`, name: 'Cocina (KDS)', icon: <div className="relative"><ListOrdered size={20} /><div className="absolute -bottom-1 -right-1 w-2 h-2 bg-orange-500 rounded-full animate-ping"></div></div> });
        }
    } else if (negocio?.sistemaAsignado === 'CITAS') {
        if (rol === 'SuperAdmin' || rol === 'AdminNegocio') {
            menuItems.push({ path: `${basePath}/catalogos`, name: 'Servicios', icon: <Scissors size={20} /> });
            menuItems.push({ path: `${basePath}/recursos`, name: 'Especialistas', icon: <Users size={20} /> });
        }
        menuItems.push({ path: `${basePath}/citas`, name: 'Agenda / Citas', icon: <Calendar size={20} /> });
    } else if (negocio?.sistemaAsignado === 'PARQUEADERO') {
        menuItems.push({ path: `${basePath}/operacion`, name: 'Caseta Vehículos', icon: <Car size={20} /> });
    } else {
        // Fallback genérico si no tiene sistema definido o es un giro mixto
        if (rol === 'SuperAdmin' || rol === 'AdminNegocio') {
            menuItems.push({ path: `${basePath}/catalogos`, name: 'Servicios', icon: <Briefcase size={20} /> });
            menuItems.push({ path: `${basePath}/recursos`, name: 'Recursos Físicos', icon: <Users size={20} /> });
        }
        menuItems.push({ path: `${basePath}/citas`, name: 'Agenda / Citas', icon: <Calendar size={20} /> });
        menuItems.push({ path: `${basePath}/operacion`, name: 'Punto de Venta', icon: <ListOrdered size={20} /> });
    }

    // Configuración y reportes
    if (rol === 'SuperAdmin' || rol === 'AdminNegocio') {
        menuItems.push({ path: `${basePath}/historial`, name: 'Historial', icon: <Archive size={20} /> });
        menuItems.push({ path: `${basePath}/configuracion`, name: 'Ajustes', icon: <Settings size={20} /> });
    } else if (rol === 'Cajero') {
        // El cajero puede ver el historial para cortes de caja
        menuItems.push({ path: `${basePath}/historial`, name: 'Historial de Caja', icon: <Archive size={20} /> });
    }



    return (
        <div className="flex h-screen bg-slate-50 relative overflow-hidden text-slate-900 font-sans">
            {/* Background Decorations Específicos del Negocio (Tono Naranja/Rosa) */}
            <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-orange-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-rose-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

            {/* Mobile Top Navbar */}
            <div className="md:hidden absolute top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 flex items-center justify-between px-4 z-50">
                <h1 className="text-xl font-black tracking-tight leading-tight text-slate-800 truncate">{negocio?.nombre || 'SaaSERP'}</h1>
                <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-slate-600 bg-slate-100 rounded-xl">
                    {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Overlay for mobile */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 md:hidden" onClick={() => setMobileMenuOpen(false)}></div>
            )}

            {/* Glassmorphism Sidebar del Negocio */}
            <aside className={`fixed md:relative w-64 h-[calc(100vh-2rem)] flex flex-col backdrop-blur-xl bg-white/90 border-r border-white/20 shadow-2xl md:shadow-xl z-40 m-4 rounded-3xl overflow-hidden transition-transform duration-300 left-0 top-0 md:top-auto ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-[120%] md:translate-x-0'}`}>
                <div className="p-6 border-b border-slate-200/50 bg-white/80 md:bg-white/50 text-slate-800">
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
                                onClick={() => setMobileMenuOpen(false)}
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
            <main className="flex-1 w-full md:w-auto h-screen overflow-y-auto relative z-10 pt-16 md:pt-0">
                <div className="max-w-7xl mx-auto h-full p-4 md:p-8 animate-fade-in-up">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default NegocioLayout;
