import React, { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../api/axiosConfig';
import { Smartphone, QrCode, CheckCircle, XCircle, Loader, Trash2, RefreshCw, Zap } from 'lucide-react';

interface WhatsAppPanelProps {
    negocioId: number;
    negocioNombre: string;
}

type Estado = 'SIN_INSTANCIA' | 'open' | 'connecting' | 'close' | 'ERROR' | 'CARGANDO';

const WhatsAppPanel: React.FC<WhatsAppPanelProps> = ({ negocioId, negocioNombre }) => {
    const [estado, setEstado] = useState<Estado>('CARGANDO');
    const [instancia, setInstancia] = useState<string | null>(null);
    const [qrBase64, setQrBase64] = useState<string | null>(null);
    const [isWorking, setIsWorking] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const fetchEstado = useCallback(async () => {
        try {
            const { data } = await axiosInstance.get(`/WhatsApp/${negocioId}/estado`);
            setEstado(data.estado as Estado);
            setInstancia(data.instancia ?? null);
        } catch {
            setEstado('ERROR');
        }
    }, [negocioId]);

    useEffect(() => {
        fetchEstado();
        // Auto-poll cada 10 seg si estamos mostrando el QR (esperando que escaneen)
        const interval = setInterval(() => {
            if (estado === 'connecting' || qrBase64) fetchEstado();
        }, 10000);
        return () => clearInterval(interval);
    }, [fetchEstado, estado, qrBase64]);

    const handleCrear = async () => {
        setIsWorking(true); setErrorMsg('');
        try {
            await axiosInstance.post(`/WhatsApp/${negocioId}/crear`);
            await fetchEstado();
        } catch (e: any) {
            setErrorMsg(e.response?.data?.error ?? 'Error al crear la instancia.');
        } finally { setIsWorking(false); }
    };

    const handleObtenerQR = async () => {
        setIsWorking(true); setErrorMsg(''); setQrBase64(null);
        try {
            const { data } = await axiosInstance.get(`/WhatsApp/${negocioId}/qr`);
            // EvolutionAPI devuelve { base64: "data:image/png;base64,..." } o similar
            const qr = data.base64 || data.code || data.qrcode?.base64 || data.qr;
            if (qr) setQrBase64(qr);
            else setErrorMsg('El servidor no devolvió un QR. Intenta de nuevo en unos segundos.');
        } catch (e: any) {
            setErrorMsg(e.response?.data?.error ?? 'Error al obtener el QR.');
        } finally { setIsWorking(false); }
    };

    const handleEliminar = async () => {
        if (!confirm(`¿Desconectar WhatsApp de "${negocioNombre}"? El número ya no enviará mensajes automáticos.`)) return;
        setIsWorking(true); setErrorMsg('');
        try {
            await axiosInstance.delete(`/WhatsApp/${negocioId}`);
            setEstado('SIN_INSTANCIA'); setInstancia(null); setQrBase64(null);
        } catch (e: any) {
            setErrorMsg(e.response?.data?.error ?? 'Error al eliminar.');
        } finally { setIsWorking(false); }
    };

    const BadgeEstado = () => {
        if (estado === 'open') return (
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                <CheckCircle size={12} /> Conectado
            </span>
        );
        if (estado === 'SIN_INSTANCIA') return (
            <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full">
                <XCircle size={12} /> Sin configurar
            </span>
        );
        if (estado === 'CARGANDO') return (
            <span className="flex items-center gap-1.5 text-xs font-bold text-blue-500 px-2.5 py-1 rounded-full">
                <Loader size={12} className="animate-spin" /> Cargando...
            </span>
        );
        return (
            <span className="flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                <Smartphone size={12} /> {estado === 'connecting' ? 'Esperando QR…' : estado}
            </span>
        );
    };

    return (
        <div className="mt-3 p-4 bg-gradient-to-br from-slate-50 to-white border border-slate-100 rounded-2xl">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="bg-[#25D366] p-1.5 rounded-lg">
                        <Smartphone size={14} className="text-white" />
                    </div>
                    <span className="text-sm font-bold text-slate-700">WhatsApp Business</span>
                </div>
                <div className="flex items-center gap-2">
                    <BadgeEstado />
                    <button onClick={fetchEstado} className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors rounded-lg hover:bg-slate-100">
                        <RefreshCw size={14} />
                    </button>
                </div>
            </div>

            {errorMsg && (
                <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-2 mb-3">{errorMsg}</p>
            )}

            {/* QR Code Display */}
            {qrBase64 && estado !== 'open' && (
                <div className="flex flex-col items-center gap-2 my-3 p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                    <p className="text-xs font-bold text-slate-500 text-center">
                        📱 Escanea con WhatsApp del negocio → <em>Dispositivos Vinculados</em>
                    </p>
                    <img src={qrBase64} alt="QR WhatsApp" className="w-48 h-48 rounded-xl border" />
                    <p className="text-xs text-slate-400 text-center">El QR expira en ~60 seg. Si caducó, haz clic en "Nuevo QR".</p>
                </div>
            )}

            {/* Buttons */}
            <div className="flex gap-2 flex-wrap">
                {estado === 'SIN_INSTANCIA' && (
                    <button
                        onClick={handleCrear}
                        disabled={isWorking}
                        className="flex items-center gap-1.5 text-xs font-bold bg-[#25D366] hover:bg-[#20c15d] disabled:opacity-50 text-white px-3 py-2 rounded-xl transition-all"
                    >
                        {isWorking ? <Loader size={12} className="animate-spin" /> : <Zap size={12} />}
                        Configurar WhatsApp
                    </button>
                )}

                {(estado !== 'SIN_INSTANCIA' && estado !== 'CARGANDO' && estado !== 'open') && (
                    <button
                        onClick={handleObtenerQR}
                        disabled={isWorking}
                        className="flex items-center gap-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-3 py-2 rounded-xl transition-all"
                    >
                        {isWorking ? <Loader size={12} className="animate-spin" /> : <QrCode size={12} />}
                        {qrBase64 ? 'Nuevo QR' : 'Mostrar QR'}
                    </button>
                )}

                {instancia && (
                    <button
                        onClick={handleEliminar}
                        disabled={isWorking}
                        className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-red-500 hover:bg-red-50 px-3 py-2 rounded-xl transition-all border border-transparent hover:border-red-100"
                    >
                        <Trash2 size={12} /> Desconectar
                    </button>
                )}
            </div>

            {estado === 'open' && instancia && (
                <p className="text-xs text-slate-400 mt-2">
                    ✅ Conectado como <strong className="text-slate-600">{instancia}</strong>. Los mensajes automáticos están activos.
                </p>
            )}
        </div>
    );
};

export default WhatsAppPanel;
