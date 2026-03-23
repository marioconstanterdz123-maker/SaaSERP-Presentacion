import React, { useEffect, useState } from 'react';
import axiosInstance from '../api/axiosConfig';
import { Save, ShieldAlert, CheckCircle, Trash2 } from 'lucide-react';

interface DeliveryProps {
    negocioId: string;
}

const DeliveryIntegrationsPanel: React.FC<DeliveryProps> = ({ negocioId }) => {
    const [credenciales, setCredenciales] = useState<any[]>([]);

    useEffect(() => {
        loadCredenciales();
    }, [negocioId]);

    const loadCredenciales = () => {
        axiosInstance.get('/DeliveryCredenciales', { headers: { NegocioId: negocioId } })
            .then(res => setCredenciales(res.data))
            .catch(err => console.error(err));
    };

    return (
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white shadow-sm p-6 mb-6">
            <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <ShieldAlert size={16} className="text-indigo-600" /> Integraciones Delivery
            </h3>
            
            <div className="space-y-4">
                {['RAPPI', 'UBEREATS', 'DIDI'].map(plataforma => {
                    const cred = credenciales.find(c => c.plataforma === plataforma);
                    return <DeliveryForm key={plataforma} negocioId={negocioId} plataforma={plataforma} currentCred={cred} onReload={loadCredenciales} />;
                })}
            </div>
        </div>
    );
};

const DeliveryForm: React.FC<{ negocioId: string, plataforma: string, currentCred: any, onReload: () => void }> = ({ negocioId, plataforma, currentCred, onReload }) => {
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({
        clientId: currentCred?.clientId || '',
        clientSecret: '',
        webhookSecret: '',
        storeId: currentCred?.storeId || '',
        paisCode: currentCred?.paisCode || 'MX',
        activo: currentCred?.activo ?? true
    });

    const isConnected = !!currentCred;

    const handleSave = async () => {
        try {
            await axiosInstance.post('/DeliveryCredenciales', { ...form, plataforma }, { headers: { NegocioId: negocioId } });
            alert('Credenciales guardadas');
            setOpen(false);
            onReload();
        } catch (err) {
            alert('Error al guardar credenciales');
        }
    };

    const handleDelete = async () => {
        if (!currentCred) return;
        if (!window.confirm('¿Eliminar integración?')) return;
        try {
            await axiosInstance.delete(`/DeliveryCredenciales/${currentCred.id}`, { headers: { NegocioId: negocioId } });
            onReload();
        } catch(err) {
            alert('Error');
        }
    };

    return (
        <div className="border border-slate-200 rounded-xl overflow-hidden mb-2">
            <div 
                className="bg-slate-50 px-4 py-3 flex justify-between items-center cursor-pointer hover:bg-slate-100"
                onClick={() => setOpen(!open)}
            >
                <div className="font-bold text-slate-700 flex items-center gap-2">
                    {plataforma} 
                    {isConnected ? <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-full flex gap-1 items-center"><CheckCircle size={10}/> Conectado</span> : 
                                   <span className="bg-slate-200 text-slate-500 text-xs px-2 py-0.5 rounded-full">Sin Configurar</span>}
                </div>
            </div>
            {open && (
                <div className="p-4 bg-white space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Client ID</label>
                            <input type="text" value={form.clientId} onChange={e => setForm({...form, clientId: e.target.value})} className="w-full border rounded-lg px-3 py-1.5 text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Client Secret {currentCred?.hasClientSecret && '(Configurado)'}</label>
                            <input type="password" placeholder={currentCred?.hasClientSecret ? '*****' : ''} value={form.clientSecret} onChange={e => setForm({...form, clientSecret: e.target.value})} className="w-full border rounded-lg px-3 py-1.5 text-sm" />
                        </div>
                        {plataforma === 'RAPPI' && (
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Webhook Secret (HMAC) {currentCred?.hasWebhookSecret && '(Configurado)'}</label>
                                <input type="password" placeholder={currentCred?.hasWebhookSecret ? '*****' : ''} value={form.webhookSecret} onChange={e => setForm({...form, webhookSecret: e.target.value})} className="w-full border rounded-lg px-3 py-1.5 text-sm" />
                            </div>
                        )}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Store ID</label>
                            <input type="text" value={form.storeId} onChange={e => setForm({...form, storeId: e.target.value})} className="w-full border rounded-lg px-3 py-1.5 text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">País Code</label>
                            <input type="text" value={form.paisCode} onChange={e => setForm({...form, paisCode: e.target.value})} className="w-full border rounded-lg px-3 py-1.5 text-sm" />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2 border-t mt-3">
                        {isConnected && (
                            <button onClick={handleDelete} className="text-red-500 text-sm font-bold flex items-center gap-1 hover:text-red-700 mx-auto ml-0">
                                <Trash2 size={14} /> Eliminar Integración
                            </button>
                        )}
                        <button onClick={handleSave} className="bg-indigo-600 text-white text-sm font-bold px-4 py-2 rounded-lg flex items-center gap-1 hover:bg-indigo-700">
                            <Save size={14} /> Guardar Conexión
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DeliveryIntegrationsPanel;
