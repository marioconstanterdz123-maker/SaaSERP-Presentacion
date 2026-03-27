import { useCallback } from 'react';
import type { TicketConfig } from '../types/ticketConfig';

export type PrinterType = 'usb' | 'bluetooth';

export interface ThermalPrinter {
    id: string;
    name: string;
    type: PrinterType;
}

const PRINTERS_KEY = 'paired_thermal_printers';
const SPP_UUID = '00001101-0000-1000-8000-00805f9b34fb';

// ─── ESC/POS Helpers ──────────────────────────────────────────────────────────
const ESC = 0x1B;
const GS  = 0x1D;

const CMD = {
    INIT:          [ESC, 0x40],
    ALIGN_CENTER:  [ESC, 0x61, 0x01],
    ALIGN_LEFT:    [ESC, 0x61, 0x00],
    ALIGN_RIGHT:   [ESC, 0x61, 0x02],
    BOLD_ON:       [ESC, 0x45, 0x01],
    BOLD_OFF:      [ESC, 0x45, 0x00],
    DOUBLE_HEIGHT: [ESC, 0x21, 0x10],
    NORMAL_FONT:   [ESC, 0x21, 0x00],
    CUT:           [GS,  0x56, 0x42, 0x00],
    FEED_3:        [ESC, 0x64, 0x03],
};

function encode(text: string): Uint8Array {
    // ISO-8859-1 + fallback ASCII para compatibilidad máxima con impresoras genéricas
    const buf = new Uint8Array(text.length);
    for (let i = 0; i < text.length; i++) {
        const c = text.charCodeAt(i);
        buf[i] = c < 256 ? c : 0x3F; // '?'
    }
    return buf;
}

function line(text: string): Uint8Array {
    return encode(text + '\n');
}

function separator(char = '=', width = 32): Uint8Array {
    return line(char.repeat(width));
}

function padLine(left: string, right: string, width = 32): Uint8Array {
    const spaces = Math.max(1, width - left.length - right.length);
    return line(left + ' '.repeat(spaces) + right);
}

