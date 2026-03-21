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
                // Predefinimos el tipo genérico en base al giro
                setNewRecurso(prev => ({
                    ...prev, 
                    tipo: current.sistemaAsignado === 'TAQUERIA' || current.sistemaAsignado === 'RESTAURANTES' ? 'MESA' : 'ESPECIALISTA' 
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
            setNewRecurso(prev => ({ ...prev, nombre: '' })); // Reset solo el nombre para añadir rápido
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

    return (
        <div className="h-full flex flex-col space-y-6">
            <header className="flex justify-between items-end mb-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <Users className="text-blue-500" size={32} /> 
                        {isMesas ? 'Disposición de Mesas' : 'Equipo Especializado'}
                    </h2>
                    <p className="text-slate-500 mt-1">
                        {isMesas ? 'Administra las mesas disponibles en el local.' : 'Agrega a las personas que ofrecen los servicios.'}
                    </p>
                </div>
                <div className="flex flex-col items-end gap-3">
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-bold py-3 px-6 rounded-2xl shadow-lg shadow-blue-500/30 flex items-center gap-2 transition-transform active:scale-95"
                    >
                        <Plus size={20} /> {isMesas ? 'Nueva Mesa' : 'Nuevo Especialista'}
                    </button>
                    <input
                        type="text"
                        placeholder="Buscar..."
                        className="bg-white border border-slate-200 text-sm font-medium px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-300 shadow-sm"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </header>

            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : (
                <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 flex-1 overflow-hidden flex flex-col animate-fade-in-up">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-500 text-sm uppercase tracking-wider">
                                    <th className="p-5 font-semibold">Identificador / Nombre</th>
                                    <th className="p-5 font-semibold">Tipo Clasificación</th>
                                    <th className="p-5 font-semibold text-center">Estado</th>
                                    <th className="p-5 font-semibold text-right">Opciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {recursos.filter(r => r.nombre.toLowerCase().includes(searchTerm.toLowerCase())).map(r => (
                                    <tr key={r.id} className="hover:bg-blue-50/50 transition-colors">
                                        <td className="p-5 font-bold text-slate-700">{r.nombre}</td>
                                        <td className="p-5 text-slate-600">
                                            <span className="bg-slate-100 px-3 py-1 rounded-lg text-xs font-bold border border-slate-200 uppercase">
                                                {r.tipo}
                                            </span>
                                        </td>
                                        <td className="p-5 text-center">
                                            <button onClick={() => handleToggleEstado(r)} className="hover:scale-105 transition-transform">
                                                {r.activo ? 
                                                    <span className="flex items-center gap-1 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-200">
                                                        <CheckCircle2 size={12} /> Disponible
                                                    </span> : 
                                                    <span className="flex items-center gap-1 bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-xs font-bold border border-slate-200">
                                                        <XCircle size={12} /> Baja
                                                    </span>
                                                }
                                            </button>
                                        </td>
                                        <td className="p-5 text-right">
                                            <button className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-xl transition-colors">
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {recursos.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="p-12 text-center text-slate-500">
                                            Aún no hay registros aquí.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-6 flex justify-between items-center text-white">
                            <h3 className="text-xl font-bold">{isMesas ? 'Agregar Mesa' : 'Agregar Especialista'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="hover:bg-white/20 p-2 rounded-full transition-colors"><XCircle size={24} /></button>
                        </div>
                        <form onSubmit={handleCreate} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                                    {isMesas ? 'Número o Nombre de la Mesa' : 'Nombre del Especialista'}
                                </label>
                                <input required type="text" placeholder={isMesas ? "Ej. Mesa 1, Terraza A" : "Ej. Carlos Martínez"} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-700" 
                                    value={newRecurso.nombre} onChange={e => setNewRecurso({...newRecurso, nombre: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Rol / Clasificación interna</label>
                                <input required type="text" 
                                    className={`w-full border rounded-xl px-4 py-3 font-medium transition-all ${isMesas ? 'bg-slate-200 border-slate-300 text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500'}`}
                                    value={newRecurso.tipo} 
                                    onChange={e => !isMesas && setNewRecurso({...newRecurso, tipo: e.target.value.toUpperCase()})}
                                    readOnly={isMesas} 
                                    placeholder={!isMesas ? "Ej. DENTISTA, TERAPEUTA, TATUADOR" : ""}
                                    title={isMesas ? "Se autocompleta por el sistema" : "Describe la profesión o rol"} />
                            </div>
                            <div className="pt-4">
                                <button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-95">
                                    Registrar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Recursos;
