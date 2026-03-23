import React, { useEffect, useState } from 'react';
import axiosInstance from '../api/axiosConfig';
import { Plus, CheckCircle2, XCircle, Store, Clock, Settings, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Negocio {
    id: number;
    nombre: string;
    telefonoWhatsApp: string;
    sistemaAsignado: string;
    capacidadMaxima: number;
    duracionMinutosCita: number;
    usaMesas: boolean;
    activo: boolean;
    horaApertura: string;
    horaCierre: string;
}

const Negocios: React.FC = () => {
    const [negocios, setNegocios] = useState<Negocio[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newNegocio, setNewNegocio] = useState<Partial<Negocio>>({
        nombre: '', telefonoWhatsApp: '', sistemaAsignado: '', 
        capacidadMaxima: 10, duracionMinutosCita: 30, usaMesas: false, 
        horaApertura: '09:00', horaCierre: '18:00', activo: true
    });
    const navigate = useNavigate();

    useEffect(() => {
        fetchNegocios();
    }, []);

    const fetchNegocios = async () => {
        try {
            const { data } = await axiosInstance.get('/negocios');
            setNegocios(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleEstado = async (n: Negocio) => {
        try {
            const payload = { ...n, activo: !n.activo };
            await axiosInstance.put(`/negocios/${n.id}`, payload);
            fetchNegocios(); // Recargar la lista
        } catch (err) {
            console.error("Error al cambiar estado", err);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Formatear payload para que en SQL queden en 0 las reglas innecesarias del giro
        const payload = { ...newNegocio };
        if (payload.sistemaAsignado === 'TAQUERIA' || payload.sistemaAsignado === 'RESTAURANTES') {
            payload.duracionMinutosCita = 0;
        } else if (payload.sistemaAsignado === 'CITAS') {
            payload.usaMesas = false;
            payload.capacidadMaxima = 0;
        } else if (payload.sistemaAsignado === 'PARQUEADERO') {
            payload.usaMesas = false;
            payload.duracionMinutosCita = 0;
        }

        try {
            await axiosInstance.post('/negocios', payload);
            setIsModalOpen(false);
            fetchNegocios();
            setNewNegocio({
                nombre: '', telefonoWhatsApp: '', sistemaAsignado: '', 
                capacidadMaxima: 10, duracionMinutosCita: 30, usaMesas: false, 
                horaApertura: '09:00', horaCierre: '18:00', activo: true
            });
        } catch (err) {
            console.error("Error creando negocio", err);
        }
    };

    return (
        <div className="h-full flex flex-col space-y-6">
            <header className="flex justify-between items-end mb-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <Store className="text-blue-600" size={32} /> Tus Negocios
                    </h2>
                    <p className="text-slate-500 mt-1">Selecciona una tarjeta para configurar sus servicios, citas y punto de venta.</p>
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-2xl shadow-lg shadow-blue-500/30 flex items-center gap-2 transition-transform active:scale-95"
                >
                    <Plus size={20} /> Nuevo Negocio
                </button>
            </header>

            {loading ? (
                 <div className="flex-1 flex justify-center items-center">
                     <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                 </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pb-10 pr-2">
                    {negocios.map((n, index) => (
                        <div 
                            key={n.id} 
                            style={{ animationDelay: `${index * 100}ms` }}
                            className={`backdrop-blur-xl rounded-3xl p-6 shadow-xl border flex flex-col hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 animate-fade-in-up group ${
                                n.activo 
                                    ? 'bg-white/80 border-white/40' 
                                    : 'bg-slate-200/50 border-slate-300/50 grayscale opacity-80'
                            }`}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="bg-gradient-to-br from-blue-100 to-blue-50 p-3 rounded-2xl cursor-pointer" title="Ir al Dashboard" onClick={() => navigate(`/negocio/${n.id}/dashboard`)}>
                                    <Store className="text-blue-600" size={24} />
                                </div>
                                <button 
                                    onClick={() => handleToggleEstado(n)}
                                    title={n.activo ? "Suspender Suscripción" : "Activar Suscripción"}
                                    className="hover:scale-105 transition-transform"
                                >
                                    {n.activo ? 
                                        <span className="flex items-center gap-1 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold shadow-sm border border-emerald-200 hover:bg-red-100 hover:text-red-700 hover:border-red-200">
                                            <CheckCircle2 size={12} /> Activo
                                        </span> : 
                                        <span className="flex items-center gap-1 bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-xs font-bold shadow-sm border border-slate-200 hover:bg-emerald-100 hover:text-emerald-700 hover:border-emerald-200">
                                            <XCircle size={12} /> Suspendido
                                        </span>
                                    }
                                </button>
                            </div>
                            
                            <h3 className="text-xl font-bold text-slate-800 mb-1">{n.nombre}</h3>
                            <p className="text-sm font-semibold text-blue-600 mb-4">{n.sistemaAsignado || 'Sin Sistema'}</p>
                            
                            <div className="space-y-2 mb-6 flex-1">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500 flex items-center gap-2"><Clock size={16}/> Horario</span>
                                    <span className="text-slate-700 font-medium">{n.horaApertura.substring(0,5)} - {n.horaCierre.substring(0,5)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">WhatsApp</span>
                                    <span className="text-slate-700 font-medium">{n.telefonoWhatsApp || 'N/A'}</span>
                                </div>
                                
                                {/* Info Condicional según Giro */}
                                {n.sistemaAsignado === 'CITAS' && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Duración Cita</span>
                                        <span className="text-slate-700 font-medium">{n.duracionMinutosCita} mins</span>
                                    </div>
                                )}
                                {(n.sistemaAsignado === 'TAQUERIA' || n.sistemaAsignado === 'RESTAURANTES') && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Control de Mesas</span>
                                        <span className="text-slate-700 font-medium">{n.usaMesas ? 'Sí' : 'No'}</span>
                                    </div>
                                )}
                                {n.sistemaAsignado === 'PARQUEADERO' && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Capacidad Total</span>
                                        <span className="text-slate-700 font-medium">{n.capacidadMaxima} Autos</span>
                                    </div>
                                )}
                            </div>

                            <button onClick={() => navigate(`/negocio/${n.id}/dashboard`)} className="w-full mt-3 py-3 rounded-xl bg-slate-50 hover:bg-blue-600 text-slate-700 hover:text-white font-semibold transition-colors flex justify-center items-center gap-2 group-hover:shadow-md">
                                <Settings size={18} /> Ir al Dashboard <ArrowRight size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal Creación */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 flex justify-between items-center text-white">
                            <h3 className="text-xl font-bold">Crear Nuevo Negocio</h3>
                            <button onClick={() => setIsModalOpen(false)} className="hover:bg-white/20 p-2 rounded-full transition-colors"><XCircle size={24} /></button>
                        </div>
                        <form onSubmit={handleCreate} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Nombre Comercial</label>
                                <input required type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-700" 
                                    value={newNegocio.nombre} onChange={e => setNewNegocio({...newNegocio, nombre: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Sis. Asignado</label>
                                    <select required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-700" 
                                        value={newNegocio.sistemaAsignado} onChange={e => setNewNegocio({...newNegocio, sistemaAsignado: e.target.value})}>
                                        <option value="">Seleccione</option>
                                        <option value="TAQUERIA">TAQUERIA</option>
                                        <option value="CITAS">CITAS</option>
                                        <option value="PARQUEADERO">PARQUEADERO</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">WhatsApp</label>
                                    <input required type="text" placeholder="Ej. 1234567890" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-700" 
                                        value={newNegocio.telefonoWhatsApp} onChange={e => setNewNegocio({...newNegocio, telefonoWhatsApp: e.target.value})} />
                                </div>
                            </div>
                            
                            {/* Campos Dinámicos basados en Sistema Asignado */}
                            {newNegocio.sistemaAsignado === 'CITAS' && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Duración Base por Cita (Mins)</label>
                                    <input required type="number" min="5" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-700" 
                                        value={newNegocio.duracionMinutosCita} onChange={e => setNewNegocio({...newNegocio, duracionMinutosCita: Number(e.target.value)})} />
                                </div>
                            )}

                            {(newNegocio.sistemaAsignado === 'TAQUERIA' || newNegocio.sistemaAsignado === 'RESTAURANTES') && (
                                <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                                    <input type="checkbox" id="usaMesas" className="w-5 h-5 text-blue-600 rounded"
                                         checked={newNegocio.usaMesas} onChange={e => setNewNegocio({...newNegocio, usaMesas: e.target.checked})} />
                                    <label htmlFor="usaMesas" className="text-sm font-bold text-slate-700">El negocio usa controles de Mesas Físicas</label>
                                </div>
                            )}

                            {newNegocio.sistemaAsignado === 'PARQUEADERO' && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Capacidad Máxima (Vehículos)</label>
                                    <input required type="number" min="1" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-700" 
                                        value={newNegocio.capacidadMaxima} onChange={e => setNewNegocio({...newNegocio, capacidadMaxima: Number(e.target.value)})} />
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Apertura</label>
                                    <input type="time" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-700" 
                                        value={newNegocio.horaApertura} onChange={e => setNewNegocio({...newNegocio, horaApertura: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Cierre</label>
                                    <input type="time" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-700" 
                                        value={newNegocio.horaCierre} onChange={e => setNewNegocio({...newNegocio, horaCierre: e.target.value})} />
                                </div>
                            </div>
                            <div className="pt-4">
                                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-95">
                                    Guardar Negocio
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Negocios;
