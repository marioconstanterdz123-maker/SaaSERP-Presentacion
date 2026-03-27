import { useState, useEffect, useCallback } from 'react';

export interface CartItem {
    servicioId: number;
    nombre: string;
    precio: number;
    cantidad: number;
    notasOpcionales: string;
}

interface PersistedState {
    cart: CartItem[];
    identificadorMesa: string;
    telefonoCliente: string;
    tipoAtencionPos: 'Mesa' | 'Llevar' | 'Mostrador';
    mesaSeleccionada: string;
}

const CART_KEY = (negocioId: string) => `pos_cart_${negocioId}`;

export function usePersistentCart(negocioId: string | undefined) {
    const key = negocioId ? CART_KEY(negocioId) : null;

    // Intentar restaurar desde localStorage
    const loadInitial = <T>(field: keyof PersistedState, fallback: T): T => {
        if (!key) return fallback;
        try {
            const raw = localStorage.getItem(key);
            if (raw) {
                const parsed: PersistedState = JSON.parse(raw);
                return (parsed[field] as unknown as T) ?? fallback;
            }
        } catch {
            // datos corruptos → ignorar
        }
        return fallback;
    };

    const [cart, setCart] = useState<CartItem[]>(() => loadInitial('cart', []));
    const [identificadorMesa, setIdentificadorMesa] = useState<string>(() =>
        loadInitial('identificadorMesa', '')
    );
    const [telefonoCliente, setTelefonoCliente] = useState<string>(() =>
        loadInitial('telefonoCliente', '')
    );
    const [tipoAtencionPos, setTipoAtencionPos] = useState<'Mesa' | 'Llevar' | 'Mostrador'>(() =>
        loadInitial('tipoAtencionPos', 'Mesa')
    );
    const [mesaSeleccionada, setMesaSeleccionada] = useState<string>(() =>
        loadInitial('mesaSeleccionada', '')
    );

    // Auto-guardar en cada cambio de estado
    useEffect(() => {
        if (!key) return;
        const state: PersistedState = {
            cart,
            identificadorMesa,
            telefonoCliente,
            tipoAtencionPos,
            mesaSeleccionada,
        };
        localStorage.setItem(key, JSON.stringify(state));
    }, [key, cart, identificadorMesa, telefonoCliente, tipoAtencionPos, mesaSeleccionada]);

    const clearPersistedCart = useCallback(() => {
        if (key) localStorage.removeItem(key);
        setCart([]);
        setIdentificadorMesa('');
        setTelefonoCliente('');
        setMesaSeleccionada('');
        // tipoAtencionPos lo dejamos como estaba (preferencia del usuario)
    }, [key]);

    return {
        cart,
        setCart,
        identificadorMesa,
        setIdentificadorMesa,
        telefonoCliente,
        setTelefonoCliente,
        tipoAtencionPos,
        setTipoAtencionPos,
        mesaSeleccionada,
        setMesaSeleccionada,
        clearPersistedCart,
    };
}
