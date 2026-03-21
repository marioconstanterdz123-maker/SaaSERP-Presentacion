import React, { useEffect, useState, useRef } from 'react';
import axiosInstance from '../api/axiosConfig';
import { ListOrdered, Coffee, Car, Scissors, Camera, Keyboard, XSquare, CheckCircle, Video, UploadCloud, Plus } from 'lucide-react';
import { useParams } from 'react-router-dom';
import Tesseract from 'tesseract.js';

const Operacion: React.FC = () => {
    const { negocioId } = useParams();
    const [negocio, setNegocio] = useState<any>(null);
    const [isPlataModalOpen, setIsPlacaModalOpen] = useState(false);
    const [isCamaraOpen, setIsCamaraOpen] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [nuevaPlaca, setNuevaPlaca] = useState('');
    const [vehiculos, setVehiculos] = useState<any[]>([]);
    const [comandas, setComandas] = useState<any[]>([]);
    const [citas, setCitas] = useState<any[]>([]);
    const [isCitaModalOpen, setIsCitaModalOpen] = useState(false);
    const [recursosDisponibles, setRecursosDisponibles] = useState<any[]>([]);
    const [serviciosDisponibles, setServiciosDisponibles] = useState<any[]>([]);
    const [nuevaCita, setNuevaCita] = useState({
        nombreCliente: '',
        telefonoCliente: '',
        fechaHoraInicio: '',
        duracionMinutos: 30,
        servicioId: 0,
        recursoId: 0
    });
    const [filtroEstado, setFiltroEstado] = useState('TODAS');
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);

    useEffect(() => {
        axiosInstance.get('/negocios').then(res => {
            const current = res.data.find((n: any) => n.id.toString() === negocioId);
            if(current) {
                setNegocio(current);
                if(current.sistemaAsignado === 'PARQUEADERO') {
                    fetchVehiculosInfo();
                } else if(current.sistemaAsignado === 'TAQUERIA' || current.sistemaAsignado === 'RESTAURANTES') {
                    fetchComandas();
                } else if (current.sistemaAsignado === 'CITAS') {
                    fetchCitas();
                    fetchCatalogosCita();
                }
            }
        });
    }, [negocioId]);

    const fetchComandas = async () => {
        try {
            const { data } = await axiosInstance.get('/Comandas/activas', {
                headers: { 'X-Negocio-Id': negocioId }
            });
            // Fetch details
            const comandasWDetails = await Promise.all(
                data.map(async (c: any) => {
                    const detRes = await axiosInstance.get(`/Comandas/${c.id}/detalles`, {
                        headers: { 'X-Negocio-Id': negocioId }
                    });
                    return { ...c, detalles: detRes.data };
                })
            );
            setComandas(comandasWDetails);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchCitas = async () => {
        try {
            const { data } = await axiosInstance.get('/Citas/activas', {
                headers: { 'X-Negocio-Id': negocioId }
            });
            setCitas(data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchCatalogosCita = async () => {
        try {
            const [resRec, resServ] = await Promise.all([
                axiosInstance.get(`/recursos/negocio/${negocioId}`),
                axiosInstance.get(`/servicios/negocio/${negocioId}`)
            ]);
            setRecursosDisponibles(resRec.data);
            setServiciosDisponibles(resServ.data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchVehiculosInfo = async () => {
        try {
            const { data } = await axiosInstance.get('/Tickets/activas');
            setVehiculos(data);
        } catch (error) {
            console.error(error);
        }
    };

    const renderContenidoOperacion = () => {
        if (!negocio) return <div className="animate-pulse flex space-x-4"><div className="flex-1 space-y-4 py-1"><div className="h-4 bg-slate-200 rounded w-3/4"></div></div></div>;

        if (negocio.sistemaAsignado === 'TAQUERIA' || negocio.sistemaAsignado === 'RESTAURANTES') {
            
            const handleCambiarEstado = async (id: number, nuevoEstado: string) => {
                try {
                    await axiosInstance.put(`/Comandas/${id}/estado`, { nuevoEstado }, {
                        headers: { 'X-Negocio-Id': negocioId }
                    });
                    fetchComandas();
                } catch (error) {
                    console.error("Error cambiando estado:", error);
                }
            };

            const comandasFiltradas = filtroEstado === 'TODAS' ? comandas : comandas.filter(c => c.estado === filtroEstado);

            const getStatusColor = (estado: string) => {
                switch(estado) {
                    case 'Recibida': return 'bg-rose-100 text-rose-700 border-rose-200';
                    case 'En Preparacion': return 'bg-amber-100 text-amber-700 border-amber-200';
                    case 'Lista': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
                    case 'Entregada': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
                    default: return 'bg-slate-100 text-slate-700 border-slate-200';
                }
            };

            return (
                <div className="flex flex-col flex-1 animate-fade-in-up">
                    <div className="flex justify-between items-center mb-6 bg-white/60 p-4 rounded-3xl border border-white/40 shadow-sm backdrop-blur-md">
                        <div className="flex items-center gap-4">
                            <Coffee size={32} className="text-orange-500 drop-shadow-sm" />
                            <div>
                                <h3 className="text-xl font-black text-slate-800 tracking-tight">Comandas Activas</h3>
                                <p className="text-sm font-medium text-slate-500">{comandas.length} órdenes en curso</p>
                            </div>
                        </div>
                        <div className="flex bg-slate-100 p-1 rounded-2xl">
                            {['TODAS', 'Recibida', 'En Preparacion', 'Lista', 'Entregada'].map(estado => (
                                <button key={estado} onClick={() => setFiltroEstado(estado)}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filtroEstado === estado ? 'bg-white shadow-md text-orange-600' : 'text-slate-500 hover:bg-slate-200'}`}>
                                    {estado}
                                </button>
                            ))}
                        </div>
                    </div>

                    {comandasFiltradas.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center bg-white/40 rounded-3xl border border-white/20 border-dashed">
                            <CheckCircle size={48} className="text-slate-300 mb-4" />
                            <h3 className="text-xl font-bold text-slate-400">Todo limpio en cocina</h3>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 content-start">
                            {comandasFiltradas.map(c => (
                                <div key={c.id} className="bg-white/80 backdrop-blur-xl rounded-3xl p-5 shadow-lg border border-slate-100 flex flex-col hover:-translate-y-1 transition-transform">
                                    <div className="flex justify-between items-start mb-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(c.estado)}`}>
                                            {c.estado}
                                        </span>
                                        <span className="font-black text-slate-300 text-xl">#{c.id.toString().padStart(3, '0')}</span>
                                    </div>
                                    
                                    <h4 className="text-2xl font-black text-slate-800 tracking-tight leading-tight mb-1">{c.nombreCliente}</h4>
                                    <p className="text-sm font-bold text-orange-600 mb-4 flex items-center gap-1">
                                        {c.tipoAtencion === 'Llevar' ? '🛵 Para Llevar' : `🍽️ ${c.identificadorMesa || c.tipoAtencion}`}
                                    </p>
                                    
                                    <div className="bg-slate-50 rounded-2xl p-4 mb-4 flex-1">
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-slate-500 font-medium">Llegada:</span>
                                            <span className="font-bold text-slate-700">{new Date(c.fechaCreacion).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500 font-medium">A cobrar:</span>
                                            <span className="font-black text-emerald-600">${c.total.toFixed(2)}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 mt-auto">
                                        {c.estado === 'Recibida' && (
                                            <button onClick={() => handleCambiarEstado(c.id, 'En Preparacion')} className="col-span-2 bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl shadow-md transition-transform active:scale-95">
                                                👨‍🍳 Cocinar
                                            </button>
                                        )}
                                        {c.estado === 'En Preparacion' && (
                                            <button onClick={() => handleCambiarEstado(c.id, 'Lista')} className="col-span-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl shadow-md transition-transform active:scale-95">
                                                🔔 Marcar Lista
                                            </button>
                                        )}
                                        {c.estado === 'Lista' && (
                                            <button onClick={() => handleCambiarEstado(c.id, 'Entregada')} className="col-span-2 bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 rounded-xl shadow-md transition-transform active:scale-95 text-lg">
                                                🍽️ Entregar a Mesa
                                            </button>
                                        )}
                                        {c.estado === 'Entregada' && (
                                            <button onClick={() => handleCambiarEstado(c.id, 'Cobrada')} className="col-span-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-md transition-transform active:scale-95 text-lg">
                                                💳 Cobrar ${c.total}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            );
        }

            const handleIngresoManual = async (e: React.FormEvent) => {
                e.preventDefault();
                try {
                    await axiosInstance.post('/Tickets/entrada', { placa: nuevaPlaca });
                    setIsPlacaModalOpen(false);
                    setNuevaPlaca('');
                    // alert("Ticket generado y vehículo registrado ✅");
                    fetchVehiculosInfo();
                } catch (error) {
                    console.error("Error registrando entrada", error);
                    alert("Hubo un error al registrar el vehículo.");
                }
            };

            const handleDarSalida = async (id: number) => {
                try {
                    const { data } = await axiosInstance.put(`/Tickets/${id}/salida`);
                    alert(`Cobro estimado: $${data.cobro}\nTiempo: ${data.tiempoTotal}`);
                    fetchVehiculosInfo();
                } catch (error) {
                    console.error(error);
                }
            };

            const abrirCamara = async () => {
                setIsCamaraOpen(true);
                try {
                    const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                    setStream(mediaStream);
                    if (videoRef.current) {
                        videoRef.current.srcObject = mediaStream;
                    }
                } catch (err) {
                    console.error("Error accessing camera", err);
                    alert("No se pudo acceder a la cámara. Quizás necesites dar permisos.");
                    setIsCamaraOpen(false);
                }
            };

            const cerrarCamara = () => {
                if (stream) {
                    stream.getTracks().forEach(track => track.stop());
                    setStream(null);
                }
                setIsCamaraOpen(false);
                setIsScanning(false);
            };

            const simularLecturaPlaca = async () => {
                if (!videoRef.current || !canvasRef.current) return;
                setIsScanning(true);

                try {
                    // 1. Dibujar el fotograma actual en el Canvas oculto
                    const video = videoRef.current;
                    const canvas = canvasRef.current;
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    }

                    // 2. Extraer la imagen en base64
                    const imageData = canvas.toDataURL('image/png');

                    // 3. Pasar a la Inteligencia Artificial de OCR (Tesseract.js)
                    const result = await Tesseract.recognize(
                        imageData,
                        'eng', // Inglés suele funcionar mejor para caracteres alfanuméricos de placas
                        // Opcional: { logger: m => console.log(m) }
                    );

                    // 4. Limpiar el texto: quitar espacios, saltos de línea y símbolos extraños
                    let textoExtraido = result.data.text.replace(/[^A-Z0-9-]/gi, '').toUpperCase();
                    
                    // Si Tesseract lee basura, meteríamos un fallback de seguridad
                    if(textoExtraido.length < 2) textoExtraido = "LECTURA-MALA";

                    cerrarCamara();
                    setNuevaPlaca(textoExtraido); 
                    setIsPlacaModalOpen(true);
                } catch (error) {
                    console.error("Error OCR:", error);
                    alert("Falló la IA al leer la placa.");
                    cerrarCamara();
                }
            };

            return (
                <div className="flex flex-col items-center justify-center p-12 text-center bg-white/70 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl flex-1 animate-fade-in-up">
                    <Car size={64} className="text-blue-500 mb-6 drop-shadow-md" />
                    <h3 className="text-2xl font-black text-slate-800 mb-2">Caseta de Control Vehícular</h3>
                    <p className="text-slate-500 max-w-md mx-auto">
                        Módulo de entrada y salida flash. Aquí podrás activar tu cámara web (o celular) para escanear placas automáticamente usando IA, o registrar accesos manuales con impresión de ticket.
                    </p>
                    <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md mx-auto">
                        <button onClick={abrirCamara} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 px-4 rounded-2xl shadow-lg shadow-emerald-500/30 transition-transform active:scale-95 flex items-center justify-center gap-2">
                            <Camera size={20} /> Escanear Placa
                        </button>
                        <button onClick={() => setIsPlacaModalOpen(true)} className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-4 px-4 rounded-2xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2">
                            <Keyboard size={20} /> Registro Manual
                        </button>
                    </div>

                    {vehiculos.length > 0 && (
                        <div className="mt-12 w-full max-w-2xl mx-auto bg-white/50 rounded-2xl p-6 border border-white max-h-64 overflow-y-auto">
                            <h4 className="text-left font-bold text-slate-700 mb-4 flex justify-between items-center">
                                Vehículos Adentro
                                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs">{vehiculos.length} Ocupados</span>
                            </h4>
                            <div className="space-y-3">
                                {vehiculos.map(v => (
                                    <div key={v.id} className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:-translate-y-1 transition-transform">
                                        <div className="text-left">
                                            <div className="text-xl font-black text-slate-800 tracking-wider mb-1">{v.placa}</div>
                                            <div className="text-xs text-slate-500 font-medium">Entrada: {new Date(v.horaEntrada).toLocaleTimeString()}</div>
                                        </div>
                                        <button onClick={() => handleDarSalida(v.id)} className="bg-red-50 text-red-600 hover:bg-red-500 hover:text-white font-bold py-2 px-4 rounded-xl border border-red-200 transition-colors">
                                            Cobrar y Salir
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {isPlataModalOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in text-left">
                            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xs overflow-hidden">
                                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 flex justify-between items-center text-white">
                                    <h3 className="font-bold tracking-wide">Captura de Placa</h3>
                                    <button onClick={() => setIsPlacaModalOpen(false)} className="hover:bg-white/20 p-2 rounded-full transition-colors"><XSquare size={20} /></button>
                                </div>
                                <form onSubmit={handleIngresoManual} className="p-6">
                                    <div className="mb-4">
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Folio o Placa del Vehículo</label>
                                        <input autoFocus required type="text" placeholder="Ej. ABC-123" 
                                            className="w-full text-center text-3xl tracking-widest uppercase bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-4 focus:outline-none focus:border-blue-500 font-black text-slate-800" 
                                            value={nuevaPlaca} onChange={e => setNuevaPlaca(e.target.value.toUpperCase())} />
                                    </div>
                                    <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-blue-700 transition-colors active:scale-95 flex justify-center items-center gap-2">
                                        <CheckCircle size={20} /> Registrar Entrada
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}

                    {isCamaraOpen && (
                        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
                            <div className="w-full max-w-md flex justify-between items-center mb-4 text-white">
                                <h3 className="font-bold flex items-center gap-2"><Video size={20}/> Cámara Activa</h3>
                                <button onClick={cerrarCamara} className="bg-white/20 p-2 rounded-full hover:bg-white/40 border border-white/10"><XSquare size={24} /></button>
                            </div>
                            <div className="relative w-full max-w-md bg-black rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-800 aspect-[3/4] md:aspect-video flex items-center justify-center">
                                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover"></video>
                                <canvas ref={canvasRef} className="hidden"></canvas>
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="w-2/3 h-1/4 max-h-32 border-4 border-emerald-500/80 rounded-xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                                        <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400"></div>
                                        <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400"></div>
                                        <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400"></div>
                                        <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400"></div>
                                    </div>
                                    <p className="absolute bottom-8 text-emerald-400 font-bold text-sm bg-black/50 backdrop-blur-sm px-6 py-2 rounded-full animate-pulse border border-emerald-500/30">Alinee la placa en el recuadro</p>
                                </div>
                            </div>
                            <div className="mt-8 w-full max-w-md flex flex-col gap-4">
                                <button onClick={simularLecturaPlaca} disabled={isScanning} className={`w-full text-white font-black py-4 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-transform flex justify-center items-center gap-3 ${isScanning ? 'bg-slate-600 cursor-not-allowed scale-95' : 'bg-emerald-500 hover:bg-emerald-600 active:scale-95'}`}>
                                    {isScanning ? (
                                        <><UploadCloud size={24} className="animate-bounce" /> Procesando Fotografía con IA...</>
                                    ) : (
                                        <><Camera size={24} /> Capturar y Extraer Texto</>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            );

        if (negocio.sistemaAsignado === 'CITAS') {
            const handleCambiarEstadoCita = async (id: number, nuevoEstado: string) => {
                try {
                    await axiosInstance.put(`/Citas/${id}/estado`, { nuevoEstado }, {
                        headers: { 'X-Negocio-Id': negocioId }
                    });
                    fetchCitas();
                } catch (error) {
                    console.error("Error cambiando estado de cita:", error);
                }
            };

            const handleRegistrarCita = async (e: React.FormEvent) => {
                e.preventDefault();
                try {
                    await axiosInstance.post('/Citas/registrar', {
                        ...nuevaCita,
                        negocioId: Number(negocioId),
                        servicioId: nuevaCita.servicioId === 0 ? null : nuevaCita.servicioId,
                        recursoId: nuevaCita.recursoId === 0 ? null : nuevaCita.recursoId,
                    });
                    setIsCitaModalOpen(false);
                    setNuevaCita({ nombreCliente: '', telefonoCliente: '', fechaHoraInicio: '', duracionMinutos: 30, servicioId: 0, recursoId: 0 });
                    fetchCitas();
                } catch (error) {
                    console.error("Error al registrar cita:", error);
                    alert("No se pudo registrar la cita.");
                }
            };

            return (
                <div className="flex flex-col flex-1 animate-fade-in-up">
                    <div className="flex justify-between items-center mb-6 bg-white/60 p-4 rounded-3xl border border-white/40 shadow-sm backdrop-blur-md">
                        <div className="flex items-center gap-4">
                            <Scissors size={32} className="text-fuchsia-500 drop-shadow-sm" />
                            <div>
                                <h3 className="text-xl font-black text-slate-800 tracking-tight">Agenda de Hoy</h3>
                                <p className="text-sm font-medium text-slate-500">{citas.length} citas registradas</p>
                            </div>
                        </div>
                        <button onClick={() => setIsCitaModalOpen(true)} className="bg-gradient-to-r from-fuchsia-500 to-pink-500 hover:from-fuchsia-600 hover:to-pink-600 text-white font-bold py-2 px-6 rounded-2xl shadow-lg shadow-pink-500/30 transition-transform active:scale-95 flex items-center gap-2">
                            <Plus size={20} /> Nueva Cita
                        </button>
                    </div>

                    {citas.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center bg-white/40 rounded-3xl border border-white/20 border-dashed">
                            <CheckCircle size={48} className="text-slate-300 mb-4" />
                            <h3 className="text-xl font-bold text-slate-400">Sin citas para hoy</h3>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 content-start">
                            {citas.map(c => (
                                <div key={c.id} className="bg-white/80 backdrop-blur-xl rounded-3xl p-5 shadow-lg border border-slate-100 flex flex-col hover:-translate-y-1 transition-transform border-t-4 border-t-fuchsia-400">
                                    <div className="flex justify-between items-start mb-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${c.estado === 'Completada' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                                            {c.estado}
                                        </span>
                                        <span className="font-black text-slate-300 text-xl">#{c.id}</span>
                                    </div>
                                    
                                    <h4 className="text-2xl font-black text-slate-800 tracking-tight leading-tight mb-1">{c.nombreCliente}</h4>
                                    <p className="text-sm font-bold text-fuchsia-600 mb-4 flex items-center gap-1">
                                        📞 {c.telefonoCliente}
                                    </p>
                                    
                                    <div className="bg-slate-50 rounded-2xl p-4 mb-4 flex-1">
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-slate-500 font-medium">Horario:</span>
                                            <span className="font-bold text-slate-700">{new Date(c.fechaHoraInicio).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-2 mt-auto">
                                        {c.estado === 'Pendiente' && (
                                            <button onClick={() => handleCambiarEstadoCita(c.id, 'Completada')} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl shadow-md transition-transform active:scale-95 text-lg">
                                                ✅ Terminar y Cobrar
                                            </button>
                                        )}
                                        {c.estado === 'Completada' && (
                                            <button disabled className="bg-slate-200 text-slate-400 font-bold py-3 rounded-xl shadow-sm text-lg cursor-not-allowed">
                                                ✔ Finalizada
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {isCitaModalOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in text-left">
                            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
                                <div className="bg-gradient-to-r from-fuchsia-600 to-pink-600 p-5 flex justify-between items-center text-white">
                                    <h3 className="font-bold tracking-wide">Agendar Cita</h3>
                                    <button onClick={() => setIsCitaModalOpen(false)} className="hover:bg-white/20 p-2 rounded-full transition-colors"><XSquare size={20} /></button>
                                </div>
                                <form onSubmit={handleRegistrarCita} className="p-6 space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Nombre del Cliente</label>
                                        <input required type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-800 focus:ring-2 focus:ring-pink-500 focus:outline-none" 
                                            value={nuevaCita.nombreCliente} onChange={e => setNuevaCita({...nuevaCita, nombreCliente: e.target.value})} placeholder="Ej. Juan Pérez" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Teléfono</label>
                                            <input required type="tel" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-800 focus:ring-2 focus:ring-pink-500 focus:outline-none" 
                                                value={nuevaCita.telefonoCliente} onChange={e => setNuevaCita({...nuevaCita, telefonoCliente: e.target.value})} placeholder="555-0000" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Fecha y Hora</label>
                                            <input required type="datetime-local" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-800 focus:ring-2 focus:ring-pink-500 focus:outline-none" 
                                                value={nuevaCita.fechaHoraInicio} onChange={e => setNuevaCita({...nuevaCita, fechaHoraInicio: e.target.value})} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Especialista (Opcional)</label>
                                        <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-800 focus:ring-2 focus:ring-pink-500 focus:outline-none"
                                            value={nuevaCita.recursoId} onChange={e => setNuevaCita({...nuevaCita, recursoId: Number(e.target.value)})}
                                        >
                                            <option value={0}>Sin preferencia</option>
                                            {recursosDisponibles.filter(r => r.activo).map(r => (
                                                <option key={r.id} value={r.id}>{r.nombre} ({r.tipo})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Servicio (Opcional)</label>
                                        <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-800 focus:ring-2 focus:ring-pink-500 focus:outline-none"
                                            value={nuevaCita.servicioId} onChange={e => setNuevaCita({...nuevaCita, servicioId: Number(e.target.value)})}
                                        >
                                            <option value={0}>Escoger después</option>
                                            {serviciosDisponibles.filter(s => s.activo).map(s => (
                                                <option key={s.id} value={s.id}>{s.nombre} - ${s.precioBase}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="pt-2">
                                        <button type="submit" className="w-full bg-gradient-to-r from-fuchsia-500 to-pink-500 hover:from-fuchsia-600 hover:to-pink-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-pink-500/30 transition-all active:scale-95 flex items-center justify-center gap-2">
                                            <CheckCircle className="w-5 h-5" /> Agendar y Disponer
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        return (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-white/70 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl flex-1 animate-fade-in-up">
                <ListOrdered size={64} className="text-slate-400 mb-6 drop-shadow-md" />
                <h3 className="text-2xl font-black text-slate-800 mb-2">Operación Genérica (POS)</h3>
                <p className="text-slate-500 max-w-md">
                    Levante pedidos o registre ventas instantáneas para este negocio no clasificado o mixto.
                </p>
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col space-y-6">
            <header className="flex justify-between items-end mb-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <ListOrdered className="text-slate-800" size={32} /> Central de Operaciones
                    </h2>
                    <p className="text-slate-500 mt-1">El corazón del negocio. Gestiona ventas en mostrador en tiempo real.</p>
                </div>
            </header>
            
            {renderContenidoOperacion()}
        </div>
    );
};

export default Operacion;
