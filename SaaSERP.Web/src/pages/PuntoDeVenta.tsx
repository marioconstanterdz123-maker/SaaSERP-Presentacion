import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axiosInstance from '../api/axiosConfig';
import { ShoppingCart, Plus, Minus, Trash2, Send, Coffee, CheckCircle, Navigation, LayoutGrid, ChevronDown, ChevronUp, DollarSign } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Servicio {
    id: number;
    nombre: string;
    duracionMinutos: number;
    precio: number;
    activo: boolean;
}

interface CartItem {
    servicioId: number;
    nombre: string;
    precio: number;
    cantidad: number;
    notasOpcionales: string;
}

interface ComandaActiva {
    id: number;
    nombreCliente: string;
    identificadorMesa: string;
    tipoAtencion: string;
    total: number;
    estado: string;
    fechaCreacion: string;
    detalles?: any[];
}

const ESTADO_COLORS: Record<string, string> = {
    'Recibida': 'bg-yellow-100 text-yellow-800 border-yellow-300',
    'En Preparacion': 'bg-amber-100 text-amber-800 border-amber-300',
    'Lista': 'bg-emerald-100 text-emerald-800 border-emerald-300',
    'Entregada': 'bg-blue-100 text-blue-800 border-blue-300',
    'Cobrada': 'bg-slate-100 text-slate-500 border-slate-300',
};

