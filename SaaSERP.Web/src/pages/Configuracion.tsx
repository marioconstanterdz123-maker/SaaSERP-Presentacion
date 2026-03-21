import React, { useEffect, useState } from 'react';
import axiosInstance from '../api/axiosConfig';
import {
    Settings, Globe, Smartphone, History, MessageCircle, BarChart2,
    ChevronDown, ChevronUp, Wifi, WifiOff, Save, Loader
} from 'lucide-react';
import WhatsAppPanel from '../components/WhatsAppPanel';

interface Modulos {
    accesoWeb: boolean;
    accesoMovil: boolean;
    moduloHistorial: boolean;
    moduloWhatsApp: boolean;
    moduloReportes: boolean;
}

interface NegocioConfig {
    id: number;
    nombre: string;
    sistemaAsignado: string;
    activo: boolean;
    instanciaWhatsApp: string | null;
    accesoWeb: boolean;
    accesoMovil: boolean;
    moduloHistorial: boolean;
    moduloWhatsApp: boolean;
    moduloReportes: boolean;
}

interface ToggleProps {
    label: string;
    description: string;
    icon: React.ReactNode;
    value: boolean;
    onChange: (v: boolean) => void;
    color?: string;
}

const Toggle: React.FC<ToggleProps> = ({ label, description, icon, value, onChange, color = 'bg-blue-500' }) => (
    <div className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
        <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${value ? color : 'bg-slate-100'} transition-colors`}>
                <span className={value ? 'text-white' : 'text-slate-400'}>{icon}</span>
            </div>
            <div>
                <p className="text-sm font-bold text-slate-700">{label}</p>
                <p className="text-xs text-slate-400">{description}</p>
            </div>
        </div>
        <button
            onClick={() => onChange(!value)}
            className={`relative w-12 h-6 rounded-full transition-all duration-300 focus:outline-none ${value ? 'bg-blue-500' : 'bg-slate-200'}`}
        >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${value ? 'translate-x-6' : 'translate-x-0'}`} />
        </button>
    </div>
);

const SISTEMA_ICON: Record<string, string> = {
    CITAS: '✂️', TAQUERIA: '🌮', PARQUEADERO: '🅿️', RESTAURANTES: '🍽️',
};

