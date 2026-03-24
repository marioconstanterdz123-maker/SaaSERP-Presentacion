import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Settings, Store, LogOut, Users, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Layout: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const menuItems = [
        { path: '/configuracion', name: 'Configuración', icon: <Settings size={20} /> },
        { path: '/negocios', name: 'Tus Negocios', icon: <Store size={20} /> },
        { path: '/usuarios', name: 'Usuarios', icon: <Users size={20} /> },
    ];

    const closeMenu = () => setIsMobileMenuOpen(false);

    return (
        <div className="flex h-screen bg-slate-50 relative overflow-hidden text-slate-900 font-sans">
            {/* Background Decorations */}
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
            <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 w-full h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 z-40 flex items-center justify-between px-4">
                <h1 className="text-xl font-black tracking-tighter text-blue-600">SaaSERP <span className="font-light">Victoria</span></h1>
                <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 bg-slate-100 rounded-xl text-slate-600">
                    <Menu size={24} />
                </button>
            </div>

            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div 
                    className="md:hidden fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40"
                    onClick={closeMenu}
                />
            )}

            {/* Glassmorphism Sidebar */}
            <aside className={`fixed md:relative top-0 left-0 h-screen md:h-[calc(100vh-2rem)] w-64 flex flex-col backdrop-blur-xl bg-white/90 md:bg-white/70 border-r border-white/20 shadow-2xl md:shadow-xl z-50 md:m-4 md:rounded-3xl overflow-hidden transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
                <div className="h-16 md:h-24 flex items-center justify-between md:justify-center px-4 border-b border-slate-200/50 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-inner">
                    <h1 className="text-xl md:text-2xl font-black tracking-tighter">SaaSERP <span className="font-light">Victoria</span></h1>
                    <button onClick={closeMenu} className="md:hidden p-1 bg-white/20 rounded-lg text-white">
                        <X size={20} />
                    </button>
                </div>

                <nav className="flex-1 p-4 md:p-6 space-y-2 overflow-y-auto">
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={closeMenu}
                                className={`flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all duration-300 ease-in-out ${
                                    isActive 
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 font-semibold scale-105' 
                                        : 'text-slate-500 hover:bg-white hover:text-blue-600 hover:shadow-md'
                                }`}
                            >
                                {item.icon}
                                <span>{item.name}</span>
                            </Link>
                        )
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

            {/* Main Content Area */}
            <main className="flex-1 p-4 md:p-8 h-screen overflow-y-auto relative z-10 pt-20 md:pt-8 w-full">
                <div className="max-w-7xl mx-auto h-full animate-fade-in-up">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