const PuntoDeVenta: React.FC = () => {
    const { negocioId } = useParams();
    const { user } = useAuth();
    const [servicios, setServicios] = useState<Servicio[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [identificadorMesa, setIdentificadorMesa] = useState('');
    const [telefonoCliente, setTelefonoCliente] = useState('');
    const [tipoAtencionPos, setTipoAtencionPos] = useState<'Mesa' | 'Llevar' | 'Mostrador'>('Mesa');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    // Mesa selector state
    const [negocio, setNegocio] = useState<any>(null);
    const [mesas, setMesas] = useState<any[]>([]);
    const [mesaSeleccionada, setMesaSeleccionada] = useState<string>('');

    // Active orders state
    const [comandasActivas, setComandasActivas] = useState<ComandaActiva[]>([]);
    const [showOrders, setShowOrders] = useState(true);

    useEffect(() => {
        const isAdmin = user?.rol === 'SuperAdmin' || user?.rol === 'AdminNegocio';
        const cargarNegocio = async () => {
            try {
                let negocioData: any = null;
                if (isAdmin) {
                    // Admins pueden listar todos
                    const res = await axiosInstance.get('/negocios');
                    negocioData = res.data.find((n: any) => n.id.toString() === negocioId);
                } else {
                    // Meseros/Cajeros/Cocineros: solo su negocio
                    const res = await axiosInstance.get('/negocios/mio');
                    negocioData = res.data;
                }
                if (negocioData) {
                    setNegocio(negocioData);
                    if (negocioData.usaMesas) {
                        axiosInstance.get(`/Recursos/negocio/${negocioId}`).then(r => {
                            setMesas(r.data);
                        }).catch(() => {});
                    } else {
                        setTipoAtencionPos('Mostrador');
                    }
                }
            } catch (err) {
                console.error('Error cargando negocio:', err);
            }
        };
        cargarNegocio();

        // Fetch products
        axiosInstance.get(`/Servicios/negocio/${negocioId}`)
            .then(res => setServicios(res.data.filter((s: Servicio) => s.activo)))
            .finally(() => setIsLoading(false));

        // Fetch active orders
        fetchComandasActivas();
        const intervalId = setInterval(fetchComandasActivas, 15000);
        return () => clearInterval(intervalId);
    }, [negocioId, user?.rol]);

    const fetchComandasActivas = async () => {
        try {
            const { data } = await axiosInstance.get('/Comandas/activas', {
                headers: { 'X-Negocio-Id': negocioId }
            });
            setComandasActivas(data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddToCart = (servicio: Servicio) => {
        setCart(prev => {
            const existingIndex = prev.findIndex(item => item.servicioId === servicio.id && item.notasOpcionales === '');
            if (existingIndex >= 0) {
                const newCart = [...prev];
                newCart[existingIndex] = { ...newCart[existingIndex], cantidad: newCart[existingIndex].cantidad + 1 };
                return newCart;
            }
            return [...prev, {
                servicioId: servicio.id,
                nombre: servicio.nombre,
                precio: servicio.precio,
                cantidad: 1,
                notasOpcionales: ''
            }];
        });
    };

    const updateQuantity = (index: number, delta: number) => {
        setCart(prev => {
            const newCart = [...prev];
            const newQty = newCart[index].cantidad + delta;
            if (newQty <= 0) {
                newCart.splice(index, 1);
            } else {
                newCart[index] = { ...newCart[index], cantidad: newQty };
            }
            return newCart;
        });
    };

    const updateNotes = (index: number, val: string) => {
        setCart(prev => {
            const newCart = [...prev];
            newCart[index] = { ...newCart[index], notasOpcionales: val };
            return newCart;
        });
    };

    const total = cart.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);

    const handleSelectMesa = (mesa: any) => {
        setMesaSeleccionada(mesa.nombre);
        setIdentificadorMesa(mesa.nombre);
    };

    const handleCobrar = async (comandaId: number) => {
        try {
            await axiosInstance.put(`/Comandas/${comandaId}/estado`, { nuevoEstado: 'Cobrada' }, {
                headers: { 'X-Negocio-Id': negocioId }
            });
            fetchComandasActivas();
        } catch (err) {
            console.error(err);
        }
    };

    const handleSubmit = async () => {
        if (cart.length === 0) return alert('El carrito está vacío.');
        const mesaFinal = tipoAtencionPos === 'Mesa' ? mesaSeleccionada : identificadorMesa;
        if (!mesaFinal.trim()) return alert('Por favor, indica la Mesa o el Nombre del Cliente.');

        setIsSubmitting(true);
        try {
            const numeroLimpiado = telefonoCliente.replace(/\D/g, '');
            const numeroWaFinal = numeroLimpiado.length === 10 ? `521${numeroLimpiado}` : numeroLimpiado;

            const payload = {
                telefonoCliente: numeroWaFinal,
                nombreCliente: mesaFinal,
                identificadorMesa: mesaFinal,
                tipoAtencion: tipoAtencionPos === 'Mesa' ? 'Mesas' : tipoAtencionPos,
                total: total,
                detalles: cart.map(item => ({
                    servicioId: item.servicioId,
                    cantidad: item.cantidad,
                    subtotal: item.precio * item.cantidad,
                    notasOpcionales: item.notasOpcionales
                }))
            };

            await axiosInstance.post('/Comandas', payload, {
                headers: { 'X-Negocio-Id': negocioId }
            });
            setSuccessMsg(`¡Comanda para ${mesaFinal} enviada a cocina!`);
            setCart([]);
            setIdentificadorMesa('');
            setTelefonoCliente('');
            setMesaSeleccionada('');
            fetchComandasActivas();
            setTimeout(() => setSuccessMsg(''), 4000);
        } catch (e: any) {
            console.log("=== DETALLE DEL ERROR 500 ===");
            console.dir(e.response?.data);
            alert('Error en el Servidor:\n' + JSON.stringify(e.response?.data?.error || e.message));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-[70vh]">
                <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    const productosActivos = servicios.filter(s => s.activo);

    return (
        <div className="flex flex-col lg:flex-row gap-4 lg:h-[calc(100vh-5rem)] min-h-[calc(100vh-5rem)] animate-fade-in-up p-2 pb-24 lg:pb-2">
            
            {/* IZQUIERDA: Catálogo + Órdenes Activas */}
            <div className="flex-1 flex flex-col gap-4 overflow-visible lg:overflow-hidden">
                
                {/* Selector de Mesas (si aplica) */}
                {negocio?.usaMesas && mesas.length > 0 && (
                    <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white p-4 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <LayoutGrid size={16} className="text-indigo-600" /> Seleccionar Mesa
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {mesas.map(m => (
                                <button
                                    key={m.id}
                                    onClick={() => handleSelectMesa(m)}
                                    className={`px-4 py-2 rounded-xl font-bold text-sm transition-all border ${
                                        mesaSeleccionada === m.nombre 
                                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/30 scale-105' 
                                            : 'bg-white text-slate-700 border-slate-200 hover:bg-indigo-50 hover:border-indigo-300'
                                    }`}
                                >
                                    🍽️ {m.nombre}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Catálogo de Productos */}
                <div className="flex-1 bg-white/60 backdrop-blur-xl rounded-2xl border border-white p-4 shadow-sm overflow-visible lg:overflow-y-auto min-h-[50vh] lg:min-h-0">
                    <h2 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-2">
                        <Coffee className="text-indigo-600" size={20} /> Menú de Productos
                    </h2>

                    {productosActivos.length === 0 ? (
                        <div className="text-center py-16 text-slate-400">
                            <Navigation size={40} className="mx-auto mb-4 opacity-30" />
                            <p className="font-medium">No hay productos registrados o activos.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3">
                            {productosActivos.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => handleAddToCart(p)}
                                    className="bg-white hover:bg-indigo-50 border border-slate-200 p-3 rounded-xl shadow-sm hover:shadow-md transition-all text-left flex flex-col justify-between h-28 w-full group overflow-hidden active:scale-95"
                                >
                                    <span className="font-bold text-slate-700 text-xs leading-snug group-hover:text-indigo-700 line-clamp-3">{p.nombre}</span>
                                    <span className="text-base font-black text-indigo-600 mt-1">${p.precio.toFixed(2)}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Panel de Órdenes Activas (colapsable) */}
                {/* El Mesero solo ve sus pedidos "En Proceso". El cajero/admin ve TODAS para poder cobrar. */}
                <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white shadow-sm">
                    <button 
                        onClick={() => setShowOrders(!showOrders)}
                        className="w-full flex items-center justify-between p-4 text-left"
                    >
                        <h3 className="text-sm font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                            📋 {user?.rol === 'Mesero' ? 'Mis Pedidos en Curso' : 'Órdenes Activas'}
                            <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs font-bold">
                                {user?.rol === 'Mesero'
                                    ? comandasActivas.filter(c => c.estado === 'Recibida' || c.estado === 'En Preparacion').length
                                    : comandasActivas.length}
                            </span>
                        </h3>
                        {showOrders ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                    </button>
                    
                    {showOrders && (
                        <div className="px-4 pb-4 max-h-52 overflow-y-auto">
                            {(() => {
                                const lista = user?.rol === 'Mesero'
                                    ? comandasActivas.filter(c => c.estado === 'Recibida' || c.estado === 'En Preparacion')
                                    : comandasActivas;
                                if (lista.length === 0) return <p className="text-sm text-slate-400 text-center py-4">Sin órdenes activas</p>;
                                return (
                                <div className="space-y-2">
                                    {lista.map(c => (
                                        <div key={c.id} className="flex flex-col bg-white rounded-xl border border-slate-100 shadow-sm mb-2">
                                            <div className="flex items-center justify-between p-3">
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-slate-800 text-sm truncate">{c.identificadorMesa || c.nombreCliente}</p>
                                                        <p className="text-xs text-slate-400">{new Date(c.fechaCreacion).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold border whitespace-nowrap ${ESTADO_COLORS[c.estado] || 'bg-slate-100 text-slate-500'}`}>
                                                        {c.estado}
                                                    </span>
                                                    <span className="font-black text-slate-700 text-sm ml-3">${c.total.toFixed(2)}</span>
                                                    {(c.estado === 'Entregada' || c.estado === 'Lista') && (user?.rol === 'Cajero' || user?.rol === 'AdminNegocio' || user?.rol === 'SuperAdmin') && (
                                                        <button 
                                                            onClick={() => handleCobrar(c.id)}
                                                            className="ml-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 active:scale-95"
                                                        >
                                                            <DollarSign size={12} /> Cobrar
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            {/* Nested Details List */}
                                            {c.detalles && c.detalles.length > 0 && (
                                                <div className="bg-slate-50 border-t border-slate-100 rounded-b-xl px-4 py-2 text-xs">
                                                    {c.detalles.map((d: any, i: number) => (
                                                        <div key={i} className="flex justify-between border-b border-dashed border-slate-200 last:border-0 py-1">
                                                            <div>
                                                                <span className="font-bold text-slate-600">{d.cantidad}x </span>
                                                                <span className="text-slate-500">{d.nombreProducto || d.nombreServicio || `Ref #${d.servicioId}`}</span>
                                                                {d.notasOpcionales && (
                                                                    <span className="text-red-500 font-bold ml-2">⚠️ {d.notasOpcionales}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                );
                            })()}
                        </div>
                    )}
                </div>
            </div>{/* FIN columna izquierda */}

            {/* DERECHA: Carrito y Completar Orden */}
            <div className="w-full lg:w-96 flex flex-col bg-slate-800 rounded-3xl overflow-hidden shadow-2xl relative min-h-[500px] lg:min-h-0">
                {/* Header Ticket */}
                <div className="bg-slate-800 p-4 text-white">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-base font-black flex items-center gap-2">
                            <ShoppingCart size={18} className="text-indigo-400" /> Ticket
                        </h3>
                        <div className="flex rounded-lg overflow-hidden border border-slate-600">
                            {negocio?.usaMesas && (
                                <button onClick={() => setTipoAtencionPos('Mesa')} className={`px-2 py-1 text-xs font-bold transition-colors ${tipoAtencionPos === 'Mesa' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
                                    Mesa
                                </button>
                            )}
                            <button onClick={() => setTipoAtencionPos('Mostrador')} className={`px-2 py-1 text-xs font-bold transition-colors ${tipoAtencionPos === 'Mostrador' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
                                Local
                            </button>
                            <button onClick={() => setTipoAtencionPos('Llevar')} className={`px-2 py-1 text-xs font-bold transition-colors ${tipoAtencionPos === 'Llevar' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
                                Llevar
                            </button>
                        </div>
                    </div>
                    {/* Mode dependent inputs */}
                    {tipoAtencionPos === 'Mesa' ? (
                        mesaSeleccionada ? (
                            <div className="flex items-center gap-2">
                                <span className="bg-indigo-500/30 border border-indigo-400/50 text-indigo-200 px-3 py-2 rounded-xl font-bold text-sm flex-1">
                                    🍽️ {mesaSeleccionada}
                                </span>
                                <button onClick={() => { setMesaSeleccionada(''); setIdentificadorMesa(''); }} className="text-xs text-slate-400 hover:text-white underline">
                                    Cambiar
                                </button>
                            </div>
                        ) : (
                            <p className="text-xs text-slate-400 italic">← Selecciona una mesa a la izquierda</p>
                        )
                    ) : (
                        <div className="flex flex-col gap-2">
                            <input
                                type="text"
                                placeholder={tipoAtencionPos === 'Llevar' ? "Nombre del Cliente (Para Llevar)" : "Nombre Cliente (Local)"}
                                value={identificadorMesa}
                                onChange={(e) => setIdentificadorMesa(e.target.value)}
                                className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 font-medium text-sm"
                            />
                            <input
                                type="tel"
                                placeholder="Teléfono celular (Aviso automático)"
                                value={telefonoCliente}
                                onChange={(e) => setTelefonoCliente(e.target.value)}
                                className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 font-medium text-sm"
                            />
                        </div>
                    )}
                </div>

                {/* Items */}
                <div className="flex-1 overflow-y-auto p-2 bg-slate-50/50">
                    {cart.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 p-6 text-center">
                            <ShoppingCart size={36} className="mb-3 opacity-20" />
                            <p className="text-xs font-medium">Toca los productos a la izquierda para agregarlos al ticket.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {cart.map((item, i) => (
                                <div key={i} className="bg-white border text-left p-3 rounded-xl shadow-sm border-slate-100 flex flex-col gap-1.5">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <p className="font-bold text-slate-800 text-sm leading-tight pr-2">{item.nombre}</p>
                                            <p className="text-xs font-semibold text-slate-400">${item.precio.toFixed(2)} c/u</p>
                                        </div>
                                        <div className="font-black text-indigo-600 text-sm">
                                            ${(item.precio * item.cantidad).toFixed(2)}
                                        </div>
                                    </div>
                                    
                                    <div className="flex justify-between items-center bg-slate-50 rounded-lg p-1.5 border border-slate-100">
                                        <div className="flex-1 mr-2">
                                            <input
                                                type="text"
                                                placeholder="Notas (ej: sin cebolla)"
                                                value={item.notasOpcionales}
                                                onChange={(e) => updateNotes(i, e.target.value)}
                                                className="w-full bg-transparent border-b border-dashed border-slate-300 px-1 py-1 text-xs text-slate-600 focus:outline-none focus:border-indigo-400 placeholder-slate-400"
                                            />
                                        </div>
                                        <div className="flex items-center gap-1.5 bg-white rounded-lg shadow-sm border border-slate-200 px-1">
                                            <button onClick={() => updateQuantity(i, -1)} className="p-1 hover:text-red-500 text-slate-400 transition-colors">
                                                {item.cantidad === 1 ? <Trash2 size={12} /> : <Minus size={12} />}
                                            </button>
                                            <span className="text-xs font-black w-4 text-center text-slate-700">{item.cantidad}</span>
                                            <button onClick={() => updateQuantity(i, 1)} className="p-1 hover:text-emerald-500 text-slate-400 transition-colors">
                                                <Plus size={12} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer Sumario */}
                <div className="bg-white p-4 border-t border-slate-200 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] z-10">
                    <div className="flex justify-between items-end mb-3">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total a Pagar</span>
                        <span className="text-2xl font-black text-slate-800">${total.toFixed(2)}</span>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={cart.length === 0 || isSubmitting}
                        className="w-full relative flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black py-3.5 rounded-xl shadow-lg shadow-indigo-500/30 transition-all active:scale-95 group overflow-hidden"
                    >
                        {isSubmitting ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /> 
                                CONFIRMAR COMANDA
                            </>
                        )}
                        <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shimmer" />
                    </button>
                </div>

                {/* Success Overlay */}
                {successMsg && (
                    <div className="absolute inset-0 bg-emerald-500/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center text-white p-6 text-center animate-fade-in">
                        <CheckCircle size={60} className="mb-4 animate-bounce" />
                        <h2 className="text-2xl font-black mb-2">¡Comanda Enviada!</h2>
                        <p className="font-medium text-emerald-100">{successMsg}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PuntoDeVenta;