const Configuracion: React.FC = () => {
    const [negocios, setNegocios] = useState<NegocioConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState<number | null>(null);
    const [pendingChanges, setPendingChanges] = useState<Record<number, Partial<Modulos>>>({});
    const [saving, setSaving] = useState<number | null>(null);
    const [savedMsg, setSavedMsg] = useState<number | null>(null);

    useEffect(() => {
        axiosInstance.get('/negocios').then(r => {
            setNegocios(r.data);
        }).finally(() => setLoading(false));
    }, []);

    const handleToggle = (negocioId: number, field: keyof Modulos, value: boolean) => {
        setPendingChanges(prev => ({
            ...prev,
            [negocioId]: { ...(prev[negocioId] || {}), [field]: value }
        }));
        setNegocios(prev => prev.map(n =>
            n.id === negocioId ? { ...n, [field]: value } : n
        ));
    };

    const handleSave = async (negocioId: number) => {
        setSaving(negocioId);
        try {
            const n = negocios.find(x => x.id === negocioId)!;
            await axiosInstance.patch(`/negocios/${negocioId}/modulos`, {
                accesoWeb: n.accesoWeb,
                accesoMovil: n.accesoMovil,
                moduloHistorial: n.moduloHistorial,
                moduloWhatsApp: n.moduloWhatsApp,
                moduloReportes: n.moduloReportes,
            });
            setPendingChanges(prev => { const c = { ...prev }; delete c[negocioId]; return c; });
            setSavedMsg(negocioId);
            setTimeout(() => setSavedMsg(null), 2500);
        } catch (e) {
            alert('Error al guardar los cambios.');
        } finally {
            setSaving(null);
        }
    };

    const hasPending = (id: number) => !!pendingChanges[id] && Object.keys(pendingChanges[id]).length > 0;

    return (
        <div className="flex flex-col gap-6 animate-fade-in-up">
            {/* Header */}
            <div className="flex items-center gap-4 bg-white/60 p-6 rounded-3xl border border-white/40 shadow-sm backdrop-blur-md">
                <div className="bg-slate-800 p-3 rounded-2xl shadow-lg">
                    <Settings size={32} className="text-white" />
                </div>
                <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight">Configuración Global</h2>
                    <p className="text-slate-500 font-medium">Gestiona módulos, accesos y WhatsApp por negocio</p>
                </div>
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                    { label: 'Acceso Web', icon: <Globe size={15} />, color: 'bg-blue-500' },
                    { label: 'Acceso Móvil', icon: <Smartphone size={15} />, color: 'bg-purple-500' },
                    { label: 'Historial', icon: <History size={15} />, color: 'bg-amber-500' },
                    { label: 'WhatsApp', icon: <MessageCircle size={15} />, color: 'bg-emerald-500' },
                    { label: 'Reportes', icon: <BarChart2 size={15} />, color: 'bg-rose-500' },
                ].map(m => (
                    <div key={m.label} className={`flex items-center gap-2 ${m.color} text-white text-xs font-bold px-3 py-2 rounded-xl shadow-sm`}>
                        {m.icon} {m.label}
                    </div>
                ))}
            </div>

            {/* Negocio Cards */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {negocios.map(n => (
                        <div key={n.id} className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white shadow-lg overflow-hidden">
                            {/* Card Header — click to expand */}
                            <button
                                onClick={() => setExpanded(expanded === n.id ? null : n.id)}
                                className="w-full flex items-center gap-4 p-5 text-left hover:bg-slate-50/50 transition-colors"
                            >
                                <div className="text-2xl w-10 h-10 flex items-center justify-center bg-slate-100 rounded-xl">
                                    {SISTEMA_ICON[n.sistemaAsignado] ?? '🏢'}
                                </div>
                                <div className="flex-1">
                                    <p className="font-black text-slate-800 text-lg leading-tight">{n.nombre}</p>
                                    <p className="text-xs text-slate-400 font-semibold">{n.sistemaAsignado}</p>
                                </div>

                                {/* Mini status pills */}
                                <div className="hidden md:flex items-center gap-1.5">
                                    <span title="Acceso Web" className={`p-1.5 rounded-lg ${n.accesoWeb ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-300'}`}><Globe size={13}/></span>
                                    <span title="Móvil" className={`p-1.5 rounded-lg ${n.accesoMovil ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-300'}`}><Smartphone size={13}/></span>
                                    <span title="Historial" className={`p-1.5 rounded-lg ${n.moduloHistorial ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-300'}`}><History size={13}/></span>
                                    <span title="WhatsApp" className={`p-1.5 rounded-lg ${n.moduloWhatsApp ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-300'}`}><MessageCircle size={13}/></span>
                                    <span title="Reportes" className={`p-1.5 rounded-lg ${n.moduloReportes ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-300'}`}><BarChart2 size={13}/></span>
                                </div>

                                <span className="text-slate-400 ml-2">
                                    {expanded === n.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                </span>
                            </button>

                            {/* Expanded panel */}
                            {expanded === n.id && (
                                <div className="border-t border-slate-100 p-5 grid md:grid-cols-2 gap-8">
                                    {/* Toggles */}
                                    <div>
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Acceso y Módulos</p>
                                        <Toggle
                                            label="Acceso Web"
                                            description="El negocio puede iniciar sesión en el panel web"
                                            icon={<Globe size={15} />}
                                            value={n.accesoWeb}
                                            onChange={v => handleToggle(n.id, 'accesoWeb', v)}
                                            color="bg-blue-500"
                                        />
                                        <Toggle
                                            label="Acceso Móvil"
                                            description="Puede usar la app móvil (futuro)"
                                            icon={<Smartphone size={15} />}
                                            value={n.accesoMovil}
                                            onChange={v => handleToggle(n.id, 'accesoMovil', v)}
                                            color="bg-purple-500"
                                        />
                                        <Toggle
                                            label="Módulo: Historial"
                                            description="Acceso a registros históricos del día"
                                            icon={<History size={15} />}
                                            value={n.moduloHistorial}
                                            onChange={v => handleToggle(n.id, 'moduloHistorial', v)}
                                            color="bg-amber-500"
                                        />
                                        <Toggle
                                            label="Módulo: WhatsApp"
                                            description="Mensajes automáticos activos"
                                            icon={<MessageCircle size={15} />}
                                            value={n.moduloWhatsApp}
                                            onChange={v => handleToggle(n.id, 'moduloWhatsApp', v)}
                                            color="bg-emerald-500"
                                        />
                                        <Toggle
                                            label="Módulo: Reportes"
                                            description="Gráficos y analítica avanzada"
                                            icon={<BarChart2 size={15} />}
                                            value={n.moduloReportes}
                                            onChange={v => handleToggle(n.id, 'moduloReportes', v)}
                                            color="bg-rose-500"
                                        />

                                        {/* Save button */}
                                        <div className="mt-4">
                                            {savedMsg === n.id ? (
                                                <p className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                                                    <Wifi size={14} /> Cambios guardados correctamente
                                                </p>
                                            ) : (
                                                <button
                                                    onClick={() => handleSave(n.id)}
                                                    disabled={saving === n.id || !hasPending(n.id)}
                                                    className="flex items-center gap-2 text-sm font-bold bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white px-5 py-2.5 rounded-xl transition-all active:scale-95"
                                                >
                                                    {saving === n.id
                                                        ? <><Loader size={15} className="animate-spin" /> Guardando...</>
                                                        : <><Save size={15} /> Guardar Cambios</>}
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* WhatsApp Panel */}
                                    <div>
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">WhatsApp Business</p>
                                        <WhatsAppPanel negocioId={n.id} negocioNombre={n.nombre} />

                                        {!n.accesoWeb && (
                                            <div className="mt-4 flex items-center gap-2 bg-red-50 border border-red-100 rounded-2xl px-4 py-3 text-xs font-bold text-red-500">
                                                <WifiOff size={14} /> Este negocio tiene el acceso web desactivado. Sus usuarios no pueden iniciar sesión.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Configuracion;
