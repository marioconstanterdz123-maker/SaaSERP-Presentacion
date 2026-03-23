import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axiosInstance from '../api/axiosConfig';
import { Settings, Save, Clock, Phone, Store, Users, MapPin, CheckCircle, MessageSquare, DollarSign } from 'lucide-react';
import WhatsAppPanel from '../components/WhatsAppPanel';
import { useAuth } from '../context/AuthContext';
import TarifasParqueaderoPanel from '../components/TarifasParqueaderoPanel';
import DeliveryIntegrationsPanel from '../components/DeliveryIntegrationsPanel';

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
                mercadoPagoAccessToken: mpToken
            });
            setSuccessMsg('¡Cambios guardados exitosamente!');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
            alert('Error al guardar cambios.');
        } finally {
            setIsSaving(false);
        }
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
                        <input
                            type="text"
                            value={nombre}
                            onChange={e => setNombre(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider flex items-center gap-1">
                            <Phone size={12} /> WhatsApp del Negocio
                        </label>
                        <input
                            type="text"
                            value={telefono}
                            onChange={e => setTelefono(e.target.value)}
                            placeholder="Ej. 5212345678"
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                        />
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
                        <input
                            type="time"
                            value={horaApertura}
                            onChange={e => setHoraApertura(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Hora Cierre</label>
                        <input
                            type="time"
                            value={horaCierre}
                            onChange={e => setHoraCierre(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        />
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
                                <input
                                    type="number"
                                    value={capacidad}
                                    onChange={e => setCapacidad(parseInt(e.target.value) || 0)}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Duración de Cita (minutos)</label>
                                <input
                                    type="number"
                                    value={duracionCita}
                                    onChange={e => setDuracionCita(parseInt(e.target.value) || 30)}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                />
                            </div>
                        </>
                    )}

                    {isRestaurante && (
                        <div className="flex items-center justify-between bg-slate-50 rounded-xl p-4 border border-slate-100">
                            <div>
                                <p className="font-bold text-slate-700 text-sm">¿Maneja Mesas o Puntos Físicos?</p>
                                <p className="text-xs text-slate-400">Habilita el control visual de Puntos de Atención (Mesas, Cajones, etc)</p>
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

            {/* MercadoPago Config (Desactivado temporalmente - El cliente requiere integraciones de terminales físicas despúes)
            <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white shadow-sm p-6 mb-6">
                <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <DollarSign size={16} className="text-blue-500" /> Pasarela de Pagos (MercadoPago)
                </h3>
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Access Token de Producción</label>
                    <input
                        type="password"
                        value={mpToken}
                        onChange={e => setMpToken(e.target.value)}
                        placeholder="APP_USR-..."
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    <p className="text-xs text-slate-500 mt-2">Crea tus credenciales de Producción en el <a href="https://www.mercadopago.com.mx/developers/panel/app" target="_blank" rel="noreferrer" className="text-blue-500 underline">Panel de Developers</a> y pega aquí el Access Token.</p>
                </div>
            </div>
            */}

            {/* Integration Card: WhatsApp EvolutionAPI (Visible by Dueño y SuperAdmin solo) */}
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
                    <>
                        <Save size={20} /> Guardar Cambios
                    </>
                )}
            </button>
        </div>
    );
};

export default Ajustes;
