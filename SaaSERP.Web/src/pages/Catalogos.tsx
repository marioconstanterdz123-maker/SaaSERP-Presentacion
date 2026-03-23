import React, { useEffect, useState } from 'react';
import axiosInstance from '../api/axiosConfig';
import { Plus, CheckCircle2, XCircle, Scissors, Trash2, Car, Coffee } from 'lucide-react';
import { useParams } from 'react-router-dom';
import SkuDeliveryPanel from '../components/SkuDeliveryPanel';

interface Servicio {
    id?: number;
    negocioId: number;
    nombre: string;
    precio: number;
    duracionEstimadaMinutos: number;
    esPorFraccion: boolean;
    activo: boolean;
}

const Catalogos: React.FC = () => {
    const { negocioId } = useParams();
    const [servicios, setServicios] = useState<Servicio[]>([]);
    const [negocio, setNegocio] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [newServicio, setNewServicio] = useState<Servicio>({
        negocioId: Number(negocioId),
        nombre: '', precio: 0, duracionEstimadaMinutos: 0, esPorFraccion: false, activo: true
    });

    useEffect(() => {
        axiosInstance.get('/negocios').then(res => {
            const current = res.data.find((n: any) => n.id.toString() === negocioId);
            if(current) setNegocio(current);
        });
        fetchServicios();
    }, [negocioId]);

    const fetchServicios = async () => {
        try {
            const { data } = await axiosInstance.get(`/servicios/negocio/${negocioId}`);
            setServicios(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Limpiamos los datos innecesarios si el giro no los ocupa
        const payload = { ...newServicio };
        if (negocio?.sistemaAsignado !== 'CITAS') {
            payload.duracionEstimadaMinutos = 0;
            payload.esPorFraccion = false;
        }

        try {
            await axiosInstance.post('/servicios', payload);
            setIsModalOpen(false);
            fetchServicios();
            setNewServicio({
                negocioId: Number(negocioId),
                nombre: '', precio: 0, duracionEstimadaMinutos: 0, esPorFraccion: false, activo: true
            });
        } catch (err) {
            console.error("Error creando servicio", err);
        }
    };

    const handleToggleEstado = async (s: Servicio) => {
        try {
            const payload = { ...s, activo: !s.activo };
            await axiosInstance.put(`/servicios/${s.id}`, payload);
            fetchServicios(); 
        } catch (err) {
            console.error("Error al cambiar estado", err);
        }
    };

    const isCitas = negocio?.sistemaAsignado === 'CITAS';
    const isParqueadero = negocio?.sistemaAsignado === 'PARQUEADERO';
    const isRestaurante = negocio?.sistemaAsignado === 'TAQUERIA' || negocio?.sistemaAsignado === 'RESTAURANTES';

    return (
        <div className="h-full flex flex-col space-y-6">
            <header className="flex justify-between items-end mb-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        {isParqueadero && <Car className="text-blue-500" size={32} />}
                        {isRestaurante && <Coffee className="text-orange-500" size={32} />}
                        {isCitas && <Scissors className="text-fuchsia-500" size={32} />}
                        {isParqueadero ? 'Tarifas del Estacionamiento' : isRestaurante ? 'Catálogo de Artículos' : 'Listado de Servicios'}
                    </h2>
                    <p className="text-slate-500 mt-1">
                        {isParqueadero ? 'Configura los cobros por hora, fracción o pensión completa.' : 'Administra los productos o servicios que ofrecerá este negocio.'}
                    </p>
                </div>
                <div className="flex flex-col items-end gap-3">
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className={`text-white font-bold py-3 px-6 rounded-2xl shadow-lg flex items-center gap-2 transition-transform active:scale-95 ${
                            isParqueadero ? 'bg-gradient-to-r from-blue-500 to-indigo-500 shadow-blue-500/30 hover:from-blue-600 hover:to-indigo-600' :
                            isCitas ? 'bg-gradient-to-r from-fuchsia-500 to-purple-500 shadow-fuchsia-500/30 hover:from-fuchsia-600 hover:to-purple-600' :
                            'bg-gradient-to-r from-orange-500 to-rose-500 shadow-orange-500/30 hover:from-orange-600 hover:to-rose-600'
                        }`}
                    >
                        <Plus size={20} /> {isParqueadero ? 'Nueva Tarifa' : isRestaurante ? 'Nuevo Artículo' : 'Nuevo Servicio'}
                    </button>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Buscar elementos..."
                            className="bg-white border border-slate-200 rounded-xl px-4 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-slate-400 text-sm font-medium text-slate-700 shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </header>

            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : (
                <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 flex-1 overflow-hidden flex flex-col animate-fade-in-up">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-500 text-sm uppercase tracking-wider">
                                    <th className="p-5 font-semibold">Concepto / Nombre</th>
                                    <th className="p-5 font-semibold">Precio</th>
                                    {negocio?.sistemaAsignado === 'CITAS' && <th className="p-5 font-semibold">Duración</th>}
                                    <th className="p-5 font-semibold text-center">Estado</th>
                                    <th className="p-5 font-semibold text-right">Opciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {servicios.filter(s => s.nombre.toLowerCase().includes(searchTerm.toLowerCase())).map(s => (
                                    <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-5 font-bold text-slate-700">{s.nombre}</td>
                                        <td className="p-5 text-emerald-600 font-bold">${s.precio.toFixed(2)}</td>
                                        {negocio?.sistemaAsignado === 'CITAS' && (
                                            <td className="p-5 text-slate-600 text-sm">
                                                {s.duracionEstimadaMinutos > 0 ? `${s.duracionEstimadaMinutos} mins` : 'N/A'}
                                            </td>
                                        )}
                                        <td className="p-5 text-center">
                                            <button onClick={() => handleToggleEstado(s)} className="hover:scale-105 transition-transform">
                                                {s.activo ? 
                                                    <span className="flex items-center gap-1 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-200">
                                                        <CheckCircle2 size={12} /> Disponible
                                                    </span> : 
                                                    <span className="flex items-center gap-1 bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-xs font-bold border border-slate-200">
                                                        <XCircle size={12} /> Oculto
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
                                {servicios.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-12 text-center text-slate-500">
                                            Aún no hay servicios registrados en este catálogo.
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
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className={`p-6 flex justify-between items-center text-white ${
                            isParqueadero ? 'bg-gradient-to-r from-blue-500 to-indigo-500' :
                            isCitas ? 'bg-gradient-to-r from-fuchsia-500 to-purple-500' :
                            'bg-gradient-to-r from-orange-500 to-rose-500'
                        }`}>
                            <h3 className="text-xl font-bold">{isParqueadero ? 'Agregar Tarifa' : isRestaurante ? 'Agregar Artículo' : 'Agregar Servicio'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="hover:bg-white/20 p-2 rounded-full transition-colors"><XCircle size={24} /></button>
                        </div>
                        <form onSubmit={handleCreate} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Nombre (Concepto)</label>
                                <input required type="text" placeholder={isParqueadero ? "Ej. 1 Hora o Fracción Inicial" : "Ej. Producto o Consulta General"} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-400 transition-all font-medium text-slate-700" 
                                    value={newServicio.nombre} onChange={e => setNewServicio({...newServicio, nombre: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Precio ($)</label>
                                    <input required type="number" min="0" step="0.5" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all font-medium text-slate-700" 
                                        value={newServicio.precio} onChange={e => setNewServicio({...newServicio, precio: Number(e.target.value)})} />
                                </div>
                                {negocio?.sistemaAsignado === 'CITAS' && (
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Duración (Mins)</label>
                                        <input required type="number" min="0" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-400 transition-all font-medium text-slate-700" 
                                            value={newServicio.duracionEstimadaMinutos} onChange={e => setNewServicio({...newServicio, duracionEstimadaMinutos: Number(e.target.value)})} />
                                    </div>
                                )}
                            </div>
                            
                            {isParqueadero && (
                                <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-4 cursor-pointer" onClick={() => setNewServicio({...newServicio, esPorFraccion: !newServicio.esPorFraccion})}>
                                    <input type="checkbox" checked={newServicio.esPorFraccion} onChange={() => {}} className="w-5 h-5 accent-blue-600 rounded" />
                                    <div>
                                        <p className="font-bold text-slate-700 text-sm">Cobrar por Fracción</p>
                                        <p className="text-xs text-slate-500">Si se activa, el sistema dividirá el precio base según los minutos.</p>
                                    </div>
                                </div>
                            )}

                            <div className="pt-4">
                                <button type="submit" className={`w-full text-white font-bold py-3 rounded-xl shadow-lg transition-all active:scale-95 ${
                                    isParqueadero ? 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 shadow-blue-500/30' :
                                    isCitas ? 'bg-gradient-to-r from-fuchsia-500 to-purple-500 shadow-fuchsia-500/30' :
                                    'bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 shadow-orange-500/30'
                                }`}>
                                    {isParqueadero ? 'Guardar Tarifa' : 'Guardar en Catálogo'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isRestaurante && negocioId && (
                <SkuDeliveryPanel negocioId={negocioId} catalogo={servicios} />
            )}
        </div>
    );
};

export default Catalogos;
