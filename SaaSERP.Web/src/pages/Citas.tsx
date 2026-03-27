import React, { useEffect, useState } from 'react';
import axiosInstance from '../api/axiosConfig';
import { Scissors, XSquare, CheckCircle, Plus, Clock } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

moment.locale('es');
const localizer = momentLocalizer(moment);

const Citas: React.FC = () => {
    const { negocioId } = useParams();
    const [negocio, setNegocio] = useState<any>(null);
    const [citas, setCitas] = useState<any[]>([]);
    const [recursosDisponibles, setRecursosDisponibles] = useState<any[]>([]);
    const [serviciosDisponibles, setServiciosDisponibles] = useState<any[]>([]);
    const [isCitaModalOpen, setIsCitaModalOpen] = useState(false);
    const [selectedCita, setSelectedCita] = useState<any>(null);
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
        } catch (error: any) {
            console.error("Error al registrar cita:", error);
            alert(error.response?.data?.error || "No se pudo registrar la cita de forma local. Verifica tu conexión.");
        }
    };

    const handleEventClick = (event: any) => {
        setSelectedCita(event.resource);
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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 bg-white/60 p-4 rounded-3xl border border-white/40 shadow-sm backdrop-blur-md gap-4">
                <div className="flex items-center gap-4">
                    <Scissors size={28} className="text-fuchsia-500 drop-shadow-sm md:w-8 md:h-8" />
                    <div>
                        <h3 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">Agenda de Hoy</h3>
                        <p className="text-xs md:text-sm font-medium text-slate-500">{citas.length} citas registradas</p>
                    </div>
                </div>
                <button onClick={() => setIsCitaModalOpen(true)} className="w-full md:w-auto bg-gradient-to-r from-fuchsia-500 to-pink-500 hover:from-fuchsia-600 hover:to-pink-600 text-white font-bold py-3 md:py-2 px-6 rounded-2xl shadow-lg shadow-pink-500/30 transition-transform active:scale-95 flex items-center justify-center gap-2">
                    <Plus size={20} /> Nueva Cita
                </button>
            </div>

            {citas.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center bg-white/40 rounded-3xl border border-white/20 border-dashed min-h-[300px]">
                    <CheckCircle size={48} className="text-slate-300 mb-4" />
                    <h3 className="text-lg md:text-xl font-bold text-slate-400">Sin citas para hoy. Agrega una para empezar.</h3>
                </div>
            ) : (
                <>
                    {/* MOBILE: Card list view */}
                    <div className="md:hidden space-y-3">
                        {citas.map((c: any) => (
                            <div
                                key={c.id}
                                onClick={() => setSelectedCita(c)}
                                className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 shadow-md border border-slate-100 flex items-center gap-4 active:scale-[0.98] transition-transform cursor-pointer"
                            >
                                <div className={`w-1.5 self-stretch rounded-full flex-shrink-0 ${c.estado === 'Completada' ? 'bg-emerald-400' : 'bg-fuchsia-400'}`} />
                                <div className="flex-1 min-w-0">
                                    <p className="font-black text-slate-800 truncate">{c.nombreCliente}</p>
                                    <p className="text-xs text-slate-500 font-medium">
                                        {new Date(c.fechaHoraInicio).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        {c.telefonoCliente && ` · ${c.telefonoCliente}`}
                                    </p>
                                </div>
                                <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${
                                    c.estado === 'Completada' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                }`}>{c.estado}</span>
                            </div>
                        ))}
                    </div>

                    {/* DESKTOP: Big Calendar */}
                    <div className="hidden md:flex bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 flex-1 p-5 min-h-[750px] overflow-hidden flex-col">
                        <Calendar
                            localizer={localizer}
                            events={citas.map((c: any) => ({
                                id: c.id,
                                title: `${c.nombreCliente} - ${c.estado === 'Pendiente' ? '⏳' : '✅'}`,
                                start: new Date(c.fechaHoraInicio),
                                end: new Date(c.fechaHoraFin || new Date(c.fechaHoraInicio).getTime() + (c.duracionMinutos || 30) * 60000),
                                resource: c
                            }))}
                            startAccessor="start"
                            endAccessor="end"
                            defaultView={Views.DAY}
                            views={[Views.DAY, Views.WEEK, Views.MONTH, Views.AGENDA]}
                            step={15}
                            timeslots={2}
                            onSelectEvent={handleEventClick}
                            min={new Date(new Date().setHours(negocio?.horaApertura ? parseInt(negocio.horaApertura.split(':')[0]) : 8, 0, 0))}
                            max={new Date(new Date().setHours(negocio?.horaCierre ? parseInt(negocio.horaCierre.split(':')[0]) : 20, 0, 0))}
                            messages={{
                                next: "Sig",
                                previous: "Ant",
                                today: "Hoy",
                                month: "Mes",
                                week: "Semana",
                                day: "Día",
                                agenda: "Agenda",
                                noEventsInRange: "No hay citas en esta ventana de tiempo."
                            }}
                            eventPropGetter={(event: any) => {
                                let backgroundColor = '#d946ef';
                                if (event.resource.estado === 'Completada') backgroundColor = '#10b981';
                                if (event.resource.estado === 'Cancelada') backgroundColor = '#ef4444';
                                return { style: { backgroundColor, borderRadius: '8px', border: 'none', fontWeight: 'bold', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' } };
                            }}
                            className="font-sans text-slate-700 CalendarOverwrites"
                        />
                    </div>
                </>
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

            {selectedCita && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in text-left">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden p-6 relative">
                        <div className="flex justify-between items-start mb-4 border-b border-slate-100 pb-4">
                            <div>
                                <h3 className="text-2xl font-black text-slate-800 leading-tight">{selectedCita.nombreCliente}</h3>
                                <p className="text-sm font-bold text-fuchsia-600 flex items-center gap-1 mt-1">
                                    📞 {selectedCita.telefonoCliente}
                                </p>
                            </div>
                            <button onClick={() => setSelectedCita(null)} className="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full p-2 transition-colors"><XSquare size={20} /></button>
                        </div>
                        
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-5 space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500 font-bold flex items-center gap-2"><Clock size={16}/> Horario:</span>
                                <span className="font-bold text-slate-700 tracking-wide">{new Date(selectedCita.fechaHoraInicio).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500 font-bold flex items-center gap-2"><CheckCircle size={16}/> Estado:</span>
                                <span className={`font-bold uppercase tracking-wider text-xs px-2 py-1 rounded-full ${selectedCita.estado === 'Completada' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                                    {selectedCita.estado}
                                </span>
                            </div>
                        </div>

                        {selectedCita.estado === 'Pendiente' && (
                            <button onClick={() => { handleCambiarEstadoCita(selectedCita.id, 'Completada'); setSelectedCita(null); }} className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black py-4 rounded-xl shadow-lg shadow-emerald-500/30 transition-transform active:scale-95 text-lg flex items-center justify-center gap-2">
                                ✅ Concluir y Cobrar
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Citas;
