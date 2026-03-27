import React, { useState, useCallback } from 'react';
import { Printer, Bluetooth, Usb, Trash2, CheckCircle, AlertCircle, Zap } from 'lucide-react';
import { useThermalPrinter } from '../hooks/useThermalPrinter';
import type { ThermalPrinter } from '../hooks/useThermalPrinter';
import { defaultTicketConfig, TICKET_CONFIG_KEY } from '../types/ticketConfig';
import type { TicketConfig } from '../types/ticketConfig';

interface Props {
    negocioId: string;
    negocio?: any;
}

const PrinterManager: React.FC<Props> = ({ negocioId, negocio }) => {
    const { connectUSB, connectBluetooth, printTicket, listPrinters, removePrinter } = useThermalPrinter();
    const [printers, setPrinters] = useState<ThermalPrinter[]>(() => listPrinters());
    const [connecting, setConnecting] = useState<'usb' | 'bluetooth' | null>(null);
    const [testingId, setTestingId] = useState<string | null>(null);
    const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

    const showFeedback = (type: 'ok' | 'err', text: string) => {
        setFeedbackMsg({ type, text });
        setTimeout(() => setFeedbackMsg(null), 3500);
    };

    const refresh = useCallback(() => setPrinters(listPrinters()), [listPrinters]);

    const handleConnectUSB = async () => {
        setConnecting('usb');
        try {
            const p = await connectUSB();
            if (p) { refresh(); showFeedback('ok', `¡${p.name} conectada por USB!`); }
        } catch { showFeedback('err', 'No se pudo conectar por USB.'); }
        finally { setConnecting(null); }
    };

    const handleConnectBluetooth = async () => {
        setConnecting('bluetooth');
        try {
            const p = await connectBluetooth();
            if (p) { refresh(); showFeedback('ok', `¡${p.name} conectada por Bluetooth!`); }
        } catch { showFeedback('err', 'No se pudo conectar por Bluetooth.'); }
        finally { setConnecting(null); }
    };

    const handleRemove = (id: string) => {
        removePrinter(id);
        refresh();
    };

    const handleTest = async (printer: ThermalPrinter) => {
        setTestingId(printer.id);
        try {
            const configRaw = localStorage.getItem(TICKET_CONFIG_KEY(negocioId));
            const config: TicketConfig = configRaw ? JSON.parse(configRaw) : defaultTicketConfig(negocio);
            const demoComanda = {
                id: 9999,
                identificadorMesa: 'Mesa 1',
                cajero: 'Prueba',
                total: 120.00,
                detallesCompletos: [
                    { nombre: 'Producto Demo', precio: 60.00, cantidad: 2, notasOpcionales: '' },
                ],
            };
            await printTicket(printer, config, demoComanda);
            showFeedback('ok', 'Ticket de prueba enviado.');
        } catch (e: any) {
            showFeedback('err', e.message || 'Error al imprimir.');
        } finally {
            setTestingId(null);
        }
    };

    return (
        <div className="space-y-4">
            {/* Feedback toast */}
            {feedbackMsg && (
                <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold animate-fade-in ${
                    feedbackMsg.type === 'ok'
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                        : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                    {feedbackMsg.type === 'ok' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                    {feedbackMsg.text}
                </div>
            )}

            {/* Connect buttons */}
            <div className="grid grid-cols-2 gap-3">
                <button
                    onClick={handleConnectUSB}
                    disabled={connecting !== null}
                    className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl transition-all active:scale-95 text-sm"
                >
                    {connecting === 'usb' ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : <Usb size={16} />}
                    Conectar USB
                </button>
                <button
                    onClick={handleConnectBluetooth}
                    disabled={connecting !== null}
                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl transition-all active:scale-95 text-sm"
                >
                    {connecting === 'bluetooth' ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : <Bluetooth size={16} />}
                    Conectar BT
                </button>
            </div>

            {/* Paired printers list */}
            {printers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-slate-400 text-sm text-center">
                    <Printer size={36} className="mb-2 opacity-20" />
                    <p className="font-medium">Sin impresoras pareadas.</p>
                    <p className="text-xs mt-1">Conecta una impresora USB o Bluetooth de arriba.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {printers.map(printer => (
                        <div key={printer.id} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-3 gap-2">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-9 h-9 bg-slate-200 rounded-lg flex items-center justify-center flex-shrink-0">
                                    {printer.type === 'usb' ? <Usb size={16} className="text-slate-600" /> : <Bluetooth size={16} className="text-blue-600" />}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-bold text-slate-800 text-sm truncate">{printer.name}</p>
                                    <p className="text-xs text-slate-400 uppercase tracking-wide">{printer.type}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <button
                                    onClick={() => handleTest(printer)}
                                    disabled={testingId === printer.id}
                                    className="flex items-center gap-1.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-bold text-xs py-2 px-3 rounded-lg transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {testingId === printer.id ? (
                                        <div className="w-3 h-3 border border-indigo-400 border-t-indigo-700 rounded-full animate-spin" />
                                    ) : <Zap size={12} />}
                                    Prueba
                                </button>
                                <button
                                    onClick={() => handleRemove(printer.id)}
                                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all active:scale-95"
                                >
                                    <Trash2 size={15} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PrinterManager;
