import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosConfig';
import { LogIn, Eye, EyeOff, AlertCircle, Zap } from 'lucide-react';

const Login: React.FC = () => {
    const { login, user } = useAuth();
    const navigate = useNavigate();
    const [correo, setCorreo] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Si ya hay sesión activa, redirigir automáticamente
    React.useEffect(() => {
        if (user) {
            redirectByRole(user);
        }
    }, [user]);

    const redirectByRole = (u: typeof user) => {
        if (!u) return;
        if (u.rol === 'SuperAdmin' || u.rol === 'Admin') {
            navigate('/negocios');
        } else if (u.negocioId) {
            navigate(`/negocio/${u.negocioId}/dashboard`);
        } else {
            navigate('/negocios');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const { data } = await axiosInstance.post('/Auth/login', { correo, password });
            // El C# devuelve { Token: "..." } con T mayúscula
            const token = data.Token || data.token;
            if (!token) throw new Error('El servidor no devolvió un token.');
            login(token);
            // La redirección la maneja el useEffect automáticamente
        } catch (err: any) {
            const msg = err.response?.data || 'Correo o contraseña incorrectos.';
            setError(typeof msg === 'string' ? msg : 'Error de autenticación. Intente de nuevo.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative bg-slate-950 flex items-center justify-center p-4 overflow-hidden">
            {/* Background gradient blobs */}
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-violet-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-30 animate-blob"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-indigo-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-30 animate-blob animation-delay-2000"></div>
            <div className="absolute top-[30%] right-[20%] w-[300px] h-[300px] bg-fuchsia-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob animation-delay-4000"></div>

            <div className="relative w-full max-w-md">
                {/* Logo / Brand */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl shadow-2xl shadow-violet-500/40 mb-4">
                        <Zap className="text-white" size={32} />
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tight">SaaSERP Victoria</h1>
                    <p className="text-slate-400 mt-2 font-medium">Sistema de Gestión Multisucursal</p>
                </div>

                {/* Card */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                    <h2 className="text-xl font-bold text-white mb-1">Iniciar Sesión</h2>
                    <p className="text-slate-400 text-sm mb-8">Accede con las credenciales asignadas por tu administrador.</p>

                    {error && (
                        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-300 rounded-2xl px-4 py-3 mb-6 text-sm font-medium">
                            <AlertCircle size={18} className="flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Correo Electrónico</label>
                            <input
                                type="email"
                                required
                                autoFocus
                                value={correo}
                                onChange={e => setCorreo(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                                placeholder="admin@saaserp.com"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Contraseña</label>
                            <div className="relative">
                                <input
                                    type={showPass ? 'text' : 'password'}
                                    required
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(!showPass)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                                >
                                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl shadow-lg shadow-violet-500/30 transition-all active:scale-95 flex items-center justify-center gap-2 mt-2"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <LogIn size={18} />
                                    Entrar al Sistema
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center text-slate-600 text-xs mt-6">
                    © 2026 SaaSERP Victoria · Todos los derechos reservados
                </p>
            </div>
        </div>
    );
};

export default Login;
