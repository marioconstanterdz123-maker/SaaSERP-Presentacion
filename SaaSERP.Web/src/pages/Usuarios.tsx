import React, { useEffect, useState } from 'react';
import axiosInstance from '../api/axiosConfig';
import { Users, Plus, Trash2, X, Eye, EyeOff, Shield, Store, UserCheck } from 'lucide-react';

interface Usuario {
    id: number;
    nombre: string;
    correo: string;
    rol: string;
    negocioId: number | null;
    negocioNombre: string | null;
}

interface Negocio {
    id: number;
    nombre: string;
    sistemaAsignado: string;
}

const ROL_COLORS: Record<string, string> = {
    SuperAdmin: 'bg-violet-100 text-violet-700 border-violet-200',
    Admin: 'bg-blue-100 text-blue-700 border-blue-200',
    Operativo: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    Mesero: 'bg-orange-100 text-orange-700 border-orange-200',
    Cocina: 'bg-red-100 text-red-700 border-red-200',
};

const Usuarios: React.FC = () => {
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [negocios, setNegocios] = useState<Negocio[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [filterBusqueda, setFilterBusqueda] = useState('');

    // Form state
    const [form, setForm] = useState({
        nombre: '',
        correo: '',
        password: '',
        rol: 'Operativo',
        negocioId: '' as string | number,
    });

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [usRes, negRes] = await Promise.all([
                axiosInstance.get('/Auth/usuarios'),
                axiosInstance.get('/negocios'),
            ]);
            setUsuarios(usRes.data);
            setNegocios(negRes.data);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleCrear = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        try {
            await axiosInstance.post('/Auth/registrar', {
                nombre: form.nombre,
                correo: form.correo,
                password: form.password,
                rol: form.rol,
                negocioId: form.negocioId !== '' ? Number(form.negocioId) : null,
            });
            setSuccessMsg(`Usuario "${form.nombre}" creado con éxito.`);
            setShowModal(false);
            setForm({ nombre: '', correo: '', password: '', rol: 'Operativo', negocioId: '' });
            fetchData();
            setTimeout(() => setSuccessMsg(''), 4000);
        } catch (err: any) {
            setErrorMsg(err.response?.data || 'Error al crear el usuario.');
        }
    };

    const handleEliminar = async (id: number, nombre: string) => {
        if (!confirm(`¿Eliminar al usuario "${nombre}"? Esta acción no puede deshacerse.`)) return;
        try {
            await axiosInstance.delete(`/Auth/usuarios/${id}`);
            setUsuarios(prev => prev.filter(u => u.id !== id));
        } catch (e) {
            alert('Error al eliminar el usuario.');
        }
    };

    const filtrados = usuarios.filter(u =>
        u.nombre.toLowerCase().includes(filterBusqueda.toLowerCase()) ||
        u.correo.toLowerCase().includes(filterBusqueda.toLowerCase()) ||
        (u.negocioNombre || '').toLowerCase().includes(filterBusqueda.toLowerCase())
    );

    return (
        <div className="flex flex-col gap-8 animate-fade-in-up">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/60 p-6 rounded-3xl border border-white/40 shadow-sm backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg">
                        <Users size={32} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-slate-800 tracking-tight">Gestión de Usuarios</h2>
                        <p className="text-slate-500 font-medium">Administra los accesos a cada sucursal</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold px-5 py-3 rounded-2xl shadow-lg shadow-indigo-500/30 transition-all active:scale-95"
                >
                    <Plus size={20} /> Nuevo Usuario
                </button>
            </div>

            {/* Success Banner */}
            {successMsg && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl px-5 py-3 font-medium flex items-center gap-2">
                    <UserCheck size={18} /> {successMsg}
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
                {['SuperAdmin', 'Admin', 'Operativo', 'Mesero', 'Cocina'].map(rol => (
                    <div key={rol} className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 border border-white shadow-sm">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{rol}</p>
                        <p className="text-3xl font-black text-slate-800">{usuarios.filter(u => u.rol === rol).length}</p>
                    </div>
                ))}
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 border border-white shadow-sm">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total</p>
                    <p className="text-3xl font-black text-indigo-600">{usuarios.length}</p>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl border border-white p-6">
                <div className="mb-5">
                    <input
                        type="text"
                        placeholder="Buscar por nombre, correo o negocio..."
                        value={filterBusqueda}
                        onChange={e => setFilterBusqueda(e.target.value)}
                        className="w-full md:w-80 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b-2 border-slate-100 text-slate-400 text-xs tracking-widest uppercase">
                                    <th className="pb-3 font-bold">Usuario</th>
                                    <th className="pb-3 font-bold">Negocio Asignado</th>
                                    <th className="pb-3 font-bold text-center">Rol</th>
                                    <th className="pb-3 font-bold text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filtrados.map(u => (
                                    <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                                        <td className="py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-blue-600 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                                                    {u.nombre.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800">{u.nombre}</p>
                                                    <p className="text-xs text-slate-400">{u.correo}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4">
                                            {u.negocioNombre ? (
                                                <span className="flex items-center gap-1.5 text-sm font-medium text-slate-600">
                                                    <Store size={14} className="text-slate-400" /> {u.negocioNombre}
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1.5 text-sm font-medium text-violet-600">
                                                    <Shield size={14} /> Acceso Global
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-4 text-center">
                                            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${ROL_COLORS[u.rol] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                                {u.rol}
                                            </span>
                                        </td>
                                        <td className="py-4 text-center">
                                            <button
                                                onClick={() => handleEliminar(u.id, u.nombre)}
                                                className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                                                title="Eliminar usuario"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filtrados.length === 0 && (
                            <div className="text-center py-12 text-slate-400">
                                <Users size={36} className="mx-auto mb-3 opacity-30" />
                                <p className="font-medium">No se encontraron usuarios</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 relative animate-fade-in-up">
                        <button
                            onClick={() => { setShowModal(false); setErrorMsg(''); }}
                            className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 transition-colors"
                        >
                            <X size={22} />
                        </button>
                        <h3 className="text-xl font-black text-slate-800 mb-1">Nuevo Usuario</h3>
                        <p className="text-slate-500 text-sm mb-6">Se le enviará acceso al correo registrado.</p>

                        {errorMsg && (
                            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-4 font-medium">
                                {errorMsg}
                            </div>
                        )}

                        <form onSubmit={handleCrear} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Nombre Completo</label>
                                <input required value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })}
                                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                    placeholder="Juan Pérez" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Correo Electrónico</label>
                                <input required type="email" value={form.correo} onChange={e => setForm({ ...form, correo: e.target.value })}
                                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                    placeholder="operador@negocio.com" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Contraseña Inicial</label>
                                <div className="relative">
                                    <input required type={showPass ? 'text' : 'password'} value={form.password}
                                        onChange={e => setForm({ ...form, password: e.target.value })}
                                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                        placeholder="Min. 6 caracteres" />
                                    <button type="button" onClick={() => setShowPass(!showPass)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Rol</label>
                                    <select value={form.rol} onChange={e => setForm({ ...form, rol: e.target.value })}
                                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white">
                                        <option value="Operativo">Operativo (KDS)</option>
                                        <option value="Mesero">Mesero (POS)</option>
                                        <option value="Cocina">Cocina (KDS Exclusivo)</option>
                                        <option value="Admin">Administrador</option>
                                        <option value="SuperAdmin">SuperAdmin</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Negocio</label>
                                    <select value={form.negocioId} onChange={e => setForm({ ...form, negocioId: e.target.value })}
                                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white">
                                        <option value="">-- Global --</option>
                                        {negocios.map(n => (
                                            <option key={n.id} value={n.id}>{n.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <button type="submit"
                                className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-500/30 hover:from-indigo-500 transition-all active:scale-95 mt-2">
                                Crear Usuario
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Usuarios;
