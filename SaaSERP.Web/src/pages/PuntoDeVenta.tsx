import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axiosInstance from '../api/axiosConfig';
import { ShoppingCart, Plus, Minus, Trash2, Send, Coffee, CheckCircle, Navigation } from 'lucide-react';

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

const PuntoDeVenta: React.FC = () => {
    const { negocioId } = useParams();
    const [servicios, setServicios] = useState<Servicio[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [identificadorMesa, setIdentificadorMesa] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        axiosInstance.get(`/Servicios/negocio/${negocioId}`)
            .then(res => setServicios(res.data))
            .finally(() => setIsLoading(false));
    }, [negocioId]);

    const handleAddToCart = (servicio: Servicio) => {
        setCart(prev => {
            // Find if item already exists WITHOUT notes (so they stack by default)
            const existingIndex = prev.findIndex(item => item.servicioId === servicio.id && item.notasOpcionales === '');
            if (existingIndex >= 0) {
                const newCart = [...prev];
                newCart[existingIndex].cantidad += 1;
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
                newCart[index].cantidad = newQty;
            }
            return newCart;
        });
    };

    const updateNotes = (index: number, val: string) => {
        setCart(prev => {
            const newCart = [...prev];
            newCart[index].notasOpcionales = val;
            return newCart;
        });
    };

    const removeLine = (index: number) => {
        setCart(prev => prev.filter((_, i) => i !== index));
    };

    const total = cart.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);

    const handleSubmit = async () => {
        if (cart.length === 0) return alert('El carrito está vacío.');
        if (!identificadorMesa.trim()) return alert('Por favor, indica la Mesa o el Nombre del Cliente.');

        setIsSubmitting(true);
        try {
            const payload = {
                telefonoCliente: '', // Opcional por ahora en POS
                nombreCliente: identificadorMesa, // Usamos el input de mesa como nombre/mesa
                identificadorMesa: identificadorMesa,
                tipoAtencion: 'Mesas',
                total: total,
                detalles: cart.map(item => ({
                    servicioId: item.servicioId,
                    cantidad: item.cantidad,
                    subtotal: item.precio * item.cantidad,
                    notasOpcionales: item.notasOpcionales
                }))
            };

            await axiosInstance.post('/Comandas', payload);
            setSuccessMsg(`¡Comanda para ${identificadorMesa} enviada a cocina!`);
            setCart([]);
            setIdentificadorMesa('');
            setTimeout(() => setSuccessMsg(''), 4000);
        } catch (e) {
            alert('Hubo un error al crear la comanda.');
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
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)] animate-fade-in-up">
            
            {/* IZQUIERDA: Catálogo de Productos */}
            <div className="flex-1 bg-white/60 backdrop-blur-xl rounded-3xl border border-white p-6 shadow-sm overflow-y-auto">
                <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-3">
                    <Coffee className="text-indigo-600" /> Menú de Productos
                </h2>

                {productosActivos.length === 0 ? (
                    <div className="text-center py-20 text-slate-400">
                        <Navigation size={40} className="mx-auto mb-4 opacity-30" />
                        <p className="font-medium">No hay productos registrados o activos en este negocio.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {productosActivos.map(p => (
                            <button
                                key={p.id}
                                onClick={() => handleAddToCart(p)}
                                className="bg-white hover:bg-indigo-50 border border-slate-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all text-left flex flex-col justify-between h-32 group"
                            >
                                <span className="font-bold text-slate-700 leading-tight group-hover:text-indigo-700">{p.nombre}</span>
                                <span className="text-lg font-black text-indigo-600">${p.precio.toFixed(2)}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* DERECHA: Ticket / Carrito */}
            <div className="w-full lg:w-[400px] bg-white rounded-3xl border border-slate-200 shadow-xl flex flex-col flex-shrink-0 relative overflow-hidden">
                {/* Header Ticket */}
                <div className="bg-slate-800 p-5 text-white">
                    <h3 className="text-lg font-black flex items-center gap-2 mb-4">
                        <ShoppingCart size={20} className="text-indigo-400" /> Ticket de Orden
                    </h3>
                    <div>
                        <input
                            type="text"
                            placeholder="Ej. Mesa 4 o 'Juan Pérez'"
                            value={identificadorMesa}
                            onChange={(e) => setIdentificadorMesa(e.target.value)}
                            className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 font-medium"
                        />
                    </div>
                </div>

                {/* Items */}
                <div className="flex-1 overflow-y-auto p-2 bg-slate-50/50">
                    {cart.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center">
                            <ShoppingCart size={40} className="mb-4 opacity-20" />
                            <p className="text-sm font-medium">Toca los productos a la izquierda para agregarlos al ticket.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {cart.map((item, i) => (
                                <div key={i} className="bg-white border text-left p-3 rounded-2xl shadow-sm border-slate-100 flex flex-col gap-2">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <p className="font-bold text-slate-800 text-sm leading-tight pr-2">{item.nombre}</p>
                                            <p className="text-xs font-semibold text-slate-400">${item.precio.toFixed(2)} c/u</p>
                                        </div>
                                        <div className="font-black text-indigo-600 text-sm">
                                            ${(item.precio * item.cantidad).toFixed(2)}
                                        </div>
                                    </div>
                                    
                                    <div className="flex justify-between items-center bg-slate-50 rounded-xl p-1.5 border border-slate-100">
                                        {/* Modificador Notas */}
                                        <div className="flex-1 mr-3">
                                            <input
                                                type="text"
                                                placeholder="Notas (ej: sin cebolla)"
                                                value={item.notasOpcionales}
                                                onChange={(e) => updateNotes(i, e.target.value)}
                                                className="w-full bg-transparent border-b border-dashed border-slate-300 px-1 py-1 text-xs text-slate-600 focus:outline-none focus:border-indigo-400 placeholder-slate-400"
                                            />
                                        </div>
                                        
                                        {/* Cantidad */}
                                        <div className="flex items-center gap-2 bg-white rounded-lg shadow-sm border border-slate-200 px-1">
                                            <button onClick={() => updateQuantity(i, -1)} className="p-1 hover:text-red-500 text-slate-400 transition-colors">
                                                {item.cantidad === 1 ? <Trash2 size={13} /> : <Minus size={13} />}
                                            </button>
                                            <span className="text-xs font-black w-4 text-center text-slate-700">{item.cantidad}</span>
                                            <button onClick={() => updateQuantity(i, 1)} className="p-1 hover:text-emerald-500 text-slate-400 transition-colors">
                                                <Plus size={13} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer Sumario */}
                <div className="bg-white p-5 border-t border-slate-200 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] z-10">
                    <div className="flex justify-between items-end mb-4">
                        <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Total a Pagar</span>
                        <span className="text-3xl font-black text-slate-800">${total.toFixed(2)}</span>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={cart.length === 0 || isSubmitting}
                        className="w-full relative flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black py-4 rounded-2xl shadow-lg shadow-indigo-500/30 transition-all active:scale-95 group overflow-hidden"
                    >
                        {isSubmitting ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /> 
                                CONFIRMAR COMANDA
                            </>
                        )}
                        {/* Shimmer effect */}
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
