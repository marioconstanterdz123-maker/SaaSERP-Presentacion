import { useState, useEffect } from 'react';
import { Star, Gift, Trash2, Plus, Edit2, Save, X } from 'lucide-react';
import { useParams } from 'react-router-dom';
import axiosInstance from '../api/axiosConfig';

interface Regla {
  id?: number;
  negocioId?: number;
  nombre: string;
  citasRequeridas: number;
  ventanaMeses: number;
  nivelNombre: string;
  descuento: number;
  activa: boolean;
}

const EMPTY: Regla = {
  nombre: '', citasRequeridas: 3, ventanaMeses: 6, nivelNombre: '', descuento: 0, activa: true
};

export default function Lealtad() {
  const { negocioId } = useParams();
  const [reglas, setReglas] = useState<Regla[]>([]);
  const [editando, setEditando] = useState<Regla | null>(null);
  const [creando, setCreando] = useState(false);

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    const r = await axiosInstance.get(`/ReglasBonificacion/negocio/${negocioId}`);
    setReglas(r.data);
  }

  async function guardar(regla: Regla) {
    const isNew = !regla.id;
    const body = { ...regla, negocioId: Number(negocioId) };
    if (isNew) {
      await axiosInstance.post('/ReglasBonificacion', body);
    } else {
      await axiosInstance.put(`/ReglasBonificacion/${regla.id}`, body);
    }
    setEditando(null); setCreando(false); cargar();
  }

  async function eliminar(id: number) {
    if (!confirm('¿Eliminar esta regla?')) return;
    await axiosInstance.delete(`/ReglasBonificacion/${id}`);
    cargar();
  }

  const reglaEnEdicion = editando || (creando ? { ...EMPTY } : null);

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Star className="text-amber-500" size={22} />
          <h1 className="text-xl font-bold text-slate-800">Programa de Lealtad</h1>
        </div>
        <button
          onClick={() => { setCreando(true); setEditando(null); }}
          className="flex items-center gap-1 bg-amber-500 text-white px-3 py-2 rounded-xl text-sm font-medium hover:bg-amber-600 transition-colors"
        >
          <Plus size={16} /> Nueva regla
        </button>
      </div>

      <p className="text-xs text-slate-500">
        Define reglas de bonificación. Cuando un cliente completa el número de citas en la ventana de tiempo, obtiene automáticamente su nivel y descuento.
      </p>

      {/* Reglas */}
      {reglas.map(r => (
        <div key={r.id} className={`bg-white rounded-2xl shadow-sm border p-4 ${r.activa ? 'border-amber-100' : 'border-slate-100 opacity-60'}`}>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Gift size={16} className="text-amber-500" />
                <span className="font-semibold text-slate-800">{r.nombre}</span>
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">{r.nivelNombre}</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                <span className="font-medium text-slate-700">{r.citasRequeridas} citas</span> en los últimos{' '}
                <span className="font-medium text-slate-700">{r.ventanaMeses} meses</span> →{' '}
                <span className="font-medium text-emerald-600">{r.descuento}% descuento</span>
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => { setEditando(r); setCreando(false); }} className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors">
                <Edit2 size={14} />
              </button>
              <button onClick={() => r.id && eliminar(r.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>
      ))}

      {reglas.length === 0 && !creando && (
        <div className="text-center py-12 text-slate-400">
          <Star size={40} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">Aún no hay reglas configuradas</p>
        </div>
      )}

      {/* Modal editar/crear */}
      {reglaEnEdicion && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">{editando ? 'Editar Regla' : 'Nueva Regla'}</h2>
              <button onClick={() => { setEditando(null); setCreando(false); }}><X size={18} className="text-slate-400" /></button>
            </div>

            <input placeholder="Nombre (ej: Suscripción VIP)"
              value={reglaEnEdicion.nombre} onChange={e => setEditando({ ...reglaEnEdicion, nombre: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
            <input placeholder="Nombre del nivel (ej: VIP, Premium)"
              value={reglaEnEdicion.nivelNombre} onChange={e => setEditando({ ...reglaEnEdicion, nivelNombre: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs text-slate-500 block mb-1">Citas necesarias</label>
                <input type="number" min={1} value={reglaEnEdicion.citasRequeridas}
                  onChange={e => setEditando({ ...reglaEnEdicion, citasRequeridas: +e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Ventana (meses)</label>
                <input type="number" min={1} value={reglaEnEdicion.ventanaMeses}
                  onChange={e => setEditando({ ...reglaEnEdicion, ventanaMeses: +e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Descuento %</label>
                <input type="number" min={0} max={100} value={reglaEnEdicion.descuento}
                  onChange={e => setEditando({ ...reglaEnEdicion, descuento: +e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
              <input type="checkbox" checked={reglaEnEdicion.activa}
                onChange={e => setEditando({ ...reglaEnEdicion, activa: e.target.checked })}
                className="w-4 h-4 rounded accent-amber-500" />
              Regla activa
            </label>

            <div className="flex gap-2 pt-2">
              <button onClick={() => { setEditando(null); setCreando(false); }}
                className="flex-1 border border-slate-200 text-slate-600 rounded-xl py-2 text-sm hover:bg-slate-50">
                Cancelar
              </button>
              <button onClick={() => guardar(reglaEnEdicion)} disabled={!reglaEnEdicion.nombre || !reglaEnEdicion.nivelNombre}
                className="flex-1 flex items-center justify-center gap-1 bg-amber-500 text-white rounded-xl py-2 text-sm font-medium hover:bg-amber-600 disabled:opacity-50">
                <Save size={14} /> Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
