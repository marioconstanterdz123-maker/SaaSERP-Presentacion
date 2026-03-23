import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Settings, Store, LogOut, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Layout: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const menuItems = [
        { path: '/configuracion', name: 'Configuración', icon: <Settings size={20} /> },
        { path: '/negocios', name: 'Tus Negocios', icon: <Store size={20} /> },
        { path: '/usuarios', name: 'Usuarios', icon: <Users size={20} /> },
    ];

    return (
        <div className="flex h-screen bg-slate-50 relative overflow-hidden text-slate-900 font-sans">
            {/* Background Decorations */}
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
            <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

            {/* Glassmorphism Sidebar */}
            <aside className="w-64 flex flex-col backdrop-blur-xl bg-white/70 border-r border-white/20 shadow-xl z-10 m-4 rounded-3xl overflow-hidden relative">
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
                        )
                    })}
                </nav>

                <div className="p-4 border-t border-slate-200/50 bg-white/30">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-lg">
                            {user?.email?.charAt(0).toUpperCase() ?? 'A'}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-xs font-bold text-slate-700 truncate">{user?.email ?? 'Admin'}</p>
                            <p className="text-xs text-blue-500 font-bold">{user?.rol ?? 'SuperAdmin'}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => { logout(); navigate('/login'); }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-slate-500 hover:text-red-500 hover:bg-red-50 transition-all font-medium"
                    >
                        <LogOut size={16} /> Cerrar Sesión
                    </button>
                </div>
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

export default Layout;
