import { useState, useEffect } from 'react';
import { Users, Plus, Trash2, Wifi, WifiOff, QrCode, Clock, Save, ChevronDown } from 'lucide-react';
import { useParams } from 'react-router-dom';
import axiosInstance from '../api/axiosConfig';

const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

interface Horario {
  id?: number;
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
}

interface Trabajador {
  id: number;
  nombre: string;
  telefono: string | null;
  email: string | null;
  instanciaWhatsApp: string | null;
  activo: boolean;
  horarios: Horario[];
}

export default function Trabajadores() {
  const { negocioId } = useParams();
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([]);
  const [creando, setCreando] = useState(false);
  const [qrModal, setQrModal] = useState<{ id: number; qr: string } | null>(null);
  const [expandido, setExpandido] = useState<number | null>(null);
  const [waStatus, setWaStatus] = useState<Record<number, boolean>>({});
  const [form, setForm] = useState({ nombre: '', telefono: '', email: '' });
  const [horarios, setHorarios] = useState<Horario[]>([]);


  useEffect(() => { cargar(); }, []);

  async function cargar() {
    const r = await axiosInstance.get(`/Trabajadores/negocio/${negocioId}`);
    const data: Trabajador[] = r.data;
    setTrabajadores(data);
    data.forEach(async (t) => {
      if (t.instanciaWhatsApp) {
        try {
          const s = await axiosInstance.get(`/WhatsApp/trabajador/${t.id}/estado`);
          setWaStatus(prev => ({ ...prev, [t.id]: s.data.conectado }));
        } catch { /* pass */ }
      }
    });
  }

  function agregarHorario() {
    setHorarios([...horarios, { diaSemana: 1, horaInicio: '09:00:00', horaFin: '18:00:00' }]);
  }

  async function guardar() {
    const payload = {
      negocioId: Number(negocioId),
      ...form,
      horarios: horarios.map(h => ({
        diaSemana: h.diaSemana,
        horaInicio: h.horaInicio,
        horaFin: h.horaFin
      }))
    };
    await axiosInstance.post('/Trabajadores', payload);
    setCreando(false); setForm({ nombre: '', telefono: '', email: '' }); setHorarios([]); cargar();
  }

  async function crearInstanciaWA(id: number) {
    await axiosInstance.post(`/WhatsApp/trabajador/${id}/crear`);
    cargar();
    mostrarQr(id);
  }

  async function mostrarQr(id: number) {
    const r = await axiosInstance.get(`/WhatsApp/trabajador/${id}/qr`);
    const base64 = r.data.base64 || r.data.qrcode?.base64 || '';
    setQrModal({ id, qr: base64 });
  }

  async function eliminarTrabajador(id: number) {
    if (!confirm('¿Desactivar este tatuador?')) return;
    await axiosInstance.delete(`/Trabajadores/${id}`);
    cargar();
  }

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Users className="text-violet-600" size={22} />
          <h1 className="text-xl font-bold text-slate-800">Equipo de Tatuadores</h1>
        </div>
        <button
          onClick={() => setCreando(true)}
          className="flex items-center gap-1 bg-violet-600 text-white px-3 py-2 rounded-xl text-sm font-medium hover:bg-violet-700 transition-colors"
        >
          <Plus size={16} /> Agregar
        </button>
      </div>

      {/* Lista */}
      {trabajadores.map(t => (
        <div key={t.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div
            className="flex items-center justify-between p-4 cursor-pointer"
            onClick={() => setExpandido(expandido === t.id ? null : t.id)}
          >
            <div>
              <p className="font-semibold text-slate-800">{t.nombre}</p>
              <p className="text-xs text-slate-400">{t.telefono || 'Sin teléfono'} · {t.email || 'Sin email'}</p>
            </div>
            <div className="flex items-center gap-2">
              {t.instanciaWhatsApp ? (
                waStatus[t.id]
                  ? <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full"><Wifi size={12} /> Conectado</span>
                  : <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full"><WifiOff size={12} /> Desconectado</span>
              ) : (
                <span className="text-xs text-slate-400">Sin WA</span>
              )}
              <ChevronDown size={16} className={`text-slate-400 transition-transform ${expandido === t.id ? 'rotate-180' : ''}`} />
            </div>
          </div>

          {expandido === t.id && (
            <div className="px-4 pb-4 border-t border-slate-50 space-y-3 pt-3">
              {/* Horarios */}
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1"><Clock size={12} /> Horarios semanales</p>
                <div className="grid grid-cols-2 gap-1">
                  {t.horarios.length === 0 && <p className="text-xs text-slate-400 col-span-2">Sin horarios configurados</p>}
                  {t.horarios.map(h => (
                    <div key={h.id} className="bg-slate-50 rounded-lg px-2 py-1 text-xs text-slate-600">
                      <span className="font-medium">{DIAS[h.diaSemana]}</span>: {h.horaInicio.slice(0,5)}–{h.horaFin.slice(0,5)}
                    </div>
                  ))}
                </div>
              </div>

              {/* WhatsApp */}
              <div className="flex gap-2 flex-wrap">
                {!t.instanciaWhatsApp ? (
                  <button
                    onClick={() => crearInstanciaWA(t.id)}
                    className="flex items-center gap-1 text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Wifi size={12} /> Conectar WhatsApp
                  </button>
                ) : (
                  <button
                    onClick={() => mostrarQr(t.id)}
                    className="flex items-center gap-1 text-xs bg-violet-100 text-violet-700 px-3 py-1.5 rounded-lg hover:bg-violet-200 transition-colors"
                  >
                    <QrCode size={12} /> Ver QR
                  </button>
                )}
                <button
                  onClick={() => eliminarTrabajador(t.id)}
                  className="flex items-center gap-1 text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors ml-auto"
                >
                  <Trash2 size={12} /> Desactivar
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {trabajadores.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <Users size={40} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">Aún no hay tatuadores registrados</p>
        </div>
      )}

      {/* Modal crear */}
      {creando && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-bold text-slate-800">Nuevo Tatuador</h2>
            <input
              placeholder="Nombre *"
              value={form.nombre}
              onChange={e => setForm({ ...form, nombre: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
            <input
              placeholder="Teléfono (con lada, ej: 521234567890)"
              value={form.telefono}
              onChange={e => setForm({ ...form, telefono: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
            <input
              placeholder="Email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
            />

            {/* Horarios inline */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-slate-500">Horarios (opcional)</p>
                <button onClick={agregarHorario} className="text-xs text-violet-600 hover:underline">+ Agregar</button>
              </div>
              {horarios.map((h, i) => (
                <div key={i} className="flex gap-2 mb-2 items-center">
                  <select
                    value={h.diaSemana}
                    onChange={e => { const hs = [...horarios]; hs[i].diaSemana = +e.target.value; setHorarios(hs); }}
                    className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 flex-1"
                  >
                    {DIAS.map((d, idx) => <option key={idx} value={idx}>{d}</option>)}
                  </select>
                  <input type="time" value={h.horaInicio.slice(0,5)}
                    onChange={e => { const hs = [...horarios]; hs[i].horaInicio = e.target.value + ':00'; setHorarios(hs); }}
                    className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 flex-1" />
                  <input type="time" value={h.horaFin.slice(0,5)}
                    onChange={e => { const hs = [...horarios]; hs[i].horaFin = e.target.value + ':00'; setHorarios(hs); }}
                    className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 flex-1" />
                  <button onClick={() => setHorarios(horarios.filter((_, j) => j !== i))} className="text-red-400"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={() => setCreando(false)} className="flex-1 border border-slate-200 text-slate-600 rounded-xl py-2 text-sm hover:bg-slate-50">Cancelar</button>
              <button onClick={guardar} disabled={!form.nombre} className="flex-1 flex items-center justify-center gap-1 bg-violet-600 text-white rounded-xl py-2 text-sm font-medium hover:bg-violet-700 disabled:opacity-50">
                <Save size={14} /> Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal QR */}
      {qrModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setQrModal(null)}>
          <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-xs text-center space-y-4" onClick={e => e.stopPropagation()}>
            <h2 className="font-bold text-slate-800">Escanea el QR</h2>
            <p className="text-xs text-slate-500">Abre WhatsApp → Dispositivos vinculados → Vincular dispositivo</p>
            {qrModal.qr
              ? <img src={qrModal.qr} alt="QR WhatsApp" className="mx-auto rounded-xl w-48 h-48 object-contain" />
              : <p className="text-xs text-amber-600">El QR aún está generándose. Espera 5s y recarga.</p>
            }
            <button onClick={() => setQrModal(null)} className="w-full border border-slate-200 rounded-xl py-2 text-sm text-slate-600">Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}
