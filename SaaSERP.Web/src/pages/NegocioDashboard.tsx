import React, { useEffect, useState } from 'react';
import axiosInstance from '../api/axiosConfig';
import { useParams } from 'react-router-dom';
import { Activity, DollarSign, Users, Car, Coffee, TrendingUp, Clock, AlertCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const NegocioDashboard: React.FC = () => {
    const { negocioId } = useParams();
    const [negocio, setNegocio] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const resNegocios = await axiosInstance.get('/negocios');
                const current = resNegocios.data.find((n: any) => n.id.toString() === negocioId);
                if (current) setNegocio(current);

                const resKpis = await axiosInstance.get('/Reportes/dashboard', {
                    headers: { 'X-Negocio-Id': negocioId }
                });
                setStats(resKpis.data);
            } catch (error) {
                console.error("Error cargando dashboard:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [negocioId]);

    if (loading || !stats) return (
        <div className="flex-1 flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
    );

    const isParqueadero = negocio?.sistemaAsignado === 'PARQUEADERO';
    const isTaqueria = negocio?.sistemaAsignado === 'TAQUERIA' || negocio?.sistemaAsignado === 'RESTAURANTES';
    const isCitas = negocio?.sistemaAsignado === 'CITAS';

    return (
        <div className="h-full flex flex-col space-y-6 animate-fade-in-up">
            <header className="flex justify-between items-end mb-2">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <Activity className="text-blue-500" size={32} /> 
                        Panel de Rendimiento Local
                    </h2>
                    <p className="text-slate-500 mt-1">Estadísticas y resumen de la sucursal <b>{negocio?.nombre}</b> al día de hoy.</p>
                </div>
            </header>

            {/* KPI Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl p-6 shadow-[0_10px_40px_-15px_rgba(16,185,129,0.7)] text-white relative overflow-hidden group hover:scale-[1.02] transition-transform">
                    <div className="absolute -right-8 -top-8 bg-white/10 w-32 h-32 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div>
                            <p className="text-emerald-100 font-bold uppercase tracking-wider text-sm mb-1">Caja del Día</p>
                            <h3 className="text-4xl font-black tracking-tight">${stats.ingresosHoy.toLocaleString('es-MX', {minimumFractionDigits: 2})}</h3>
                        </div>
                        <div className="bg-emerald-400/50 p-3 rounded-2xl backdrop-blur-sm"><DollarSign size={24} /></div>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-medium text-emerald-100 relative z-10 bg-black/10 w-fit px-3 py-1 rounded-full">
                        <TrendingUp size={16} /> +{stats.crecimiento}% vs. ayer
                    </div>
                </div>

                {isParqueadero && (
                    <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-slate-100 hover:-translate-y-2 transition-transform">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-slate-500 font-bold uppercase tracking-wider text-sm mb-1">Ocupación Actual</p>
                                <h3 className="text-4xl font-black text-slate-800 tracking-tight">{stats.vehiculosAdentro} <span className="text-lg text-slate-400 font-bold">/ {negocio?.capacidadMaxima}</span></h3>
                            </div>
                            <div className="bg-blue-50 text-blue-500 p-3 rounded-2xl"><Car size={24} /></div>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-3 mb-2 overflow-hidden border border-slate-200">
                            <div className="bg-blue-500 h-3 rounded-full" style={{ width: `${(stats.vehiculosAdentro / (negocio?.capacidadMaxima || 1)) * 100}%` }}></div>
                        </div>
                        <p className="text-xs text-slate-500 font-bold">Capacidad al {Math.round((stats.vehiculosAdentro / (negocio?.capacidadMaxima || 1)) * 100)}%</p>
                    </div>
                )}

                {isTaqueria && (
                    <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-slate-100 hover:-translate-y-2 transition-transform">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-slate-500 font-bold uppercase tracking-wider text-sm mb-1">Comandas en Cocina</p>
                                <h3 className="text-4xl font-black text-orange-500 tracking-tight">{stats.comandasActivas}</h3>
                            </div>
                            <div className="bg-orange-50 text-orange-500 p-3 rounded-2xl"><Coffee size={24} /></div>
                        </div>
                        <p className="text-sm font-medium text-slate-500 flex items-center gap-1 group">
                            <AlertCircle size={16} className="text-orange-400" />
                            Requieren atención inmediata.
                        </p>
                    </div>
                )}

                {isCitas && (
                    <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-slate-100 hover:-translate-y-2 transition-transform">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-slate-500 font-bold uppercase tracking-wider text-sm mb-1">Citas Restantes Hoy</p>
                                <h3 className="text-4xl font-black text-fuchsia-500 tracking-tight">12</h3>
                            </div>
                            <div className="bg-fuchsia-50 text-fuchsia-500 p-3 rounded-2xl"><Clock size={24} /></div>
                        </div>
                        <p className="text-sm font-medium text-slate-500 flex items-center gap-1 group">
                            Próxima cita en 15 mins.
                        </p>
                    </div>
                )}

                <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-slate-100 hover:-translate-y-2 transition-transform">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-slate-500 font-bold uppercase tracking-wider text-sm mb-1">Clientes Atendidos</p>
                            <h3 className="text-4xl font-black text-slate-800 tracking-tight">{stats.clientesRegistrados}</h3>
                        </div>
                        <div className="bg-purple-50 text-purple-500 p-3 rounded-2xl"><Users size={24} /></div>
                    </div>
                    <div className="text-sm font-medium text-purple-600 bg-purple-50 w-fit px-3 py-1 rounded-lg">
                        Buen flujo de tráfico
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 w-full mt-4 grid grid-cols-1 gap-6 pb-6">
                <div className="w-full bg-white/70 backdrop-blur-xl border border-white/20 rounded-3xl shadow-xl p-6 hover:shadow-2xl transition-all h-[400px] flex flex-col animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                    <div className="mb-6 flex justify-between items-center px-2">
                        <div>
                            <h3 className="text-xl font-bold text-slate-800">Tendencia de Ingresos</h3>
                            <p className="text-sm font-medium text-slate-500">Histórico de la caja de los últimos 7 días.</p>
                        </div>
                    </div>
                    <div className="flex-1 min-h-[250px] w-full">
                        {stats.ingresosSemana && stats.ingresosSemana.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats.ingresosSemana} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 600}} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 600}} tickFormatter={(val) => `$${val}`} dx={-10} />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                                        labelStyle={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}
                                        formatter={(value: number) => [`$${value.toLocaleString('es-MX', {minimumFractionDigits: 2})}`, 'Ingresos']}
                                    />
                                    <Area type="monotone" dataKey="ventas" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorVentas)" animationDuration={1500} />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="w-full h-full flex flex-col justify-center items-center text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                                <TrendingUp size={48} className="mb-4 text-slate-300" />
                                <p className="font-bold">Aún no hay suficientes cortes de caja para trazar la tendencia.</p>
                                <p className="text-sm">Genera cobros de mesas o vehículos para ver la gráfica.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NegocioDashboard;
