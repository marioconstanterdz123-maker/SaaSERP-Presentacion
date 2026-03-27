import React, { useEffect, useState } from 'react';
import axiosInstance from '../api/axiosConfig';
import { Plus, CheckCircle2, XCircle, Users, Trash2 } from 'lucide-react';
import { useParams } from 'react-router-dom';

interface Recurso {
    id?: number;
    negocioId: number;
    nombre: string;
    tipo: string;
    activo: boolean;
}

const Recursos: React.FC = () => {
    const { negocioId } = useParams();
    const [recursos, setRecursos] = useState<Recurso[]>([]);
    const [negocio, setNegocio] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [newRecurso, setNewRecurso] = useState<Recurso>({
        negocioId: Number(negocioId),
        nombre: '', tipo: '', activo: true
    });

    useEffect(() => {
        axiosInstance.get('/negocios').then(res => {
            const current = res.data.find((n: any) => n.id.toString() === negocioId);
            if(current) {
                setNegocio(current);
                setNewRecurso(prev => ({
                    ...prev, 
                    tipo: current.sistemaAsignado === 'TAQUERIA' || current.sistemaAsignado === 'RESTAURANTES' ? 'MESA' : 'COLABORADOR' 
                }));
            }
        });
        fetchRecursos();
    }, [negocioId]);

    const fetchRecursos = async () => {
        try {
            const { data } = await axiosInstance.get(`/recursos/negocio/${negocioId}`);
            setRecursos(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axiosInstance.post('/recursos', newRecurso);
            setIsModalOpen(false);
            fetchRecursos();
            setNewRecurso(prev => ({ ...prev, nombre: '' }));
        } catch (err) {
            console.error("Error creando recurso", err);
        }
    };

    const handleToggleEstado = async (r: Recurso) => {
        try {
            const payload = { ...r, activo: !r.activo };
            await axiosInstance.put(`/recursos/${r.id}`, payload);
            fetchRecursos(); 
        } catch (err) {
            console.error("Error al cambiar estado", err);
        }
    };

    const isMesas = negocio?.sistemaAsignado === 'TAQUERIA' || negocio?.sistemaAsignado === 'RESTAURANTES';
    const filtrados = recursos.filter(r => r.nombre.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="flex flex-col gap-4">
            {/* ===== HEADER ===== */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                    <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                        <Users className="text-blue-500 flex-shrink-0" size={22} />
                        {isMesas ? 'Disposición de Mesas' : 'Colaboradores'}
                    </h2>
                    <p className="text-slate-500 mt-0.5 text-sm">
                        {isMesas ? 'Administra las mesas del local.' : 'Personal operativo del negocio.'}
                    </p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex-shrink-0 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold py-3 px-5 rounded-2xl shadow-lg shadow-blue-500/30 flex items-center gap-2 transition-transform active:scale-95"
                >
                    <Plus size={18} /> {isMesas ? 'Nueva Mesa' : 'Nuevo'}
                </button>
            </div>

            {/* ===== SEARCH ===== */}
            <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base">🔍</span>
                <input
                    type="search"
                    placeholder="Buscar..."
                    className="w-full bg-white border border-slate-200 text-sm font-medium pl-10 pr-4 py-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            {/* ===== CONTENT ===== */}
            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : filtrados.length === 0 ? (
                <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-12 text-center text-slate-400">
                    <Users size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="font-medium">{searchTerm ? 'Sin resultados para la búsqueda.' : `Sin ${isMesas ? 'mesas' : 'colaboradores'} registrados.`}</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 animate-fade-in-up">
                    {filtrados.map(r => (
                        <div
                            key={r.id}
                            className={`bg-white rounded-2xl border shadow-sm p-4 flex flex-col gap-3 transition-all hover:-translate-y-0.5 ${
                                r.activo ? 'border-slate-100' : 'border-slate-100 opacity-60'
                            }`}
                        >
                            {/* Name + delete */}
                            <div className="flex items-start justify-between gap-1">
                                <div className="min-w-0">
                                    <p className="font-black text-slate-800 text-base leading-tight truncate">{r.nombre}</p>
                                    <span className="bg-blue-50 text-blue-600 text-[10px] font-black px-2 py-0.5 rounded-lg uppercase mt-1 inline-block tracking-wider">
                                        {r.tipo}
                                    </span>
                                </div>
                                <button
                                    onClick={() => {/* TODO: delete */}}
                                    className="p-1.5 rounded-xl text-slate-200 hover:text-red-400 hover:bg-red-50 transition-all flex-shrink-0"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>

                            {/* Status toggle */}
                            <button
                                onClick={() => handleToggleEstado(r)}
                                className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                                    r.activo
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                        : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'
                                }`}
                            >
                                {r.activo
                                    ? <><CheckCircle2 size={12} /> Disponible</>
                                    : <><XCircle size={12} /> Sin servicio</>
                                }
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* ===== MODAL ===== */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-5 flex justify-between items-center text-white">
                            <h3 className="text-lg font-bold">{isMesas ? '🪑 Agregar Mesa' : '👤 Agregar Colaborador'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="hover:bg-white/20 p-2 rounded-full transition-colors">
                                <XCircle size={22} />
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                    {isMesas ? 'Número o Nombre' : 'Nombre del Colaborador'}
                                </label>
                                <input
                                    required
                                    type="text"
                                    placeholder={isMesas ? "Ej. Mesa 1, Terraza A" : "Ej. Carlos Martínez"}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700"
                                    value={newRecurso.nombre}
                                    onChange={e => setNewRecurso({...newRecurso, nombre: e.target.value})}
                                />
                            </div>
                            {!isMesas && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Rol / Clasificación</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700"
                                        value={newRecurso.tipo}
                                        onChange={e => setNewRecurso({...newRecurso, tipo: e.target.value.toUpperCase()})}
                                        placeholder="Ej. CAJERO, ASESOR"
                                    />
                                </div>
                            )}
                            <button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-95">
                                Registrar
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Recursos;
