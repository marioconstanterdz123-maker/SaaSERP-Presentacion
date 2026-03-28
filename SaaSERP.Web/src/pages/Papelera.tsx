import React, { useEffect, useState } from 'react';
import axiosInstance from '../api/axiosConfig';
import Swal from 'sweetalert2';
import { Trash2, RotateCcw, AlertTriangle, RefreshCw } from 'lucide-react';

const SISTEMA_ICON: Record<string, string> = {
    CITAS: '✂️', TAQUERIA: '🌮', PARQUEADERO: '🅿️', RESTAURANTES: '🍽️', TATTOO: '🎨',
};

const Papelera: React.FC = () => {
    const [negocios, setNegocios] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchPapelera = () => {
        setLoading(true);
        axiosInstance.get('/negocios/papelera')
            .then(r => setNegocios(r.data))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchPapelera(); }, []);

    const handleRestaurar = async (n: any) => {
        const result = await Swal.fire({
            title: '¿Restaurar negocio?',
            html: `<b>${n.nombre}</b> volverá a estar activo en el sistema.`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#4f46e5',
            cancelButtonColor: '#64748b',
            confirmButtonText: '✅ Restaurar',
            cancelButtonText: 'Cancelar',
        });
        if (!result.isConfirmed) return;
        await axiosInstance.post(`/negocios/${n.id}/restaurar`);
        Swal.fire('Restaurado', `${n.nombre} está activo nuevamente.`, 'success');
        fetchPapelera();
    };

    const handleEliminarDefinitivo = async (n: any) => {
        const result = await Swal.fire({
            title: '⚠️ Eliminar permanentemente',
            html: `<p>Esto borrará <b>${n.nombre}</b> y <b>todos sus datos</b> de forma irreversible.</p><p class="mt-2 text-red-500 font-bold">Esta acción NO se puede deshacer.</p>`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#64748b',
            confirmButtonText: '🗑️ Eliminar para siempre',
            cancelButtonText: 'Cancelar',
        });
        if (!result.isConfirmed) return;

        // Double confirmation
        const { value: texto } = await Swal.fire({
            title: 'Confirma escribiendo el nombre',
            input: 'text',
            inputPlaceholder: n.nombre,
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            inputValidator: (v) => v !== n.nombre ? `Debes escribir exactamente: ${n.nombre}` : null,
        });
        if (!texto) return;

        await axiosInstance.delete(`/negocios/${n.id}/definitivo`);
        Swal.fire('Eliminado', 'El negocio fue eliminado permanentemente.', 'success');
        fetchPapelera();
    };

    return (
        <div className="flex flex-col gap-6 animate-fade-in-up">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 bg-white/60 p-5 rounded-3xl border border-white/40 shadow-sm backdrop-blur-md flex-1 mr-4">
                    <div className="bg-red-600 p-3 rounded-2xl shadow-lg">
                        <Trash2 size={28} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Papelera de Negocios</h2>
                        <p className="text-slate-500 text-sm">Negocios eliminados temporalmente. Puedes restaurarlos o eliminarlos definitivamente.</p>
                    </div>
                </div>
                <button
                    onClick={fetchPapelera}
                    className="bg-white/60 p-3 rounded-2xl border border-white/40 shadow-sm hover:bg-slate-50 transition-colors"
                >
                    <RefreshCw size={20} className="text-slate-500" />
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-10 h-10 border-4 border-red-200 border-t-red-600 rounded-full animate-spin" />
                </div>
            ) : negocios.length === 0 ? (
                <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white shadow-sm p-16 text-center">
                    <Trash2 size={48} className="mx-auto mb-4 text-slate-200" />
                    <p className="text-slate-400 font-medium">La papelera está vacía</p>
                    <p className="text-slate-300 text-sm mt-1">Los negocios eliminados aparecerán aquí.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {negocios.map(n => (
                        <div key={n.id} className="bg-white/80 backdrop-blur-xl rounded-2xl border border-red-100 shadow-sm p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            <div className="text-3xl w-12 h-12 flex items-center justify-center bg-red-50 rounded-xl flex-shrink-0">
                                {SISTEMA_ICON[n.sistemaAsignado] ?? '🏢'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-black text-slate-700 text-base">{n.nombre}</p>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg">{n.sistemaAsignado}</span>
                                    {n.fechaEliminacion && (
                                        <span className="text-xs text-red-400 flex items-center gap-1">
                                            <AlertTriangle size={11} />
                                            Eliminado el {new Date(n.fechaEliminacion).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-2 flex-shrink-0 w-full sm:w-auto">
                                <button
                                    onClick={() => handleRestaurar(n)}
                                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition-all active:scale-95"
                                >
                                    <RotateCcw size={14} /> Restaurar
                                </button>
                                <button
                                    onClick={() => handleEliminarDefinitivo(n)}
                                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-sm font-bold px-4 py-2 rounded-xl transition-all active:scale-95"
                                >
                                    <Trash2 size={14} /> Eliminar definitivo
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Papelera;
