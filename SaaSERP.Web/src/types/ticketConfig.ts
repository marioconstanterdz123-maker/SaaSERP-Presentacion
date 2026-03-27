export interface TicketConfig {
    nombreNegocio: string;
    direccion: string;
    rfc: string;
    telefono: string;
    footerLinea1: string;
    footerLinea2: string;
    mostrarIva: boolean;
    tasaIva: number;   // default 16
    moneda: string;    // default $
}

export const TICKET_CONFIG_KEY = (negocioId: string) => `ticket_config_${negocioId}`;

export const defaultTicketConfig = (negocio?: any): TicketConfig => ({
    nombreNegocio: negocio?.nombre || '',
    direccion: negocio?.direccion || '',
    rfc: negocio?.rfc || '',
    telefono: negocio?.telefonoWhatsApp || '',
    footerLinea1: '*** ¡GRACIAS POR SU VISITA! ***',
    footerLinea2: 'Vuelve pronto',
    mostrarIva: true,
    tasaIva: 16,
    moneda: '$',
});
