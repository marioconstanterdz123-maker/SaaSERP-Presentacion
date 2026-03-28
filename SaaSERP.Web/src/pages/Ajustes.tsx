import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axiosInstance from '../api/axiosConfig';
import {
    Settings, Save, Clock, Phone, Store, Users, MapPin, CheckCircle,
    MessageSquare, ChevronDown, ChevronUp, Printer, FileText, DollarSign
} from 'lucide-react';
import WhatsAppPanel from '../components/WhatsAppPanel';
import { useAuth } from '../context/AuthContext';
import TarifasParqueaderoPanel from '../components/TarifasParqueaderoPanel';
import DeliveryIntegrationsPanel from '../components/DeliveryIntegrationsPanel';
import PrinterManager from '../components/PrinterManager';
import { TICKET_CONFIG_KEY, defaultTicketConfig } from '../types/ticketConfig';
import type { TicketConfig } from '../types/ticketConfig';

const Ajustes: React.FC = () => {
    const { user } = useAuth();
    const { negocioId } = useParams();
    const [negocio, setNegocio] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    // Editable fields
    const [nombre, setNombre] = useState('');
    const [telefono, setTelefono] = useState('');
    const [horaApertura, setHoraApertura] = useState('');
    const [horaCierre, setHoraCierre] = useState('');
    const [capacidad, setCapacidad] = useState(0);
    const [duracionCita, setDuracionCita] = useState(30);
    const [usaMesas, setUsaMesas] = useState(false);
    const [mpToken, setMpToken] = useState('');

    // Feature flags (SuperAdmin only)
    const [moduloWhatsAppIA, setModuloWhatsAppIA] = useState(false);
    const [moduloCRM, setModuloCRM] = useState(false);

    // Collapsible sections
    const [showPrinters, setShowPrinters] = useState(false);
    const [showTicketConfig, setShowTicketConfig] = useState(false);

    // Ticket configuration (Issue 5)
    const [ticketConfig, setTicketConfig] = useState<TicketConfig | null>(null);

    useEffect(() => {
        axiosInstance.get('/negocios').then(res => {
            const current = res.data.find((n: any) => n.id.toString() === negocioId);
            if (current) {
                setNegocio(current);
                setNombre(current.nombre || '');
                setTelefono(current.telefonoWhatsApp || '');
                setHoraApertura(current.horaApertura || '08:00');
                setHoraCierre(current.horaCierre || '20:00');
                setCapacidad(current.capacidadMaxima || 0);
                setDuracionCita(current.duracionMinutosCita || 30);
                setUsaMesas(current.usaMesas || false);
                setMpToken(current.mercadoPagoAccessToken || '');
                setModuloWhatsAppIA(current.moduloWhatsAppIA || false);
                setModuloCRM(current.moduloCRM || false);

                // Cargar config de ticket desde localStorage, pre-poblando del negocio
                const configKey = TICKET_CONFIG_KEY(current.id.toString());
                const raw = localStorage.getItem(configKey);
                setTicketConfig(raw ? JSON.parse(raw) : defaultTicketConfig(current));
            }
        }).finally(() => setIsLoading(false));
    }, [negocioId]);

    const handleSave = async () => {
        if (!negocio) return;
        setIsSaving(true);
        try {
            await axiosInstance.put(`/Negocios/${negocio.id}`, {
                ...negocio,
                nombre,
                telefonoWhatsApp: telefono,
                horaApertura,
                horaCierre,
                capacidadMaxima: capacidad,
                duracionMinutosCita: duracionCita,
                usaMesas,
                mercadoPagoAccessToken: mpToken,
                moduloWhatsAppIA,
                moduloCRM,
            });
            setSuccessMsg('¡Cambios guardados exitosamente!');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
            alert('Error al guardar cambios.');
        } finally {
            setIsSaving(false);
        }
    };


    // Auto-guardar ticket config en localStorage al salir de cada campo
    const saveTicketConfig = (updated: TicketConfig) => {
        if (!negocio) return;
        const key = TICKET_CONFIG_KEY(negocio.id.toString());
        localStorage.setItem(key, JSON.stringify(updated));
        setTicketConfig(updated);
    };

    const updateTicket = (field: keyof TicketConfig, value: any) => {
        if (!ticketConfig) return;
        saveTicketConfig({ ...ticketConfig, [field]: value });
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-[70vh]">
                <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!negocio) return <p className="p-8 text-slate-500">Negocio no encontrado.</p>;

    const isCitas = negocio.sistemaAsignado === 'CITAS';
    const isRestaurante = negocio.sistemaAsignado === 'TAQUERIA' || negocio.sistemaAsignado === 'RESTAURANTES';

    const inputCls = "w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent";

    return (
        <div className="p-6 max-w-3xl mx-auto animate-fade-in-up">
            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center">
                    <Settings size={24} className="text-indigo-600" />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-slate-800">Ajustes del Negocio</h1>
                    <p className="text-sm text-slate-500">Edita la configuración general de tu sucursal.</p>
                </div>
            </div>

            {/* Success Toast */}
            {successMsg && (
                <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl flex items-center gap-2 animate-fade-in">
                    <CheckCircle size={18} /> <span className="font-bold text-sm">{successMsg}</span>
                </div>
            )}

            {/* Card: Info General */}
            <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white shadow-sm p-6 mb-6">
                <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Store size={16} className="text-indigo-600" /> Información General
                </h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Nombre del Negocio</label>
                        <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} className={inputCls} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider flex items-center gap-1">
                            <Phone size={12} /> WhatsApp del Negocio
                        </label>
                        <input type="text" value={telefono} onChange={e => setTelefono(e.target.value)} placeholder="Ej. 5212345678" className={inputCls} />
                    </div>
                </div>
            </div>

            {/* Card: Horarios */}
            <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white shadow-sm p-6 mb-6">
                <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Clock size={16} className="text-indigo-600" /> Horarios de Operación
                </h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Hora Apertura</label>
                        <input type="time" value={horaApertura} onChange={e => setHoraApertura(e.target.value)} className={inputCls} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Hora Cierre</label>
                        <input type="time" value={horaCierre} onChange={e => setHoraCierre(e.target.value)} className={inputCls} />
                    </div>
                </div>
            </div>

            {/* Card: Configuración Específica */}
            <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white shadow-sm p-6 mb-6">
                <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <MapPin size={16} className="text-indigo-600" /> Configuración del Giro
                </h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between bg-slate-50 rounded-xl p-4 border border-slate-100">
                        <div>
                            <p className="font-bold text-slate-700 text-sm">Sistema Asignado</p>
                            <p className="text-xs text-slate-400">Determinado por el SuperAdmin</p>
                        </div>
                        <span className="px-3 py-1.5 bg-indigo-100 text-indigo-700 font-black text-xs rounded-full uppercase">{negocio.sistemaAsignado}</span>
                    </div>

                    {isCitas && (
                        <>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider flex items-center gap-1">
                                    <Users size={12} /> Capacidad Máxima (sillas/espacios)
                                </label>
                                <input type="number" value={capacidad} onChange={e => setCapacidad(e.target.value === '' ? '' as any : parseInt(e.target.value))} className={inputCls} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Duración de Cita (minutos)</label>
                                <input type="number" value={duracionCita} onChange={e => setDuracionCita(e.target.value === '' ? '' as any : parseInt(e.target.value))} className={inputCls} />
                            </div>
                        </>
                    )}

                    {isRestaurante && (
                        <div className="flex items-center justify-between bg-slate-50 rounded-xl p-4 border border-slate-100">
                            <div>
                                <p className="font-bold text-slate-700 text-sm">¿Maneja Mesas o Puntos Físicos?</p>
                                <p className="text-xs text-slate-400">Habilita el control visual de Puntos de Atención</p>
                            </div>
                            <button
                                onClick={() => setUsaMesas(!usaMesas)}
                                className={`w-12 h-7 rounded-full transition-colors relative ${usaMesas ? 'bg-indigo-600' : 'bg-slate-300'}`}
                            >
                                <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${usaMesas ? 'translate-x-5' : 'translate-x-0.5'}`} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* ─── IMPRESORAS DE CALOR (Issue 4) ─── */}
            {(isRestaurante || true) && (
                <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white shadow-sm mb-6 overflow-hidden">
                    <button
                        onClick={() => setShowPrinters(!showPrinters)}
                        className="w-full flex items-center justify-between p-6 text-left"
                    >
                        <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Printer size={16} className="text-indigo-600" /> 🖨️ Impresoras de Calor
                        </h3>
                        {showPrinters ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                    </button>
                    {showPrinters && (
                        <div className="px-6 pb-6">
                            <p className="text-xs text-slate-500 mb-4">Conecta impresoras térmicas por USB o Bluetooth (SPP) para imprimir tickets desde el POS.</p>
                            <PrinterManager negocioId={negocio.id.toString()} negocio={negocio} />
                        </div>
                    )}
                </div>
            )}

            {/* ─── CONFIGURACIÓN DE TICKET (Issue 5) ─── */}
            {ticketConfig && (
                <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white shadow-sm mb-6 overflow-hidden">
                    <button
                        onClick={() => setShowTicketConfig(!showTicketConfig)}
                        className="w-full flex items-center justify-between p-6 text-left"
                    >
                        <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <FileText size={16} className="text-indigo-600" /> 🧾 Configuración de Ticket
                        </h3>
                        {showTicketConfig ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                    </button>
                    {showTicketConfig && (
                        <div className="px-6 pb-6 space-y-4">
                            <p className="text-xs text-slate-500">Los cambios se guardan automáticamente. Se aplican en el próximo ticket impreso.</p>

                            {[
                                { label: 'Nombre del Negocio en Ticket', key: 'nombreNegocio', placeholder: 'Ej. Tacos El Güero' },
                                { label: 'Dirección', key: 'direccion', placeholder: 'Ej. Calle Principal #123, Ciudad' },
                                { label: 'RFC / NIT', key: 'rfc', placeholder: 'Ej. XAXX010101000' },
                                { label: 'Teléfono en Ticket', key: 'telefono', placeholder: 'Ej. 55 1234 5678' },
                                { label: 'Mensaje Footer Línea 1', key: 'footerLinea1', placeholder: '¡Gracias por su visita!' },
                                { label: 'Mensaje Footer Línea 2', key: 'footerLinea2', placeholder: 'Vuelve pronto' },
                            ].map(({ label, key, placeholder }) => (
                                <div key={key}>
                                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">{label}</label>
                                    <input
                                        type="text"
                                        value={(ticketConfig as any)[key]}
                                        onChange={e => updateTicket(key as keyof TicketConfig, e.target.value)}
                                        onBlur={e => updateTicket(key as keyof TicketConfig, e.target.value)}
                                        placeholder={placeholder}
                                        className={inputCls}
                                    />
                                </div>
                            ))}

                            {/* IVA toggle */}
                            <div className="flex items-center justify-between bg-slate-50 rounded-xl p-4 border border-slate-100">
                                <div>
                                    <p className="font-bold text-slate-700 text-sm">Mostrar IVA en Ticket</p>
                                    <p className="text-xs text-slate-400">Desglosará subtotal + IVA + total</p>
                                </div>
                                <button
                                    onClick={() => updateTicket('mostrarIva', !ticketConfig.mostrarIva)}
                                    className={`w-12 h-7 rounded-full transition-colors relative ${ticketConfig.mostrarIva ? 'bg-indigo-600' : 'bg-slate-300'}`}
                                >
                                    <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${ticketConfig.mostrarIva ? 'translate-x-5' : 'translate-x-0.5'}`} />
                                </button>
                            </div>

                            {ticketConfig.mostrarIva && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider flex items-center gap-1">
                                            <DollarSign size={12} /> Tasa IVA (%)
                                        </label>
                                        <input
                                            type="number"
                                            min={0} max={100}
                                            value={ticketConfig.tasaIva}
                                            onChange={e => updateTicket('tasaIva', parseFloat(e.target.value) || 0)}
                                            className={inputCls}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Moneda (símbolo)</label>
                                        <input
                                            type="text"
                                            maxLength={3}
                                            value={ticketConfig.moneda}
                                            onChange={e => updateTicket('moneda', e.target.value)}
                                            placeholder="$"
                                            className={inputCls}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ─── MÓDULOS AVANZADOS (SuperAdmin) ─── */}
            {user?.rol === 'SuperAdmin' && (
                <div className="bg-gradient-to-br from-violet-50 to-indigo-50 backdrop-blur-xl rounded-2xl border border-violet-100 shadow-sm p-6 mb-6">
                    <h3 className="text-sm font-black text-violet-700 uppercase tracking-widest mb-1 flex items-center gap-2">
                        ⚙️ Módulos Avanzados
                    </h3>
                    <p className="text-xs text-slate-500 mb-4">Solo visible para SuperAdmin. Activa funcionalidades premium por negocio.</p>
                    <div className="space-y-3">
                        {/* WhatsApp IA */}
                        <div className="flex items-center justify-between bg-white/80 rounded-xl p-4 border border-violet-100">
                            <div>
                                <p className="font-bold text-slate-700 text-sm">📱 WhatsApp IA por Trabajador</p>
                                <p className="text-xs text-slate-400">Instancias individuales, handoff humano, silencio automático</p>
                            </div>
                            <button
                                onClick={() => setModuloWhatsAppIA(!moduloWhatsAppIA)}
                                className={`w-12 h-7 rounded-full transition-colors relative flex-shrink-0 ${moduloWhatsAppIA ? 'bg-violet-600' : 'bg-slate-300'}`}
                            >
                                <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${moduloWhatsAppIA ? 'translate-x-5' : 'translate-x-0.5'}`} />
                            </button>
                        </div>
                        {/* CRM */}
                        <div className="flex items-center justify-between bg-white/80 rounded-xl p-4 border border-violet-100">
                            <div>
                                <p className="font-bold text-slate-700 text-sm">⭐ CRM + Lealtad de Clientes</p>
                                <p className="text-xs text-slate-400">Perfiles de clientes, historial de visitas, reglas de bonificación</p>
                            </div>
                            <button
                                onClick={() => setModuloCRM(!moduloCRM)}
                                className={`w-12 h-7 rounded-full transition-colors relative flex-shrink-0 ${moduloCRM ? 'bg-amber-500' : 'bg-slate-300'}`}
                            >
                                <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${moduloCRM ? 'translate-x-5' : 'translate-x-0.5'}`} />
                            </button>
                        </div>
                    </div>
                    <p className="text-xs text-violet-500 mt-3">💾 Recuerda guardar para aplicar los cambios.</p>
                </div>
            )}

            {/* Integration Card: WhatsApp */}
            {negocio && (user?.rol === 'SuperAdmin' || user?.rol === 'Admin') && (
                <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white shadow-sm p-6 mb-6">
                    <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <MessageSquare size={16} className="text-indigo-600" /> Integración de WhatsApp
                    </h3>
                    <p className="text-xs text-slate-500 mb-4">Escanea el código QR con tu WhatsApp corporativo para conectar este negocio a EvolutionAPI.</p>
                    <WhatsAppPanel negocioId={negocio.id} negocioNombre={negocio.nombre} />
                </div>
            )}

            {/* Delivery Integrations */}
            {negocio && isRestaurante && (user?.rol === 'SuperAdmin' || user?.rol === 'Admin') && (
                <DeliveryIntegrationsPanel negocioId={negocio.id.toString()} />
            )}

            {/* Parking Tariffs */}
            {negocio && negocio.sistemaAsignado === 'PARQUEADERO' && (user?.rol === 'SuperAdmin' || user?.rol === 'Admin') && (
                <TarifasParqueaderoPanel negocioId={negocio.id.toString()} />
            )}

            {/* Save Button */}
            <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black py-4 rounded-2xl shadow-lg shadow-indigo-500/30 transition-all active:scale-95 flex items-center justify-center gap-2 text-lg"
            >
                {isSaving ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                    <><Save size={20} /> Guardar Cambios</>
                )}
            </button>
        </div>
    );
};

export default Ajustes;
