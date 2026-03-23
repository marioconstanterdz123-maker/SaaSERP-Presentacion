import React, { useEffect, useState } from 'react';
import axiosInstance from '../api/axiosConfig';
import { Plus, Trash2, ShieldAlert, XCircle } from 'lucide-react';

interface SkuDeliveryProps {
    negocioId: string;
    catalogo: any[]; // The list of internal Servicios
}

const SkuDeliveryPanel: React.FC<SkuDeliveryProps> = ({ negocioId, catalogo }) => {
    const [skus, setSkus] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Formulario
    const [plataforma, setPlataforma] = useState('RAPPI');
    const [skuExterno, setSkuExterno] = useState('');
    const [servicioId, setServicioId] = useState('');

    useEffect(() => {
        loadSkus();
    }, [negocioId]);

    const loadSkus = () => {
        setLoading(true);
        axiosInstance.get('/SkuTerceros', { headers: { NegocioId: negocioId } })
            .then(res => setSkus(res.data))
            .finally(() => setLoading(false));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axiosInstance.post('/SkuTerceros', {
                plataforma,
                skuExterno,
                servicioId: Number(servicioId)
            }, { headers: { NegocioId: negocioId } });
            setIsModalOpen(false);
            setSkuExterno('');
            setServicioId('');
            loadSkus();
        } catch (err: any) {
            alert(err.response?.data?.msg || 'Error al guardar');
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('¿Eliminar mapeo?')) return;
        try {
            await axiosInstance.delete(`/SkuTerceros/${id}`, { headers: { NegocioId: negocioId } });
            loadSkus();
        } catch(err) {
            alert('Error al eliminar');
        }
    };

    return (
        <div className="mt-8 bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6 animate-fade-in-up">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                        <ShieldAlert className="text-orange-500" size={24} /> SKU Delivery Mapping
                    </h3>
                    <p className="text-sm text-slate-500">Mapea los productos de Delivery contra tu Catálogo interno.</p>
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl shadow-lg flex items-center gap-2 transition-transform active:scale-95"
                >
                    <Plus size={18} /> Agregar Mapeo
                </button>
            </div>

            {loading ? <p className="text-slate-500 text-sm">Cargando...</p> : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                                <th className="p-4 font-semibold">Plataforma</th>
                                <th className="p-4 font-semibold">SKU Externo</th>
                                <th className="p-4 font-semibold">Platillo Interno</th>
                                <th className="p-4 font-semibold text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {skus.map(s => (
                                <tr key={s.id} className="hover:bg-slate-50/50">
                                    <td className="p-4 font-bold text-slate-700">{s.plataforma}</td>
                                    <td className="p-4 text-slate-600 font-mono text-sm">{s.skuExterno}</td>
                                    <td className="p-4 text-slate-600 font-bold">{s.servicioNombre}</td>
                                    <td className="p-4 text-right">
                                        <button onClick={() => handleDelete(s.id)} className="text-red-400 hover:text-red-600 transition-colors bg-red-50 p-2 rounded-lg">
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {skus.length === 0 && (
                                <tr><td colSpan={4} className="p-8 text-center text-slate-500">No hay mapeos registrados.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in-up">
                        <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-5 flex justify-between items-center text-white">
                            <h3 className="text-lg font-bold">Nuevo Mapeo de SKU</h3>
                            <button onClick={() => setIsModalOpen(false)} className="hover:bg-white/20 p-1 rounded-full"><XCircle size={22} /></button>
                        </div>
                        <form onSubmit={handleSave} className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Plataforma</label>
                                <select value={plataforma} onChange={e => setPlataforma(e.target.value)} className="w-full bg-slate-50 border rounded-xl px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500">
                                    <option value="RAPPI">Rappi</option>
                                    <option value="UBEREATS">Uber Eats</option>
                                    <option value="DIDI">Didi Food</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">SKU Externo (ID Delivery)</label>
                                <input required type="text" value={skuExterno} onChange={e => setSkuExterno(e.target.value)} className="w-full bg-slate-50 border rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="Ej. 10293847" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cruce Interno</label>
                                <select required value={servicioId} onChange={e => setServicioId(e.target.value)} className="w-full bg-slate-50 border rounded-xl px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500">
                                    <option value="">-- Selecciona platillo --</option>
                                    {catalogo.filter(c => c.activo).map(c => (
                                        <option key={c.id} value={c.id}>{c.nombre} (${c.precio})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="pt-2">
                                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg transition-transform active:scale-95">
                                    Vincular SKU
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SkuDeliveryPanel;
