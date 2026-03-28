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
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        const cargarNegocio = async () => {
            const isAdmin = user?.rol === 'SuperAdmin' || user?.rol === 'AdminNegocio';
            if (isAdmin) {
                const res = await axiosInstance.get('/negocios');
                const current = res.data.find((n: any) => n.id.toString() === negocioId);
                if (current) setNegocio(current);
            } else {
                const res = await axiosInstance.get('/negocios/mio');
                setNegocio(res.data);
            }
        };
        cargarNegocio();
    }, [negocioId, user?.rol]);

    const basePath = `/negocio/${negocioId}`;
    const menuItems: { path: string; name: string; shortName: string; icon: React.ReactNode }[] = [];
    const rol = user?.rol;

    if (rol === 'SuperAdmin' || rol === 'AdminNegocio') {
        menuItems.push({ path: `${basePath}/dashboard`, name: 'Resumen Local', shortName: 'Inicio', icon: <LayoutDashboard size={22} /> });
    }

    if (negocio?.sistemaAsignado === 'TAQUERIA' || negocio?.sistemaAsignado === 'RESTAURANTES') {
        if (rol === 'SuperAdmin' || rol === 'AdminNegocio') {
            menuItems.push({ path: `${basePath}/catalogos`, name: 'Menú (Platillos)', shortName: 'Menú', icon: <Coffee size={22} /> });
            if (negocio.usaMesas) {
                menuItems.push({ path: `${basePath}/recursos`, name: 'Control de Mesas', shortName: 'Mesas', icon: <Users size={22} /> });
            }
        }
        if (rol !== 'Cocinero') {
            menuItems.push({ path: `${basePath}/pos`, name: 'Punto de Venta', shortName: 'POS', icon: <ListOrdered size={22} /> });
        }
        if (rol !== 'Mesero') {
            menuItems.push({
                path: `${basePath}/operacion`, name: 'Cocina (KDS)', shortName: 'Cocina',
                icon: <div className="relative"><Coffee size={22} /><div className="absolute -bottom-1 -right-1 w-2 h-2 bg-orange-500 rounded-full animate-ping"></div></div>
            });
        }
    } else if (negocio?.sistemaAsignado === 'CITAS') {
        if (rol === 'SuperAdmin' || rol === 'AdminNegocio') {
            menuItems.push({ path: `${basePath}/catalogos`, name: 'Servicios', shortName: 'Servicios', icon: <Scissors size={22} /> });
            menuItems.push({ path: `${basePath}/recursos`, name: 'Especialistas', shortName: 'Equipo', icon: <Users size={22} /> });
        }
        menuItems.push({ path: `${basePath}/citas`, name: 'Agenda / Citas', shortName: 'Agenda', icon: <Calendar size={22} /> });
    } else if (negocio?.sistemaAsignado === 'TATTOO') {
        if (rol === 'SuperAdmin' || rol === 'AdminNegocio') {
            menuItems.push({ path: `${basePath}/catalogos`, name: 'Servicios / Tatuajes', shortName: 'Servicios', icon: <Scissors size={22} /> });
            menuItems.push({ path: `${basePath}/trabajadores`, name: 'Tatuadores', shortName: 'Equipo', icon: <Users size={22} /> });
        }
        menuItems.push({ path: `${basePath}/citas`, name: 'Agenda / Citas', shortName: 'Agenda', icon: <Calendar size={22} /> });
    } else if (negocio?.sistemaAsignado === 'PARQUEADERO') {
        menuItems.push({ path: `${basePath}/operacion`, name: 'Caseta Vehículos', shortName: 'Caseta', icon: <Car size={22} /> });
    } else {
        if (rol === 'SuperAdmin' || rol === 'AdminNegocio') {
            menuItems.push({ path: `${basePath}/catalogos`, name: 'Servicios', shortName: 'Servicios', icon: <Briefcase size={22} /> });
            menuItems.push({ path: `${basePath}/recursos`, name: 'Recursos Físicos', shortName: 'Recursos', icon: <Users size={22} /> });
        }
        menuItems.push({ path: `${basePath}/citas`, name: 'Agenda / Citas', shortName: 'Agenda', icon: <Calendar size={22} /> });
        menuItems.push({ path: `${basePath}/operacion`, name: 'Punto de Venta', shortName: 'POS', icon: <ListOrdered size={22} /> });
    }

    if (rol === 'SuperAdmin' || rol === 'AdminNegocio') {
        menuItems.push({ path: `${basePath}/historial`, name: 'Historial', shortName: 'Historial', icon: <Archive size={22} /> });
        menuItems.push({ path: `${basePath}/crm`, name: 'CRM Clientes', shortName: 'CRM', icon: <ListOrdered size={22} /> });
        menuItems.push({ path: `${basePath}/lealtad`, name: 'Lealtad', shortName: 'Lealtad', icon: <Scissors size={22} /> });
        menuItems.push({ path: `${basePath}/configuracion`, name: 'Ajustes', shortName: 'Ajustes', icon: <Settings size={22} /> });
    } else if (rol === 'Cajero') {
        menuItems.push({ path: `${basePath}/historial`, name: 'Historial de Caja', shortName: 'Historial', icon: <Archive size={22} /> });
    }


    // Bottom tab items: show max 5, rest overflow in sidebar (desktop only)
    const bottomTabItems = menuItems.slice(0, 5);

    return (
        <div className="flex h-screen bg-slate-50 relative overflow-hidden text-slate-900 font-sans">
            {/* Background Decorations */}
            <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-orange-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob pointer-events-none"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-rose-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000 pointer-events-none"></div>

            {/* ===== MOBILE TOP HEADER (portrait only — hidden at sm+) ===== */}
            <div className="sm:hidden fixed top-0 left-0 right-0 h-14 bg-white/90 backdrop-blur-xl border-b border-slate-200/60 flex items-center justify-between px-4 z-50 shadow-sm">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigate('/negocios')}
                        className="p-2 text-slate-500 bg-slate-100 rounded-xl active:scale-95 transition-transform"
                        aria-label="Volver"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <h1 className="text-base font-black tracking-tight text-slate-800 truncate max-w-[180px]">
                        {negocio?.nombre || 'SaaSERP'}
                    </h1>
                </div>
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="p-2 text-slate-600 bg-slate-100 rounded-xl active:scale-95 transition-transform"
                    aria-label="Más opciones"
                >
                    <Menu size={20} />
                </button>
            </div>

            {/* ===== SIDEBAR (visible at sm+: landscape phones, tablets, desktop) ===== */}
            <aside className="hidden sm:flex w-52 lg:w-64 h-[calc(100vh-1.5rem)] lg:h-[calc(100vh-2rem)] flex-col backdrop-blur-xl bg-white/90 border-r border-white/20 shadow-xl z-40 m-3 lg:m-4 rounded-2xl lg:rounded-3xl overflow-hidden flex-shrink-0">
                <div className="p-4 lg:p-6 border-b border-slate-200/50 bg-white/50 text-slate-800">
                    <button onClick={() => navigate('/negocios')} className="flex items-center text-xs font-bold text-slate-400 hover:text-orange-500 mb-2 transition-colors">
                        <ArrowLeft size={14} className="mr-1" /> Volver a Global
                    </button>
                    <h1 className="text-xl font-black tracking-tight leading-tight">{negocio?.nombre || 'Cargando...'}</h1>
                    <p className="text-xs text-orange-500 font-bold tracking-widest uppercase mt-1">
                        Workspace {negocio?.sistemaAsignado ? `· ${negocio.sistemaAsignado}` : ''}
                    </p>
                </div>
                <nav className="flex-1 p-3 lg:p-6 space-y-1 lg:space-y-2 overflow-y-auto">
                    {menuItems.map((item) => {
                        const isActive = location.pathname.startsWith(item.path);
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center space-x-3 px-3 lg:px-4 py-2.5 lg:py-3 rounded-xl lg:rounded-2xl transition-all duration-200 ${
                                    isActive
                                        ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-lg shadow-orange-500/30 font-semibold scale-105'
                                        : 'text-slate-500 hover:bg-white hover:text-orange-500 hover:shadow-md'
                                }`}
                            >
                                {item.icon}
                                <span className="text-sm">{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>
                {user && (
                    <div className="p-4 border-t border-slate-200/50 bg-white/30">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
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

            {/* ===== MOBILE SIDEBAR DRAWER (portrait phones only — hidden at sm+) ===== */}
            {sidebarOpen && (
                <div className="sm:hidden fixed inset-0 z-[60] flex">
                    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
                    <aside className="relative ml-auto w-72 h-full bg-white shadow-2xl flex flex-col overflow-y-auto">
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h2 className="font-black text-slate-800">{negocio?.nombre}</h2>
                                <p className="text-xs text-orange-500 font-bold mt-0.5 uppercase tracking-wider">{negocio?.sistemaAsignado}</p>
                            </div>
                            <button onClick={() => setSidebarOpen(false)} className="p-2 bg-slate-100 rounded-xl text-slate-500">
                                <X size={20} />
                            </button>
                        </div>
                        <nav className="flex-1 p-4 space-y-1">
                            {menuItems.map((item) => {
                                const isActive = location.pathname.startsWith(item.path);
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        onClick={() => setSidebarOpen(false)}
                                        className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 ${
                                            isActive
                                                ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-lg shadow-orange-500/30 font-semibold'
                                                : 'text-slate-600 hover:bg-orange-50 hover:text-orange-600'
                                        }`}
                                    >
                                        {item.icon}
                                        <span className="font-semibold text-sm">{item.name}</span>
                                    </Link>
                                );
                            })}
                        </nav>
                        {user && (
                            <div className="p-4 border-t border-slate-100 space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                                        {user.email.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-xs font-bold text-slate-700 truncate">{user.email}</p>
                                        <p className="text-xs text-orange-500 font-bold">{user.rol}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => { logout(); navigate('/login'); }}
                                    className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-sm text-red-500 bg-red-50 font-bold"
                                >
                                    <LogOut size={16} /> Cerrar Sesión
                                </button>
                            </div>
                        )}
                    </aside>
                </div>
            )}

            {/* ===== MAIN CONTENT ===== */}
            {/* pt-14: mobile header (portrait) | sm:pt-0: sidebar handles nav */}
            <main className="flex-1 w-full h-screen overflow-y-auto overflow-x-hidden relative z-10 pt-14 sm:pt-0 sm:pb-2">
                <div className="max-w-7xl mx-auto h-full p-2 sm:p-4 lg:p-8 animate-fade-in-up">
                    <Outlet />
                </div>
            </main>

            {/* ===== MOBILE BOTTOM TAB BAR (portrait phones only — hidden at sm+) ===== */}
            <nav
                className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-slate-200/60 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]"
                style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
            >
                <div className="flex items-stretch">
                    {bottomTabItems.map((item) => {
                        const isActive = location.pathname.startsWith(item.path);
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-1 transition-all duration-200 active:scale-95 min-w-0 ${
                                    isActive ? 'text-orange-500' : 'text-slate-400'
                                }`}
                            >
                                <div className={`transition-all duration-200 ${isActive ? 'scale-110' : ''}`}>
                                    {item.icon}
                                </div>
                                <span className={`text-[10px] font-bold truncate w-full text-center leading-tight ${isActive ? 'text-orange-500' : 'text-slate-400'}`}>
                                    {item.shortName}
                                </span>
                                {isActive && (
                                    <div className="absolute top-0 w-8 h-0.5 bg-orange-500 rounded-full" />
                                )}
                            </Link>
                        );
                    })}
                    {/* "More" button if there are more than 5 items */}
                    {menuItems.length > 5 && (
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-1 transition-all active:scale-95 min-w-0 ${sidebarOpen ? 'text-orange-500' : 'text-slate-400'}`}
                        >
                            <Menu size={22} />
                            <span className="text-[10px] font-bold">Más</span>
                        </button>
                    )}
                </div>
            </nav>
        </div>
    );
};

export default NegocioLayout;