function buildTicket(config: TicketConfig, comanda: any): Uint8Array {
    const parts: Uint8Array[] = [];
    const push = (...arr: number[]) => parts.push(new Uint8Array(arr));
    const pushText = (t: string) => parts.push(line(t));

    const width = 32;
    const mon = config.moneda || '$';

    // Init + charset Latin-1
    push(...CMD.INIT);
    push(ESC, 0x74, 0x02); // charset PC858 Latin

    // ── HEADER ──
    push(...CMD.ALIGN_CENTER);
    push(...CMD.BOLD_ON);
    push(...CMD.DOUBLE_HEIGHT);
    pushText(config.nombreNegocio || 'MI NEGOCIO');
    push(...CMD.NORMAL_FONT);
    push(...CMD.BOLD_OFF);
    if (config.direccion) pushText(config.direccion);
    if (config.rfc)       pushText(`RFC: ${config.rfc}`);
    if (config.telefono)  pushText(`Tel: ${config.telefono}`);
    parts.push(separator('=', width));

    // ── DATOS ──
    push(...CMD.ALIGN_LEFT);
    const now = new Date();
    const fecha = now.toLocaleDateString('es-MX');
    const hora  = now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    pushText(`Fecha: ${fecha}  Hora: ${hora}`);
    if (comanda.identificadorMesa) pushText(`Mesa: ${comanda.identificadorMesa}`);
    if (comanda.cajero)            pushText(`Cajero: ${comanda.cajero}`);
    if (comanda.id)                pushText(`Folio: #${comanda.id}`);
    parts.push(separator('-', width));

    // ── ITEMS ──
    const items: any[] = comanda.detallesCompletos || comanda.detalles || [];
    for (const it of items) {
        const nombre = (it.nombre || it.nombreProducto || it.nombreServicio || '').substring(0, 18);
        const precio = (it.precio ?? it.subtotal / (it.cantidad || 1)) ?? 0;
        const subtotal = ((it.cantidad || 1) * precio).toFixed(2);
        const left = `${it.cantidad}x ${nombre}`;
        const right = `${mon}${subtotal}`;
        parts.push(padLine(left, right, width));
        if (it.notasOpcionales) pushText(`  * ${it.notasOpcionales}`);
    }
    parts.push(separator('-', width));

    // ── TOTALES ──
    push(...CMD.ALIGN_RIGHT);
    const subtotalNum = comanda.total || comanda.detallesCompletos?.reduce((s: number, i: any) => s + i.precio * i.cantidad, 0) || 0;
    let totalFinal = subtotalNum;
    if (config.mostrarIva) {
        const base = subtotalNum / (1 + config.tasaIva / 100);
        const iva  = subtotalNum - base;
        parts.push(padLine('SUBTOTAL:', `${mon}${base.toFixed(2)}`, width));
        parts.push(padLine(`IVA (${config.tasaIva}%):`, `${mon}${iva.toFixed(2)}`, width));
        totalFinal = subtotalNum;
    }
    push(...CMD.BOLD_ON);
    push(...CMD.DOUBLE_HEIGHT);
    parts.push(padLine('TOTAL:', `${mon}${totalFinal.toFixed(2)}`, width));
    push(...CMD.NORMAL_FONT);
    push(...CMD.BOLD_OFF);
    parts.push(separator('=', width));

    // ── FOOTER ──
    push(...CMD.ALIGN_CENTER);
    pushText(`Articulos: ${items.reduce((s: number, i: any) => s + (i.cantidad || 1), 0)}`);
    if (config.footerLinea1) pushText(config.footerLinea1);
    if (config.footerLinea2) pushText(config.footerLinea2);
    parts.push(separator('=', width));

    // Feed y corte
    push(...CMD.FEED_3);
    push(...CMD.CUT);

    // Concatenar todo
    const total = parts.reduce((s, p) => s + p.length, 0);
    const result = new Uint8Array(total);
    let offset = 0;
    for (const p of parts) {
        result.set(p, offset);
        offset += p.length;
    }
    return result;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useThermalPrinter() {

    const listPrinters = useCallback((): ThermalPrinter[] => {
        try {
            const raw = localStorage.getItem(PRINTERS_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch { return []; }
    }, []);

    const savePrinter = useCallback((printer: ThermalPrinter) => {
        const list = listPrinters().filter(p => p.id !== printer.id);
        localStorage.setItem(PRINTERS_KEY, JSON.stringify([...list, printer]));
    }, [listPrinters]);

    const removePrinter = useCallback((id: string) => {
        const list = listPrinters().filter(p => p.id !== id);
        localStorage.setItem(PRINTERS_KEY, JSON.stringify(list));
    }, [listPrinters]);

    // ── USB ──
    const connectUSB = useCallback(async (): Promise<ThermalPrinter | null> => {
        const nav = navigator as any;
        if (!nav.usb) {
            alert('Web USB no está disponible en este dispositivo/navegador.');
            return null;
        }
        try {
            const device = await nav.usb.requestDevice({ filters: [] });
            const printer: ThermalPrinter = {
                id: `usb_${device.vendorId}_${device.productId}`,
                name: device.productName || `USB ${device.vendorId}:${device.productId}`,
                type: 'usb',
            };
            savePrinter(printer);
            return printer;
        } catch (err: any) {
            if (err?.name !== 'NotFoundError') console.error('USB connect error', err);
            return null;
        }
    }, [savePrinter]);

    // ── Bluetooth ──
    const connectBluetooth = useCallback(async (): Promise<ThermalPrinter | null> => {
        const nav = navigator as any;
        if (!nav.bluetooth) {
            alert('Web Bluetooth no está disponible en este dispositivo/navegador.');
            return null;
        }
        try {
            const device = await nav.bluetooth.requestDevice({
                filters: [{ services: [SPP_UUID] }],
                optionalServices: [SPP_UUID],
            });
            const printer: ThermalPrinter = {
                id: `ble_${device.id}`,
                name: device.name || 'Impresora BT',
                type: 'bluetooth',
            };
            savePrinter(printer);
            return printer;
        } catch (err: any) {
            if (err?.name !== 'NotFoundError') console.error('BT connect error', err);
            return null;
        }
    }, [savePrinter]);

    // ── Imprimir ──
    const printTicket = useCallback(async (
        printer: ThermalPrinter,
        config: TicketConfig,
        comanda: any,
    ): Promise<void> => {
        const bytes = buildTicket(config, comanda);
        const nav = navigator as any;

        if (printer.type === 'usb') {
            const devices: any[] = await nav.usb.getDevices();
            const dev = devices.find((d: any) =>
                printer.id === `usb_${d.vendorId}_${d.productId}`
            );
            if (!dev) throw new Error('Impresora USB no encontrada. Reconecta desde Ajustes.');
            await dev.open();
            if (dev.configuration === null) await dev.selectConfiguration(1);
            await dev.claimInterface(0);
            await dev.transferOut(1, bytes);
            await dev.close();
        } else {
            // Bluetooth SPP via Web Bluetooth GATT
            const btDevices: any[] = await nav.bluetooth.getDevices();
            const dev = btDevices.find((d: any) => `ble_${d.id}` === printer.id);
            if (!dev) throw new Error('Impresora BT no encontrada. Reconecta desde Ajustes.');
            const server = await dev.gatt.connect();
            const service = await server.getPrimaryService(SPP_UUID);
            const characteristic = await service.getCharacteristic('00001101-0000-1000-8000-00805f9b34fb');
            const CHUNK = 512;
            for (let i = 0; i < bytes.length; i += CHUNK) {
                await characteristic.writeValueWithoutResponse(bytes.slice(i, i + CHUNK));
            }
            server.disconnect();
        }
    }, []);

    return { connectUSB, connectBluetooth, printTicket, listPrinters, removePrinter };
}
