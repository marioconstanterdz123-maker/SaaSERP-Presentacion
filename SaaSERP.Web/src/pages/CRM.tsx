import { useState, useEffect } from 'react';
import { BookUser, Search, Phone, Star, ChevronRight, Calendar } from 'lucide-react';
import { useParams } from 'react-router-dom';
import axiosInstance from '../api/axiosConfig';

interface Cliente {
  id: number;
  telefono: string;
  nombreDetectado: string | null;
  primerContacto: string;
  ultimaInteraccion: string;
  totalCitasCompletadas: number;
  nivelLealtad: string | null;
  descuentoActivo: number;
}

interface DetalleCita {
  id: number;
  fechaHoraInicio: string;
  estado: string;
  trabajadorId: number | null;
}

const NIVEL_COLORS: Record<string, string> = {
  VIP: 'text-amber-700 bg-amber-100',
  Premium: 'text-violet-700 bg-violet-100',
  Regular: 'text-slate-600 bg-slate-100',
};

export default function CRM() {
  const { negocioId } = useParams();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [filtro, setFiltro] = useState('');
  const [seleccionado, setSeleccionado] = useState<{ cliente: Cliente; citas: DetalleCita[] } | null>(null);

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    const r = await axiosInstance.get(`/ClientesCRM/negocio/${negocioId}`);
    setClientes(r.data);
  }

  async function verDetalle(c: Cliente) {
    const r = await axiosInstance.get(`/ClientesCRM/negocio/${negocioId}/cliente/${c.telefono}`);
    setSeleccionado({ cliente: r.data.cliente, citas: r.data.citas });
  }

  const filtrados = clientes.filter(c =>
    (c.nombreDetectado || '').toLowerCase().includes(filtro.toLowerCase()) ||
    c.telefono.includes(filtro)
  );

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <BookUser className="text-violet-600" size={22} />
        <h1 className="text-xl font-bold text-slate-800">CRM de Clientes</h1>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          placeholder="Buscar por nombre o teléfono..."
          value={filtro}
          onChange={e => setFiltro(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3 text-center">
          <p className="text-2xl font-bold text-violet-600">{clientes.length}</p>
          <p className="text-xs text-slate-500">Total clientes</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3 text-center">
          <p className="text-2xl font-bold text-amber-500">{clientes.filter(c => c.nivelLealtad).length}</p>
          <p className="text-xs text-slate-500">Con nivel</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3 text-center">
          <p className="text-2xl font-bold text-emerald-600">{clientes.reduce((a, c) => a + c.totalCitasCompletadas, 0)}</p>
          <p className="text-xs text-slate-500">Citas completadas</p>
        </div>
      </div>

      {/* Lista */}
      <div className="space-y-2">
        {filtrados.map(c => (
          <button
            key={c.id}
            onClick={() => verDetalle(c)}
            className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center justify-between hover:border-violet-200 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                {(c.nombreDetectado || c.telefono)[0].toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-sm">{c.nombreDetectado || 'Desconocido'}</p>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Phone size={10} />
                  <span>{c.telefono}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {c.nivelLealtad && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${NIVEL_COLORS[c.nivelLealtad] || 'text-slate-600 bg-slate-100'}`}>
                  {c.nivelLealtad}
                </span>
              )}
              <div className="text-right">
                <p className="text-xs font-medium text-slate-600">{c.totalCitasCompletadas} citas</p>
                <p className="text-xs text-slate-400">{c.descuentoActivo > 0 ? `${c.descuentoActivo}% dto.` : ''}</p>
              </div>
              <ChevronRight size={16} className="text-slate-300" />
            </div>
          </button>
        ))}
        {filtrados.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <BookUser size={40} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">{filtro ? 'Sin resultados' : 'Aún no hay clientes registrados'}</p>
          </div>
        )}
      </div>

      {/* Drawer detalle */}
      {seleccionado && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end justify-center" onClick={() => setSeleccionado(null)}>
          <div className="bg-white rounded-t-3xl shadow-2xl p-6 w-full max-w-md space-y-4 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl">
                {(seleccionado.cliente.nombreDetectado || seleccionado.cliente.telefono)[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="font-bold text-slate-800 text-lg">{seleccionado.cliente.nombreDetectado || 'Desconocido'}</p>
                <p className="text-sm text-slate-500 flex items-center gap-1"><Phone size={12} /> {seleccionado.cliente.telefono}</p>
              </div>
              {seleccionado.cliente.nivelLealtad && (
                <span className={`flex items-center gap-1 text-sm px-3 py-1 rounded-full font-medium ${NIVEL_COLORS[seleccionado.cliente.nivelLealtad] || 'text-slate-600 bg-slate-100'}`}>
                  <Star size={12} /> {seleccionado.cliente.nivelLealtad}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-500">Citas completadas</p>
                <p className="text-2xl font-bold text-violet-600">{seleccionado.cliente.totalCitasCompletadas}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-500">Descuento activo</p>
                <p className="text-2xl font-bold text-emerald-600">{seleccionado.cliente.descuentoActivo}%</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1"><Calendar size={12} /> Historial de citas</p>
              {seleccionado.citas.length === 0 && <p className="text-xs text-slate-400">Sin historial</p>}
              <div className="space-y-1.5">
                {seleccionado.citas.map(c => (
                  <div key={c.id} className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2">
                    <span className="text-xs text-slate-600">{new Date(c.fechaHoraInicio).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.estado === 'Completada' ? 'bg-emerald-100 text-emerald-700' : c.estado === 'Cancelada' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                      {c.estado}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 text-xs text-slate-400 flex justify-between">
              <span>{new Date(seleccionado.cliente.primerContacto).toLocaleDateString('es-MX')}</span>
              <span>Última interacción: {new Date(seleccionado.cliente.ultimaInteraccion).toLocaleDateString('es-MX')}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
