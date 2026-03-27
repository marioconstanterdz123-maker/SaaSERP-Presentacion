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

            {loading ? <p className="text-slate-500 text-sm py-4">Cargando...</p> : skus.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-2xl">
                    Sin mapeos registrados.
                </div>
            ) : (
                <div className="flex flex-col gap-2">
                    {skus.map(s => (
                        <div key={s.id} className="flex items-center gap-3 bg-slate-50 rounded-2xl border border-slate-100 p-3">
                            {/* Platform badge */}
                            <span className={`flex-shrink-0 text-[10px] font-black px-2 py-1 rounded-lg ${
                                s.plataforma === 'RAPPI' ? 'bg-orange-100 text-orange-700' :
                                s.plataforma === 'UBEREATS' ? 'bg-emerald-100 text-emerald-700' :
                                'bg-slate-200 text-slate-600'
                            }`}>
                                {s.plataforma}
                            </span>
                            {/* SKU + Product */}
                            <div className="flex-1 min-w-0">
                                <p className="font-mono text-xs font-bold text-slate-500">{s.skuExterno}</p>
                                <p className="font-bold text-slate-800 text-sm truncate">→ {s.servicioNombre}</p>
                            </div>
                            {/* Delete */}
                            <button onClick={() => handleDelete(s.id)} className="flex-shrink-0 text-slate-300 hover:text-red-400 hover:bg-red-50 p-1.5 rounded-lg transition-all">
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
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
