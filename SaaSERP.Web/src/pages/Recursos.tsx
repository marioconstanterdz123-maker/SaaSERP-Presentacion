import React, { useEffect, useState } from 'react';
import axiosInstance from '../api/axiosConfig';
import { Plus, CheckCircle2, XCircle, Users, Wifi, WifiOff, QrCode, Phone, ChevronDown } from 'lucide-react';
import { useParams } from 'react-router-dom';

interface Recurso {
    id?: number;
    negocioId: number;
    nombre: string;
    tipo: string;
    activo: boolean;
}

interface Trabajador {
    id: number;
    nombre: string;
    telefono: string | null;
    instanciaWhatsApp: string | null;
    activo: boolean;
}

const Recursos: React.FC = () => {
    const { negocioId } = useParams();
    const [recursos, setRecursos] = useState<Recurso[]>([]);
    const [trabajadores, setTrabajadores] = useState<Trabajador[]>([]);
    const [waStatus, setWaStatus] = useState<Record<number, boolean>>({});
    const [negocio, setNegocio] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [qrModal, setQrModal] = useState<{ id: number; qr: string } | null>(null);

    const [newRecurso, setNewRecurso] = useState<Recurso>({
        negocioId: Number(negocioId),
        nombre: '', tipo: '', activo: true
    });
    const [activarWA, setActivarWA] = useState(false);
    const [telefonoWA, setTelefonoWA] = useState('');

    useEffect(() => {
        axiosInstance.get('/negocios').then(res => {
            const current = res.data.find((n: any) => n.id.toString() === negocioId);
            if (current) {
                setNegocio(current);
                setNewRecurso(prev => ({
                    ...prev,
                    tipo: current.sistemaAsignado === 'TAQUERIA' || current.sistemaAsignado === 'RESTAURANTES' ? 'MESA' : 'COLABORADOR'
                }));
            }
        });
        fetchAll();
    }, [negocioId]);

    const fetchAll = async () => {
        try {
            const [rRecursos, rTrabajadores] = await Promise.all([
                axiosInstance.get(`/recursos/negocio/${negocioId}`),
                axiosInstance.get(`/Trabajadores/negocio/${negocioId}`).catch(() => ({ data: [] }))
            ]);
            setRecursos(rRecursos.data);
            const tList: Trabajador[] = rTrabajadores.data;
            setTrabajadores(tList);
            // Check WA status for connected workers
            tList.forEach(async (t) => {
                if (t.instanciaWhatsApp) {
                    try {
                        const s = await axiosInstance.get(`/WhatsApp/trabajador/${t.id}/estado`);
                        setWaStatus(prev => ({ ...prev, [t.id]: s.data.conectado }));
                    } catch { /* pass */ }
                }
            });
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axiosInstance.post('/recursos', newRecurso);
            if (activarWA && newRecurso.nombre) {
                await axiosInstance.post('/Trabajadores', {
                    negocioId: Number(negocioId),
                    nombre: newRecurso.nombre,
                    telefono: telefonoWA || null,
                });
            }
            setIsModalOpen(false);
            setActivarWA(false);
            setTelefonoWA('');
            fetchAll();
            setNewRecurso(prev => ({ ...prev, nombre: '' }));
        } catch (err) {
            console.error('Error creando recurso', err);
        }
    };

    const handleToggleEstado = async (r: Recurso) => {
        try {
            await axiosInstance.put(`/recursos/${r.id}`, { ...r, activo: !r.activo });
            fetchAll();
        } catch (err) {
            console.error(err);
        }
    };

    const crearInstanciaWA = async (t: Trabajador) => {
        await axiosInstance.post(`/WhatsApp/trabajador/${t.id}/crear`);
        fetchAll();
        mostrarQr(t.id);
    };

    const mostrarQr = async (id: number) => {
        const r = await axiosInstance.get(`/WhatsApp/trabajador/${id}/qr`);
        const base64 = r.data.base64 || r.data.qrcode?.base64 || '';
        setQrModal({ id, qr: base64 });
    };

    // Match recurso to trabajador by name (case-insensitive)
    const getTrabajador = (nombre: string) =>
        trabajadores.find(t => t.nombre.toLowerCase() === nombre.toLowerCase());

    const isMesas = negocio?.sistemaAsignado === 'TAQUERIA' || negocio?.sistemaAsignado === 'RESTAURANTES';
    const filtrados = recursos.filter(r => r.nombre.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="flex flex-col gap-4">
            {/* HEADER */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                    <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                        <Users className="text-blue-500 flex-shrink-0" size={22} />
                        {isMesas ? 'Disposición de Mesas' : 'Especialistas / Equipo'}
                    </h2>
                    <p className="text-slate-500 mt-0.5 text-sm">
                        {isMesas ? 'Administra las mesas del local.' : 'Personal operativo. Activa WhatsApp por trabajador para el módulo de IA.'}
                    </p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex-shrink-0 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold py-3 px-5 rounded-2xl shadow-lg shadow-blue-500/30 flex items-center gap-2 transition-transform active:scale-95"
                >
                    <Plus size={18} /> {isMesas ? 'Nueva Mesa' : 'Nuevo'}
                </button>
            </div>

            {/* SEARCH */}
            <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base">🔍</span>
                <input
                    type="search"
                    placeholder="Buscar..."
                    className="w-full bg-white border border-slate-200 text-sm font-medium pl-10 pr-4 py-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            {/* CONTENT */}
            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : filtrados.length === 0 ? (
                <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-12 text-center text-slate-400">
                    <Users size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="font-medium">{searchTerm ? 'Sin resultados.' : `Sin ${isMesas ? 'mesas' : 'colaboradores'} registrados.`}</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {filtrados.map(r => {
                        const trabajador = !isMesas ? getTrabajador(r.nombre) : undefined;
                        const isExpanded = expandedId === r.id;
                        const conectado = trabajador ? waStatus[trabajador.id] : false;

                        return (
                            <div
                                key={r.id}
                                className={`bg-white rounded-2xl border shadow-sm flex flex-col gap-3 transition-all hover:-translate-y-0.5 ${r.activo ? 'border-slate-100' : 'border-slate-100 opacity-60'}`}
                            >
                                <div className="p-4 flex flex-col gap-3">
                                    {/* Name + WA badge */}
                                    <div className="flex items-start justify-between gap-1">
                                        <div className="min-w-0">
                                            <p className="font-black text-slate-800 text-base leading-tight truncate">{r.nombre}</p>
                                            <span className="bg-blue-50 text-blue-600 text-[10px] font-black px-2 py-0.5 rounded-lg uppercase mt-1 inline-block tracking-wider">
                                                {r.tipo}
                                            </span>
                                        </div>
                                        {!isMesas && (
                                            <button
                                                onClick={() => setExpandedId(isExpanded ? null : (r.id ?? null))}
                                                className="p-1.5 rounded-xl text-slate-300 hover:text-blue-500 hover:bg-blue-50 transition-all flex-shrink-0"
                                            >
                                                <ChevronDown size={14} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                            </button>
                                        )}
                                    </div>

                                    {/* Status toggle */}
                                    <button
                                        onClick={() => handleToggleEstado(r)}
                                        className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 ${r.activo
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                            : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'
                                            }`}
                                    >
                                        {r.activo ? <><CheckCircle2 size={12} /> Disponible</> : <><XCircle size={12} /> Sin servicio</>}
                                    </button>
                                </div>

                                {/* WhatsApp section — expandable */}
                                {!isMesas && isExpanded && (
                                    <div className="border-t border-slate-50 px-4 pb-4 pt-3 space-y-2">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">WhatsApp IA</p>
                                        {!trabajador ? (
                                            <button
                                                onClick={() => crearInstanciaWA({ id: 0, nombre: r.nombre, telefono: null, instanciaWhatsApp: null, activo: true }).then(() => fetchAll())}
                                                className="w-full flex items-center justify-center gap-1 text-xs bg-green-600 text-white px-2 py-2 rounded-xl hover:bg-green-700 transition-colors font-medium"
                                            >
                                                <Wifi size={12} /> Activar WhatsApp
                                            </button>
                                        ) : (
                                            <div className="space-y-1.5">
                                                <div className={`flex items-center gap-1.5 text-xs px-2 py-1.5 rounded-lg font-medium ${conectado ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                                                    {conectado ? <Wifi size={11} /> : <WifiOff size={11} />}
                                                    {conectado ? 'Conectado' : 'Desconectado'}
                                                </div>
                                                <button
                                                    onClick={() => mostrarQr(trabajador.id)}
                                                    className="w-full flex items-center justify-center gap-1 text-xs bg-violet-100 text-violet-700 px-2 py-2 rounded-xl hover:bg-violet-200 transition-colors font-medium"
                                                >
                                                    <QrCode size={12} /> Ver QR
                                                </button>
                                                {trabajador.telefono && (
                                                    <p className="text-[10px] text-slate-400 flex items-center gap-1"><Phone size={9} />{trabajador.telefono}</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* MODAL crear */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-5 flex justify-between items-center text-white">
                            <h3 className="text-lg font-bold">{isMesas ? '🪑 Agregar Mesa' : '👤 Agregar Colaborador'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="hover:bg-white/20 p-2 rounded-full transition-colors">
                                <XCircle size={22} />
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                    {isMesas ? 'Número o Nombre' : 'Nombre del Colaborador'}
                                </label>
                                <input
                                    required
                                    type="text"
                                    placeholder={isMesas ? 'Ej. Mesa 1, Terraza A' : 'Ej. Carlos Martínez'}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700"
                                    value={newRecurso.nombre}
                                    onChange={e => setNewRecurso({ ...newRecurso, nombre: e.target.value })}
                                />
                            </div>
                            {!isMesas && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Rol / Clasificación</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700"
                                        value={newRecurso.tipo}
                                        onChange={e => setNewRecurso({ ...newRecurso, tipo: e.target.value.toUpperCase() })}
                                        placeholder="Ej. BARBERO, TATUADOR, ASESOR"
                                    />
                                </div>
                            )}

                            {/* Toggle WhatsApp IA */}
                            {!isMesas && (
                                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-3">
                                    <label className="flex items-center justify-between gap-3 cursor-pointer">
                                        <div>
                                            <p className="text-sm font-bold text-slate-700">Activar WhatsApp IA</p>
                                            <p className="text-xs text-slate-400">Habilita handoff y respuestas automáticas para esta persona</p>
                                        </div>
                                        <div
                                            onClick={() => setActivarWA(!activarWA)}
                                            className={`w-11 h-6 rounded-full transition-colors flex-shrink-0 flex items-center px-1 ${activarWA ? 'bg-green-500' : 'bg-slate-300'}`}
                                        >
                                            <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${activarWA ? 'translate-x-5' : 'translate-x-0'}`} />
                                        </div>
                                    </label>
                                    {activarWA && (
                                        <input
                                            type="tel"
                                            placeholder="Teléfono (ej. 521234567890)"
                                            value={telefonoWA}
                                            onChange={e => setTelefonoWA(e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                                        />
                                    )}
                                </div>
                            )}

                            <button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-95">
                                Registrar
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* QR Modal */}
            {qrModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setQrModal(null)}>
                    <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-xs text-center space-y-4" onClick={e => e.stopPropagation()}>
                        <h2 className="font-bold text-slate-800">Escanea el QR</h2>
                        <p className="text-xs text-slate-500">WhatsApp → Dispositivos vinculados → Vincular dispositivo</p>
                        {qrModal.qr
                            ? <img src={qrModal.qr} alt="QR WhatsApp" className="mx-auto rounded-xl w-48 h-48 object-contain" />
                            : <p className="text-xs text-amber-600">Generando QR... espera 5s y vuelve a intentar.</p>
                        }
                        <button onClick={() => setQrModal(null)} className="w-full border border-slate-200 rounded-xl py-2 text-sm text-slate-600">Cerrar</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Recursos;
