import React, { useEffect, useState } from 'react';
import axiosInstance from '../api/axiosConfig';
import Swal from 'sweetalert2';
import {
    Settings, Globe, Smartphone, History, MessageCircle, BarChart2,
    ChevronDown, ChevronUp, Wifi, WifiOff, Save, Loader, Trash2
} from 'lucide-react';
import WhatsAppPanel from '../components/WhatsAppPanel';

interface Modulos {
    accesoWeb: boolean;
    accesoMovil: boolean;
    moduloHistorial: boolean;
    moduloWhatsApp: boolean;
    moduloWhatsAppIA: boolean;
    moduloCRM: boolean;
    moduloReportes: boolean;
}

interface NegocioConfig {
    id: number;
    nombre: string;
    sistemaAsignado: string;
    activo: boolean;
    instanciaWhatsApp: string | null;
    telefonoWhatsApp: string;
    accesoWeb: boolean;
    accesoMovil: boolean;
    moduloHistorial: boolean;
    moduloWhatsApp: boolean;
    moduloWhatsAppIA: boolean;
    moduloCRM: boolean;
    moduloReportes: boolean;
    horaApertura: string;
    horaCierre: string;
    capacidadMaxima: number;
    duracionMinutosCita: number;
    usaMesas: boolean;
    fechaVencimientoSuscripcion: string | null;
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

const getSuscripcionInfo = (fechaStr: string | null) => {
    if (!fechaStr) return { dias: 999, estado: 'active' as const, label: 'Sin límite' };
    const diff = Math.ceil((new Date(fechaStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (isNaN(diff) || diff <= 0) return { dias: 0, estado: 'expired' as const, label: 'Vencida' };
    if (diff <= 5)  return { dias: diff, estado: 'warning' as const, label: `${diff}d` };
    return { dias: diff, estado: 'active' as const, label: `${diff}d` };
};

const Configuracion: React.FC = () => {
    const [negocios, setNegocios] = useState<NegocioConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState<number | null>(null);
    const [saving, setSaving] = useState<number | null>(null);
    const [savedMsg, setSavedMsg] = useState<number | null>(null);
    const [ajustesOp, setAjustesOp] = useState<Record<number, any>>({});  // Ajustes operativos locales por negocio

    useEffect(() => {
        axiosInstance.get('/negocios').then(r => {
            setNegocios(r.data);
        }).finally(() => setLoading(false));
    }, []);

    const handleToggle = (negocioId: number, field: keyof Modulos, value: boolean) => {
        setNegocios(prev => prev.map(n =>
            n.id === negocioId ? { ...n, [field]: value } : n
        ));
    };

    const handleEliminar = async (n: NegocioConfig) => {
        const result = await Swal.fire({
            title: '¿Enviar a la papelera?',
            html: `El negocio <b>${n.nombre}</b> dejará de estar activo. Podrás restaurarlo desde la Papelera.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#64748b',
            confirmButtonText: '🗑️ Sí, eliminar',
            cancelButtonText: 'Cancelar',
        });
        if (!result.isConfirmed) return;
        await axiosInstance.delete(`/negocios/${n.id}`);
        setNegocios(prev => prev.filter(x => x.id !== n.id));
        setExpanded(null);
        Swal.fire('Enviado a papelera', `${n.nombre} fue desactivado.`, 'success');
    };

    // Cargar los ajustes operativos desde el negocio al expandirlo
    const ensureAjustesOp = (n: NegocioConfig) => {
        if (!ajustesOp[n.id]) {
            setAjustesOp(prev => ({ ...prev, [n.id]: {
                telefonoWhatsApp: n.telefonoWhatsApp ?? '',
                horaApertura: n.horaApertura ?? '08:00:00',
                horaCierre: n.horaCierre ?? '20:00:00',
                capacidadMaxima: n.capacidadMaxima ?? 1,
                duracionMinutosCita: n.duracionMinutosCita ?? 30,
                usaMesas: n.usaMesas ?? false,
            }}));
        }
    };

    const handleSaveAjustes = async (negocioId: number) => {
        setSaving(negocioId);
        try {
            const n = negocios.find(x => x.id === negocioId)!;
            const op = ajustesOp[negocioId] || {};
            await axiosInstance.patch(`/negocios/${negocioId}/ajustes-completos`, {
                accesoWeb: n.accesoWeb,
                accesoMovil: n.accesoMovil,
                moduloHistorial: n.moduloHistorial,
                moduloWhatsApp: n.moduloWhatsApp,
                moduloWhatsAppIA: n.moduloWhatsAppIA,
                moduloCRM: n.moduloCRM,
                moduloReportes: n.moduloReportes,
                telefonoWhatsApp: op.telefonoWhatsApp,
                horaApertura: op.horaApertura,
                horaCierre: op.horaCierre,
                capacidadMaxima: parseInt(op.capacidadMaxima),
                duracionMinutosCita: parseInt(op.duracionMinutosCita),
                usaMesas: op.usaMesas,
            });
            setSavedMsg(negocioId);
            setTimeout(() => setSavedMsg(null), 2500);
        } catch (e) {
            alert('Error al guardar la configuración.');
        } finally {
            setSaving(null);
        }
    };

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
                        <div key={n.id} className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white shadow-lg overflow-hidden relative">
                            {/* Card Header — click to expand */}
                            <button
                            onClick={() => { setExpanded(expanded === n.id ? null : n.id); ensureAjustesOp(n); }}
                                className="w-full flex items-center gap-4 p-5 text-left hover:bg-slate-50/50 transition-colors pr-16"
                            >
                                <div className="text-2xl w-10 h-10 flex items-center justify-center bg-slate-100 rounded-xl">
                                    {SISTEMA_ICON[n.sistemaAsignado] ?? '🏢'}
                                </div>
                                <div className="flex-1">
                                    <p className="font-black text-slate-800 text-lg leading-tight">{n.nombre}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <p className="text-xs text-slate-400 font-semibold">{n.sistemaAsignado}</p>
                                        {(() => {
                                            const s = getSuscripcionInfo(n.fechaVencimientoSuscripcion);
                                            return (
                                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                                    s.estado === 'expired' ? 'bg-red-100 text-red-600' :
                                                    s.estado === 'warning' ? 'bg-amber-100 text-amber-700' :
                                                    'bg-emerald-50 text-emerald-600'
                                                }`}>
                                                    {s.estado === 'expired' ? '🔴 Vencida' : `🗓️ ${s.dias}d`}
                                                </span>
                                            );
                                        })()}
                                    </div>
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

                            {/* Botón eliminar — absoluto sobre la tarjeta */}
                            <button
                                onClick={e => { e.stopPropagation(); handleEliminar(n); }}
                                title="Enviar a papelera"
                                className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all z-10"
                            >
                                <Trash2 size={16} />
                            </button>

                            {/* Expanded panel */}
                            {expanded === n.id && (
                                <div className="border-t border-slate-100 p-5 grid md:grid-cols-3 gap-8">
                                    {/* Columna A: Módulos */}
                                    <div>
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Módulos Contratados</p>
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
                                            label="📱 WhatsApp IA por Trabajador"
                                            description="Instancias individuales, handoff, silencio"
                                            icon={<MessageCircle size={15} />}
                                            value={n.moduloWhatsAppIA ?? false}
                                            onChange={v => handleToggle(n.id, 'moduloWhatsAppIA', v)}
                                            color="bg-violet-500"
                                        />
                                        <Toggle
                                            label="⭐ CRM + Lealtad"
                                            description="Perfiles de clientes, visitas, bonificación"
                                            icon={<BarChart2 size={15} />}
                                            value={n.moduloCRM ?? false}
                                            onChange={v => handleToggle(n.id, 'moduloCRM', v)}
                                            color="bg-amber-500"
                                        />
                                        <Toggle
                                            label="Módulo: Reportes"
                                            description="Gráficos y analítica avanzada"
                                            icon={<BarChart2 size={15} />}
                                            value={n.moduloReportes}
                                            onChange={v => handleToggle(n.id, 'moduloReportes', v)}
                                            color="bg-rose-500"
                                        />

                                        {/* Renovar suscripción */}
                                        <div className="mt-4 space-y-2">
                                            {(() => {
                                                const s = getSuscripcionInfo(n.fechaVencimientoSuscripcion);
                                                return (
                                                    <div className={`rounded-xl px-3 py-2 text-xs font-bold ${
                                                        s.estado === 'expired' ? 'bg-red-50 text-red-600 border border-red-100' :
                                                        s.estado === 'warning' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                                        'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                    }`}>
                                                        {s.estado === 'expired'
                                                            ? '🔴 Suscripción vencida — acceso bloqueado'
                                                            : `✅ Activa: vence en ${s.dias} día(s)`}
                                                    </div>
                                                );
                                            })()}
                                            {savedMsg === n.id ? (
                                                <p className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                                                    <Wifi size={14} /> Cambios guardados correctamente
                                                </p>
                                            ) : (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleSaveAjustes(n.id)}
                                                        disabled={saving === n.id}
                                                        className="flex-1 flex items-center justify-center gap-2 text-sm font-bold bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white px-4 py-2.5 rounded-xl transition-all active:scale-95"
                                                    >
                                                        {saving === n.id
                                                            ? <><Loader size={15} className="animate-spin" /> Guardando...</>
                                                            : <><Save size={15} /> Guardar</>}
                                                    </button>
                                                    <button
                                                        onClick={async () => {
                                                            await axiosInstance.post(`/negocios/${n.id}/renovar?dias=30`);
                                                            Swal.fire({ toast: true, position: 'top-end', icon: 'success',
                                                                title: '✅ Renovado 30 días', showConfirmButton: false, timer: 2500 });
                                                            const r = await axiosInstance.get('/negocios');
                                                            setNegocios(r.data);
                                                        }}
                                                        title="Renovar 30 días"
                                                        className="flex items-center justify-center gap-1.5 text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white px-3 py-2.5 rounded-xl transition-all active:scale-95"
                                                    >
                                                        🔄 +30d
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Columna B: Ajustes Operativos */}
                                    <div>
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Ajustes Operativos</p>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 block mb-1">📞 Teléfono del Dueño (Owner Routing)</label>
                                                <input
                                                    type="tel"
                                                    placeholder="528341234567"
                                                    value={ajustesOp[n.id]?.telefonoWhatsApp ?? ''}
                                                    onChange={e => setAjustesOp(prev => ({ ...prev, [n.id]: { ...prev[n.id], telefonoWhatsApp: e.target.value } }))}
                                                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400"
                                                />
                                                <p className="text-xs text-slate-400 mt-1">Sin panel web: recibe tickets. Con web: resumen diario.</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <label className="text-xs font-bold text-slate-500 block mb-1">🕐 Hora Apertura</label>
                                                    <input type="time"
                                                        value={(ajustesOp[n.id]?.horaApertura ?? '08:00:00').substring(0, 5)}
                                                        onChange={e => setAjustesOp(prev => ({ ...prev, [n.id]: { ...prev[n.id], horaApertura: e.target.value + ':00' } }))}
                                                        className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-slate-500 block mb-1">🕗 Hora Cierre</label>
                                                    <input type="time"
                                                        value={(ajustesOp[n.id]?.horaCierre ?? '20:00:00').substring(0, 5)}
                                                        onChange={e => setAjustesOp(prev => ({ ...prev, [n.id]: { ...prev[n.id], horaCierre: e.target.value + ':00' } }))}
                                                        className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400"
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <label className="text-xs font-bold text-slate-500 block mb-1">👥 Capacidad Máx.</label>
                                                    <input type="number" min="1"
                                                        value={ajustesOp[n.id]?.capacidadMaxima ?? 1}
                                                        onChange={e => setAjustesOp(prev => ({ ...prev, [n.id]: { ...prev[n.id], capacidadMaxima: e.target.value } }))}
                                                        className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-slate-500 block mb-1">⏱️ Duración Cita (min)</label>
                                                    <input type="number" min="5" step="5"
                                                        value={ajustesOp[n.id]?.duracionMinutosCita ?? 30}
                                                        onChange={e => setAjustesOp(prev => ({ ...prev, [n.id]: { ...prev[n.id], duracionMinutosCita: e.target.value } }))}
                                                        className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400"
                                                    />
                                                </div>
                                            </div>
                                            <label className="flex items-center gap-3 cursor-pointer text-sm font-bold text-slate-600 select-none">
                                                <input type="checkbox"
                                                    checked={ajustesOp[n.id]?.usaMesas ?? false}
                                                    onChange={e => setAjustesOp(prev => ({ ...prev, [n.id]: { ...prev[n.id], usaMesas: e.target.checked } }))}
                                                    className="w-4 h-4 rounded"
                                                />
                                                🪑 Maneja Mesas
                                            </label>
                                        </div>
                                    </div>

                                    {/* Columna C: WhatsApp Panel */}
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
