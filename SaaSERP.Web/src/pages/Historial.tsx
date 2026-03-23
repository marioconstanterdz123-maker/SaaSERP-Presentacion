import React, { useEffect, useState } from 'react';
import axiosInstance from '../api/axiosConfig';
import { useParams } from 'react-router-dom';
import { Archive, Calendar as CalendarIcon, Search, DollarSign, Clock, FileText } from 'lucide-react';

const Historial: React.FC = () => {
    const { negocioId } = useParams();
    const [negocio, setNegocio] = useState<any>(null);
    const [historial, setHistorial] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Filtro por fecha (por defecto HOY)
    const [fechaFiltro, setFechaFiltro] = useState(() => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    });

    useEffect(() => {
        const fetchNegocioYData = async () => {
            setIsLoading(true);
            try {
                const resNegocios = await axiosInstance.get('/negocios');
                const current = resNegocios.data.find((n: any) => n.id.toString() === negocioId);
                
                if (current) {
                    setNegocio(current);
                    
                    let endpoint = "";
                    if (current.sistemaAsignado === "CITAS") endpoint = "/Citas/historial";
                    else if (current.sistemaAsignado === "TAQUERIA") endpoint = "/Comandas/historial";
                    else if (current.sistemaAsignado === "PARQUEADERO") endpoint = "/Tickets/historial";

                    if (endpoint) {
                        const { data } = await axiosInstance.get(endpoint, {
                            headers: { 'X-Negocio-Id': negocioId }
                        });
                        setHistorial(data);
                    }
                }
            } catch (error) {
                console.error("Error al obtener el historial:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchNegocioYData();
    }, [negocioId]);

    // Filtrar localmente por fecha
    const getDatosFiltrados = () => {
        return historial.filter(item => {
            // Cada sistema guarda la fecha en un campo distinto
            let fechaStr = "";
            if (negocio?.sistemaAsignado === "CITAS") fechaStr = item.fechaHoraInicio;
            else if (negocio?.sistemaAsignado === "TAQUERIA") fechaStr = item.fechaCreacion;
            else if (negocio?.sistemaAsignado === "PARQUEADERO") fechaStr = item.horaSalida || item.horaEntrada;

            if (!fechaStr) return false;
            
            const itemDate = new Date(fechaStr).toISOString().split('T')[0];
            return itemDate === fechaFiltro;
        });
    };

    const filtrados = getDatosFiltrados();

    // Sumarizaciones
    const totalVentas = filtrados.reduce((acc, curr) => {
        if (negocio?.sistemaAsignado === "TAQUERIA") return acc + (curr.total || 0);
        if (negocio?.sistemaAsignado === "PARQUEADERO") return acc + (curr.montoCalculado || 0);
        // Citas no tiene "Total" directamente en el modelo base (cobranza manual), pero podemos contar
        return acc;
    }, 0);

    const renderTabla = () => {
        if (!negocio) return null;

        if (negocio.sistemaAsignado === "TAQUERIA") {
            return (
                <table className="w-full min-w-[600px] text-left border-collapse">
                    <thead>
                        <tr className="border-b-2 border-slate-200 text-slate-500 text-sm tracking-wider uppercase">
                            <th className="py-4 font-bold">Ref #</th>
                            <th className="py-4 font-bold">Cliente / Origen</th>
                            <th className="py-4 font-bold">Hora</th>
                            <th className="py-4 font-bold text-emerald-600">Total Cobrado</th>
                            <th className="py-4 font-bold text-center">Estado</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filtrados.map(c => (
                            <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="py-4 font-black text-slate-400">#{c.id}</td>
                                <td className="py-4 font-bold text-slate-800">{c.nombreCliente} <span className="text-xs text-slate-400 ml-2 bg-slate-100 px-2 py-1 rounded-md">{c.tipoAtencion} {c.identificadorMesa}</span></td>
                                <td className="py-4 text-slate-600 font-medium">{new Date(c.fechaCreacion).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                                <td className="py-4 font-black text-emerald-600">${c.total.toFixed(2)}</td>
                                <td className="py-4 text-center">
                                    <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200">{c.estado}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            );
        }

        if (negocio.sistemaAsignado === "PARQUEADERO") {
            return (
                <table className="w-full min-w-[600px] text-left border-collapse">
                    <thead>
                        <tr className="border-b-2 border-slate-200 text-slate-500 text-sm tracking-wider uppercase">
                            <th className="py-4 font-bold">Ticket #</th>
                            <th className="py-4 font-bold">Placa</th>
                            <th className="py-4 font-bold">Entrada - Salida</th>
                            <th className="py-4 font-bold text-emerald-600">Cobro</th>
                            <th className="py-4 font-bold text-center">Estado</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filtrados.map(t => (
                            <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="py-4 font-black text-slate-400">#{t.id}</td>
                                <td className="py-4 font-bold text-slate-800 tracking-widest">{t.placa}</td>
                                <td className="py-4 text-slate-600 font-medium text-sm">
                                    {new Date(t.horaEntrada).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} 
                                    <span className="mx-2 text-slate-300">→</span> 
                                    {t.horaSalida ? new Date(t.horaSalida).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Sin Salida'}
                                </td>
                                <td className="py-4 font-black text-emerald-600">${(t.montoCalculado || 0).toFixed(2)}</td>
                                <td className="py-4 text-center">
                                    <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200">{t.estado}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            );
        }

        if (negocio.sistemaAsignado === "CITAS") {
            return (
                <table className="w-full min-w-[600px] text-left border-collapse">
                    <thead>
                        <tr className="border-b-2 border-slate-200 text-slate-500 text-sm tracking-wider uppercase">
                            <th className="py-4 font-bold">ID #</th>
                            <th className="py-4 font-bold">Cliente</th>
                            <th className="py-4 font-bold">Contacto</th>
                            <th className="py-4 font-bold">Cita - Resolución</th>
                            <th className="py-4 font-bold text-center">Resultado</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filtrados.map(c => (
                            <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="py-4 font-black text-slate-400">#{c.id}</td>
                                <td className="py-4 font-bold text-slate-800">{c.nombreCliente}</td>
                                <td className="py-4 text-slate-500 font-medium">{c.telefonoCliente}</td>
                                <td className="py-4 text-slate-600 font-medium text-sm">
                                    <div className="flex flex-col">
                                        <span>Inicio: {new Date(c.fechaHoraInicio).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                        <span className="text-slate-400">Fin: {new Date(c.fechaHoraFin).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                    </div>
                                </td>
                                <td className="py-4 text-center">
                                    <span className={`text-xs font-bold px-3 py-1 rounded-full border ${c.estado === 'Cancelada' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200'}`}>
                                        {c.estado}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            );
        }

        return <div className="p-8 text-center text-slate-500 font-medium">Sistema No Identificado</div>;
    };

    return (
        <div className="flex flex-col flex-1 h-full animate-fade-in-up">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 bg-white/60 p-6 rounded-3xl border border-white/40 shadow-sm backdrop-blur-md gap-4">
                <div className="flex items-center gap-4">
                    <div className="bg-slate-800 p-3 rounded-2xl shadow-lg">
                        <Archive size={32} className="text-white" />
                    </div>
                    <div>
                        <h3 className="text-3xl font-black text-slate-800 tracking-tight">Historial Diario</h3>
                        <p className="text-slate-500 font-medium">Auditoría de las operaciones terminadas o cobradas</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-100 w-full md:w-auto">
                    <CalendarIcon className="text-slate-400 ml-2" size={20} />
                    <input 
                        type="date" 
                        className="bg-transparent border-none focus:ring-0 text-slate-700 font-bold px-2 py-1 outline-none w-full"
                        value={fechaFiltro}
                        onChange={(e) => setFechaFiltro(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-3xl p-6 shadow-xl shadow-blue-500/20 text-white flex flex-col justify-between hover:scale-105 transition-transform">
                    <div className="flex justify-between items-start mb-4">
                        <h4 className="font-bold text-white/80">Total Movimientos</h4>
                        <FileText className="text-white/60" size={24} />
                    </div>
                    <div>
                        <span className="text-4xl font-black">{filtrados.length}</span>
                        <span className="text-white/70 ml-2 font-medium">operaciones</span>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-3xl p-6 shadow-xl shadow-emerald-500/20 text-white flex flex-col justify-between hover:scale-105 transition-transform">
                    <div className="flex justify-between items-start mb-4">
                        <h4 className="font-bold text-white/80">Ingreso Facturado</h4>
                        <DollarSign className="text-white/60" size={24} />
                    </div>
                    <div className="flex items-baseline">
                        <span className="text-4xl font-black">${totalVentas.toFixed(2)}</span>
                        <span className="text-white/70 ml-2 font-medium">MXN</span>
                    </div>
                </div>

                <div className="bg-slate-800 rounded-3xl p-6 shadow-xl shadow-slate-900/20 text-white flex flex-col justify-between hover:scale-105 transition-transform border border-slate-700">
                    <div className="flex justify-between items-start mb-4">
                        <h4 className="font-bold text-slate-400">Eficiencia</h4>
                        <Clock className="text-slate-500" size={24} />
                    </div>
                    <div>
                        <span className="text-4xl font-black text-amber-400">100</span>
                        <span className="text-slate-400 ml-2 font-medium">%</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl border border-white p-6 overflow-hidden flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Search size={20} className="text-slate-400" /> Detalle Operativo
                    </h3>
                </div>

                {isLoading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                    </div>
                ) : filtrados.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                         <Archive size={48} className="text-slate-300 mb-4" />
                         <h3 className="text-lg font-bold text-slate-400">No hay movimientos en este día</h3>
                         <p className="text-slate-400 text-sm mt-1">Selecciona otra fecha en el calendario superior</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto flex-1 h-0">
                        {renderTabla()}
                    </div>
                )}
            </div>

        </div>
    );
};

export default Historial;
