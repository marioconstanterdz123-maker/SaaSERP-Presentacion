import React, { useEffect, useState } from 'react';
import axiosInstance from '../api/axiosConfig';
import { Save, Car } from 'lucide-react';

interface TarifasProps {
    negocioId: string;
}

const TarifasParqueaderoPanel: React.FC<TarifasProps> = ({ negocioId }) => {
    const [tarifa, setTarifa] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        axiosInstance.get('/Tarifas/parqueadero', { headers: { NegocioId: negocioId } })
            .then(res => setTarifa(res.data))
            .catch(err => console.error("Error al cargar tarifas:", err));
    }, [negocioId]);

    const handleChange = (field: string, value: any) => {
        setTarifa((prev: any) => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await axiosInstance.put('/Tarifas/parqueadero', tarifa, { headers: { NegocioId: negocioId } });
            alert('Tarifas guardadas exitosamente');
        } catch (err) {
            alert('Error al guardar tarifas');
        } finally {
            setIsSaving(false);
        }
    };

    if (!tarifa) return <p className="text-slate-500 text-sm">Cargando tarifas...</p>;

    return (
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white shadow-sm p-6 mb-6">
            <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Car size={16} className="text-indigo-600" /> 🅿️ Tarifas del Estacionamiento
            </h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Primera Fracción ($)</label>
                    <input type="number" value={tarifa.costoPrimeraFraccion} onChange={e => handleChange('costoPrimeraFraccion', e.target.value)} className="w-full border rounded-xl px-3 py-2 text-sm" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Duración (min)</label>
                    <input type="number" value={tarifa.minutosPrimeraFraccion} onChange={e => handleChange('minutosPrimeraFraccion', e.target.value)} className="w-full border rounded-xl px-3 py-2 text-sm" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Fracción Adicional ($)</label>
                    <input type="number" value={tarifa.costoFraccionAdicional} onChange={e => handleChange('costoFraccionAdicional', e.target.value)} className="w-full border rounded-xl px-3 py-2 text-sm" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Duración Extra (min)</label>
                    <input type="number" value={tarifa.minutosFraccionAdicional} onChange={e => handleChange('minutosFraccionAdicional', e.target.value)} className="w-full border rounded-xl px-3 py-2 text-sm" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Tolerancia Entrada (min)</label>
                    <input type="number" value={tarifa.minutosToleranciaEntrada} onChange={e => handleChange('minutosToleranciaEntrada', e.target.value)} className="w-full border rounded-xl px-3 py-2 text-sm" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Tolerancia Fracción (min)</label>
                    <input type="number" value={tarifa.minutosToleranciaFraccion} onChange={e => handleChange('minutosToleranciaFraccion', e.target.value)} className="w-full border rounded-xl px-3 py-2 text-sm" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Boleto Perdido ($)</label>
                    <input type="number" value={tarifa.boletoPerdido} onChange={e => handleChange('boletoPerdido', e.target.value)} className="w-full border rounded-xl px-3 py-2 text-sm" />
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Header del Ticket</label>
                    <input type="text" value={tarifa.headerTicket} onChange={e => handleChange('headerTicket', e.target.value)} className="w-full border rounded-xl px-3 py-2 text-sm" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Footer del Ticket</label>
                    <input type="text" value={tarifa.footerTicket} onChange={e => handleChange('footerTicket', e.target.value)} className="w-full border rounded-xl px-3 py-2 text-sm" />
                </div>
            </div>

            <button onClick={handleSave} disabled={isSaving} className="mt-2 text-sm bg-indigo-600 text-white font-bold py-2 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-indigo-700">
                <Save size={16} /> {isSaving ? 'Guardando...' : 'Guardar Tarifas'}
            </button>
        </div>
    );
};

export default TarifasParqueaderoPanel;
