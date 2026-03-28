import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Settings, Store, LogOut, Users, Menu, X, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Layout: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const menuItems = [
        { path: '/negocios', name: 'Tus Negocios', shortName: 'Negocios', icon: <Store size={22} /> },
        { path: '/usuarios', name: 'Usuarios', shortName: 'Usuarios', icon: <Users size={22} /> },
        { path: '/configuracion', name: 'Configuración', shortName: 'Config', icon: <Settings size={22} /> },
        { path: '/papelera', name: 'Papelera', shortName: 'Papelera', icon: <Trash2 size={22} /> },
    ];

    return (
        <div className="flex h-screen bg-slate-50 relative overflow-hidden text-slate-900 font-sans">
            {/* Background Decorations */}
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob pointer-events-none"></div>
            <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000 pointer-events-none"></div>

            {/* ===== MOBILE TOP HEADER ===== */}
            <div className="md:hidden fixed top-0 w-full h-14 bg-white/90 backdrop-blur-xl border-b border-slate-200/60 z-50 flex items-center justify-between px-4 shadow-sm">
                <h1 className="text-lg font-black tracking-tighter text-blue-600">SaaSERP <span className="font-light">Victoria</span></h1>
                <button onClick={() => setSidebarOpen(true)} className="p-2 bg-slate-100 rounded-xl text-slate-600 active:scale-95 transition-transform">
                    <Menu size={20} />
                </button>
            </div>

            {/* ===== MOBILE FULL-SCREEN DRAWER ===== */}
            {sidebarOpen && (
                <div className="md:hidden fixed inset-0 z-[60] flex">
                    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
                    <aside className="relative ml-auto w-72 h-full bg-white shadow-2xl flex flex-col">
                        <div className="h-16 flex items-center justify-between px-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                            <h1 className="text-xl font-black tracking-tighter">SaaSERP <span className="font-light">Victoria</span></h1>
                            <button onClick={() => setSidebarOpen(false)} className="p-1.5 bg-white/20 rounded-lg">
                                <X size={20} />
                            </button>
                        </div>
                        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                            {menuItems.map((item) => {
                                const isActive = location.pathname === item.path;
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        onClick={() => setSidebarOpen(false)}
                                        className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all ${
                                            isActive
                                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 font-semibold'
                                                : 'text-slate-600 hover:bg-blue-50 hover:text-blue-600'
                                        }`}
                                    >
                                        {item.icon}
                                        <span className="font-semibold text-sm">{item.name}</span>
                                    </Link>
                                );
                            })}
                        </nav>
                        <div className="p-4 border-t border-slate-100 space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-lg flex-shrink-0">
                                    {user?.email?.charAt(0).toUpperCase() ?? 'A'}
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-xs font-bold text-slate-700 truncate">{user?.email ?? 'Admin'}</p>
                                    <p className="text-xs text-blue-500 font-bold">{user?.rol ?? 'SuperAdmin'}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => { logout(); navigate('/login'); }}
                                className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-sm text-red-500 bg-red-50 font-bold"
                            >
                                <LogOut size={16} /> Cerrar Sesión
                            </button>
                        </div>
                    </aside>
                </div>
            )}

            {/* ===== DESKTOP SIDEBAR ===== */}
            <aside className="hidden md:flex relative h-[calc(100vh-2rem)] w-64 flex-col backdrop-blur-xl bg-white/90 md:bg-white/70 border-r border-white/20 shadow-xl z-50 m-4 rounded-3xl overflow-hidden flex-shrink-0">
                <div className="h-24 flex items-center justify-center border-b border-slate-200/50 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-inner">
                    <h1 className="text-2xl font-black tracking-tighter">SaaSERP <span className="font-light">Victoria</span></h1>
                </div>
                <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all duration-300 ease-in-out ${
                                    isActive
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 font-semibold scale-105'
                                        : 'text-slate-500 hover:bg-white hover:text-blue-600 hover:shadow-md'
                                }`}
                            >
                                {item.icon}
                                <span>{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>
                <div className="p-4 border-t border-slate-200/50 bg-white/50 md:bg-white/30">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-lg flex-shrink-0">
                            {user?.email?.charAt(0).toUpperCase() ?? 'A'}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-xs font-bold text-slate-700 truncate">{user?.email ?? 'Admin'}</p>
                            <p className="text-xs text-blue-500 font-bold">{user?.rol ?? 'SuperAdmin'}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => { logout(); navigate('/login'); }}
                        className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-500 px-3 py-2.5 rounded-xl text-sm transition-all font-bold group"
                    >
                        <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" /> Cerrar Sesión
                    </button>
                </div>
            </aside>

            {/* ===== MAIN CONTENT ===== */}
            <main className="flex-1 p-3 md:p-8 h-screen overflow-y-auto relative z-10 pt-16 md:pt-8 pb-20 md:pb-0 w-full">
                <div className="max-w-7xl mx-auto h-full animate-fade-in-up">
                    <Outlet />
                </div>
            </main>

            {/* ===== MOBILE BOTTOM TAB BAR ===== */}
            <nav
                className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-slate-200/60 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]"
                style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
            >
                <div className="flex items-stretch">
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-1 transition-all duration-200 active:scale-95 ${
                                    isActive ? 'text-blue-600' : 'text-slate-400'
                                }`}
                            >
                                <div className={`transition-all duration-200 ${isActive ? 'scale-110' : ''}`}>
                                    {item.icon}
                                </div>
                                <span className={`text-[10px] font-bold ${isActive ? 'text-blue-600' : 'text-slate-400'}`}>
                                    {item.shortName}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
};

export default Layout;
