import React, { useEffect, useState } from 'react';
import axiosInstance from '../api/axiosConfig';
import { Scissors, XSquare, CheckCircle, Plus } from 'lucide-react';
import { useParams } from 'react-router-dom';

const Citas: React.FC = () => {
    const { negocioId } = useParams();
    const [negocio, setNegocio] = useState<any>(null);
    const [citas, setCitas] = useState<any[]>([]);
    const [recursosDisponibles, setRecursosDisponibles] = useState<any[]>([]);
    const [serviciosDisponibles, setServiciosDisponibles] = useState<any[]>([]);
    const [isCitaModalOpen, setIsCitaModalOpen] = useState(false);
    const [nuevaCita, setNuevaCita] = useState({
        nombreCliente: '',
        telefonoCliente: '',
        fechaHoraInicio: '',
        duracionMinutos: 30,
        servicioId: 0,
        recursoId: 0
    });

    useEffect(() => {
        axiosInstance.get('/negocios').then(res => {
            const current = res.data.find((n: any) => n.id.toString() === negocioId);
            if (current) {
                setNegocio(current);
                if (current.sistemaAsignado === 'CITAS') {
                    fetchCitas();
                    fetchCatalogosCita();
                }
            }
        });
        
        // Polling cada 30 seg
        const interval = setInterval(() => {
            if(negocio?.sistemaAsignado === 'CITAS') fetchCitas();
        }, 30000);
        return () => clearInterval(interval);
    }, [negocioId, negocio?.sistemaAsignado]);

    const fetchCitas = async () => {
        try {
            const { data } = await axiosInstance.get('/Citas/activas', {
                headers: { 'X-Negocio-Id': negocioId }
            });
            setCitas(data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchCatalogosCita = async () => {
        try {
            const [resRec, resServ] = await Promise.all([
                axiosInstance.get(`/recursos/negocio/${negocioId}`),
                axiosInstance.get(`/servicios/negocio/${negocioId}`)
            ]);
            setRecursosDisponibles(resRec.data);
            setServiciosDisponibles(resServ.data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleCambiarEstadoCita = async (id: number, nuevoEstado: string) => {
        try {
            await axiosInstance.put(`/Citas/${id}/estado`, { nuevoEstado }, {
                headers: { 'X-Negocio-Id': negocioId }
            });
            fetchCitas();
        } catch (error) {
            console.error("Error cambiando estado de cita:", error);
        }
    };

    const handleRegistrarCita = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axiosInstance.post('/Citas/registrar', {
                ...nuevaCita,
                negocioId: Number(negocioId),
                servicioId: nuevaCita.servicioId === 0 ? null : nuevaCita.servicioId,
                recursoId: nuevaCita.recursoId === 0 ? null : nuevaCita.recursoId,
            });
            setIsCitaModalOpen(false);
            setNuevaCita({ nombreCliente: '', telefonoCliente: '', fechaHoraInicio: '', duracionMinutos: 30, servicioId: 0, recursoId: 0 });
            fetchCitas();
        } catch (error) {
            console.error("Error al registrar cita:", error);
            alert("No se pudo registrar la cita.");
        }
    };

    if (negocio?.sistemaAsignado !== 'CITAS') {
        return (
            <div className="flex-1 flex items-center justify-center p-8">
                <p className="text-slate-500">Este módulo solo está disponible para negocios tipo "CITAS".</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col flex-1 h-full animate-fade-in-up">
            <div className="flex justify-between items-center mb-6 bg-white/60 p-4 rounded-3xl border border-white/40 shadow-sm backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <Scissors size={32} className="text-fuchsia-500 drop-shadow-sm" />
                    <div>
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight">Agenda de Hoy</h3>
                        <p className="text-sm font-medium text-slate-500">{citas.length} citas registradas</p>
                    </div>
                </div>
                <button onClick={() => setIsCitaModalOpen(true)} className="bg-gradient-to-r from-fuchsia-500 to-pink-500 hover:from-fuchsia-600 hover:to-pink-600 text-white font-bold py-2 px-6 rounded-2xl shadow-lg shadow-pink-500/30 transition-transform active:scale-95 flex items-center gap-2">
                    <Plus size={20} /> Nueva Cita
                </button>
            </div>

            {citas.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center bg-white/40 rounded-3xl border border-white/20 border-dashed min-h-[400px]">
                    <CheckCircle size={48} className="text-slate-300 mb-4" />
                    <h3 className="text-xl font-bold text-slate-400">Sin citas para hoy</h3>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 content-start pb-10">
                    {citas.map(c => (
                        <div key={c.id} className="bg-white/80 backdrop-blur-xl rounded-3xl p-5 shadow-lg border border-slate-100 flex flex-col hover:-translate-y-1 transition-transform border-t-4 border-t-fuchsia-400">
                            <div className="flex justify-between items-start mb-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${c.estado === 'Completada' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                                    {c.estado}
                                </span>
                                <span className="font-black text-slate-300 text-xl">#{c.id}</span>
                            </div>
                            
                            <h4 className="text-2xl font-black text-slate-800 tracking-tight leading-tight mb-1">{c.nombreCliente}</h4>
                            <p className="text-sm font-bold text-fuchsia-600 mb-4 flex items-center gap-1">
                                📞 {c.telefonoCliente}
                            </p>
                            
                            <div className="bg-slate-50 rounded-2xl p-4 mb-4 flex-1">
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-slate-500 font-medium">Horario:</span>
                                    <span className="font-bold text-slate-700">{new Date(c.fechaHoraInicio).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-2 mt-auto">
                                {c.estado === 'Pendiente' && (
                                    <button onClick={() => handleCambiarEstadoCita(c.id, 'Completada')} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl shadow-md transition-transform active:scale-95 text-lg">
                                        ✅ Terminar y Cobrar
                                    </button>
                                )}
                                {c.estado === 'Completada' && (
                                    <button disabled className="bg-slate-200 text-slate-400 font-bold py-3 rounded-xl shadow-sm text-lg cursor-not-allowed">
                                        ✔ Finalizada
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isCitaModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in text-left">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="bg-gradient-to-r from-fuchsia-600 to-pink-600 p-5 flex justify-between items-center text-white">
                            <h3 className="font-bold tracking-wide">Agendar Cita</h3>
                            <button onClick={() => setIsCitaModalOpen(false)} className="hover:bg-white/20 p-2 rounded-full transition-colors"><XSquare size={20} /></button>
                        </div>
                        <form onSubmit={handleRegistrarCita} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Nombre del Cliente</label>
                                <input required type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-800 focus:ring-2 focus:ring-pink-500 focus:outline-none" 
                                    value={nuevaCita.nombreCliente} onChange={e => setNuevaCita({...nuevaCita, nombreCliente: e.target.value})} placeholder="Ej. Juan Pérez" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Teléfono</label>
                                    <input required type="tel" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-800 focus:ring-2 focus:ring-pink-500 focus:outline-none" 
                                        value={nuevaCita.telefonoCliente} onChange={e => setNuevaCita({...nuevaCita, telefonoCliente: e.target.value})} placeholder="555-0000" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Fecha y Hora</label>
                                    <input required type="datetime-local" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-800 focus:ring-2 focus:ring-pink-500 focus:outline-none" 
                                        value={nuevaCita.fechaHoraInicio} onChange={e => setNuevaCita({...nuevaCita, fechaHoraInicio: e.target.value})} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Especialista (Opcional)</label>
                                <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-800 focus:ring-2 focus:ring-pink-500 focus:outline-none"
                                    value={nuevaCita.recursoId} onChange={e => setNuevaCita({...nuevaCita, recursoId: Number(e.target.value)})}
                                >
                                    <option value={0}>Sin preferencia</option>
                                    {recursosDisponibles.filter(r => r.activo).map(r => (
                                        <option key={r.id} value={r.id}>{r.nombre} ({r.tipo})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Servicio (Opcional)</label>
                                <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-800 focus:ring-2 focus:ring-pink-500 focus:outline-none"
                                    value={nuevaCita.servicioId} onChange={e => setNuevaCita({...nuevaCita, servicioId: Number(e.target.value)})}
                                >
                                    <option value={0}>Escoger después</option>
                                    {serviciosDisponibles.filter(s => s.activo).map(s => (
                                        <option key={s.id} value={s.id}>{s.nombre} - ${s.precioBase}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="pt-2">
                                <button type="submit" className="w-full bg-gradient-to-r from-fuchsia-500 to-pink-500 hover:from-fuchsia-600 hover:to-pink-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-pink-500/30 transition-all active:scale-95 flex items-center justify-center gap-2">
                                    <CheckCircle className="w-5 h-5" /> Agendar y Disponer
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Citas;
