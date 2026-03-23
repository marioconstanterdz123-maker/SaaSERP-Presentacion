import React from 'react';
import { Activity, Users, Car, Coffee } from 'lucide-react';

const Dashboard: React.FC = () => {
    return (
        <div className="h-full flex flex-col space-y-6">
            <header className="mb-6">
                <h2 className="text-3xl font-black text-slate-800 tracking-tight">Centro de Mando</h2>
                <p className="text-slate-500 mt-1">Visión global de todos los negocios en tiempo real.</p>
            </header>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard title="Ingresos Hoy" value="$24,500" icon={<Activity className="text-emerald-500" />} trend="+12%" />
                <KpiCard title="Citas Activas" value="18" icon={<Users className="text-blue-500" />} trend="Estable" />
                <KpiCard title="Vehículos en Parqueadero" value="45" icon={<Car className="text-purple-500" />} trend="+5 hoy" />
                <KpiCard title="Comandas en Curso" value="12" icon={<Coffee className="text-orange-500" />} trend="Pico Alto" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
                {/* Chart Section Prototype */}
                <div className="lg:col-span-2 bg-white/70 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20 flex flex-col">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Actividad de Inteligencia Artificial (DeepSeek)</h3>
                    <div className="flex-1 bg-slate-100/50 rounded-2xl flex items-center justify-center border border-dashed border-slate-300">
                        <p className="text-slate-400 font-medium">Gráfico de Mensajes Procesados (Próximamente)</p>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Actividad Reciente</h3>
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex items-center space-x-3 group cursor-pointer p-2 rounded-xl hover:bg-slate-50 transition-colors">
                                <div className="w-2 h-2 rounded-full bg-blue-500 group-hover:scale-150 transition-transform"></div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-700">Bot programó cita</p>
                                    <p className="text-xs text-slate-400">Hace {i * 12} mins - Operación Registrada</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const KpiCard = ({ title, value, icon, trend }: { title: string, value: string, icon: React.ReactNode, trend: string }) => (
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 flex flex-col justify-between shadow-xl border border-white/40 hover:scale-[1.02] hover:shadow-2xl transition-all duration-300 cursor-default">
        <div className="flex justify-between items-start">
            <div className="bg-slate-100 p-3 rounded-2xl">{icon}</div>
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${trend.includes('+') ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                {trend}
            </span>
        </div>
        <div className="mt-4">
            <h4 className="text-slate-400 text-sm font-medium">{title}</h4>
            <p className="text-3xl font-black text-slate-800 mt-1">{value}</p>
        </div>
    </div>
);

export default Dashboard;
