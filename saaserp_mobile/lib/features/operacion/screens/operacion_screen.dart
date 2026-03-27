import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/services/api_service.dart';
import '../../../models/models.dart';

class OperacionScreen extends StatefulWidget {
  final String negocioId;
  final String sistemaAsignado;

  const OperacionScreen({
    Key? key,
    required this.negocioId,
    required this.sistemaAsignado,
  }) : super(key: key);

  @override
  State<OperacionScreen> createState() => _OperacionScreenState();
}

class _OperacionScreenState extends State<OperacionScreen> {
  final ApiService _api = ApiService();
  List<dynamic> _comandas = [];
  List<Vehiculo> _vehiculos = [];
  List<Cita> _citas = [];
  bool _isLoading = true;
  String _filtro = 'TODAS';
  Timer? _timer;
  bool _placaModalOpen = false;
  final _placaController = TextEditingController();
  final _telefonoController = TextEditingController();

  static const _filtros = ['TODAS', 'Recibida', 'En Preparacion', 'Lista', 'Entregada'];
  static const _estadoColors = {
    'Recibida': Color(0xFFFEF9C3),
    'En Preparacion': Color(0xFFFFFBEB),
    'Lista': Color(0xFFD1FAE5),
    'Entregada': Color(0xFFDBEAFE),
    'Cobrada': Color(0xFFF1F5F9),
  };
  static const _estadoTextColors = {
    'Recibida': Color(0xFF854D0E),
    'En Preparacion': Color(0xFF92400E),
    'Lista': Color(0xFF065F46),
    'Entregada': Color(0xFF1E40AF),
    'Cobrada': Color(0xFF64748B),
  };

  @override
  void initState() {
    super.initState();
    _fetchData();
    _timer = Timer.periodic(const Duration(seconds: 10), (_) => _fetchData());
  }

  Future<void> _fetchData() async {
    try {
      if (widget.sistemaAsignado == 'PARQUEADERO') {
        final res = await _api.get('/Vehiculos/negocio/${widget.negocioId}/activos');
        if (res.statusCode == 200) {
          final List data = jsonDecode(res.body);
          setState(() => _vehiculos = data.map((v) => Vehiculo.fromJson(v)).toList());
        }
      } else if (widget.sistemaAsignado == 'CITAS') {
        final res = await _api.get('/Citas/activas');
        if (res.statusCode == 200) {
          final List data = jsonDecode(res.body);
          setState(() => _citas = data.map((c) => Cita.fromJson(c)).toList());
        }
      } else {
        final res = await _api.get('/Comandas/activas');
        if (res.statusCode == 200) {
          setState(() => _comandas = jsonDecode(res.body));
        }
      }
      if (_isLoading) setState(() => _isLoading = false);
    } catch (e) {
      setState(() => _isLoading = false);
      print('Error: $e');
    }
  }

  Future<void> _cambiarEstadoComanda(int comandaId, String nuevoEstado) async {
    await _api.put('/Comandas/$comandaId/estado', {'estado': nuevoEstado});
    await _fetchData();
  }

  Future<void> _registrarVehiculo() async {
    final placa = _placaController.text.trim().toUpperCase();
    if (placa.isEmpty) return;
    await _api.post('/Vehiculos', {
      'negocioId': int.tryParse(widget.negocioId) ?? 0,
      'placa': placa,
      'telefono': _telefonoController.text.trim(),
    });
    setState(() => _placaModalOpen = false);
    _placaController.clear();
    _telefonoController.clear();
    await _fetchData();
  }

  Future<void> _cobrarVehiculo(Vehiculo v) async {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: Text('Cobrar: ${v.placa}', style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Tiempo: ${v.tiempoTranscurrido}', style: GoogleFonts.inter()),
            const SizedBox(height: 8),
            Text(
              'Total: \$${v.cobroPreliminar.toStringAsFixed(2)}',
              style: GoogleFonts.inter(
                fontSize: 24,
                fontWeight: FontWeight.w900,
                color: Colors.indigo,
              ),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancelar')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.indigo),
            onPressed: () async {
              Navigator.pop(context);
              await _api.put('/Vehiculos/${v.id}/cobrar', {});
              await _fetchData();
            },
            child: Text('Confirmar Cobro', style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E293B),
        foregroundColor: Colors.white,
        title: Text(
          widget.sistemaAsignado == 'PARQUEADERO' ? '🅿️ Parqueadero' :
          widget.sistemaAsignado == 'CITAS' ? '✂️ Citas' : '👨‍🍳 Cocina (KDS)',
          style: GoogleFonts.inter(fontWeight: FontWeight.w800, fontSize: 18),
        ),
        actions: [
          if (widget.sistemaAsignado == 'PARQUEADERO')
            IconButton(
              icon: const Icon(Icons.add_circle_outline),
              onPressed: () => setState(() => _placaModalOpen = true),
              tooltip: 'Registrar Vehículo',
            ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _fetchData,
          ),
        ],
      ),
      body: Stack(
        children: [
          if (_isLoading)
            const Center(child: CircularProgressIndicator())
          else if (widget.sistemaAsignado == 'PARQUEADERO')
            _buildParqueadero()
          else if (widget.sistemaAsignado == 'CITAS')
            _buildCitas()
          else
            _buildKds(),
          
          // Placa modal
          if (_placaModalOpen) _buildPlacaModal(),
        ],
      ),
    );
  }

  Widget _buildKds() {
    final filtradas = _filtro == 'TODAS'
        ? _comandas
        : _comandas.where((c) => c['estado'] == _filtro).toList();

    return Column(
      children: [
        // Filter bar
        SizedBox(
          height: 58,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            itemCount: _filtros.length,
            itemBuilder: (_, i) {
              final f = _filtros[i];
              final active = _filtro == f;
              return GestureDetector(
                onTap: () => setState(() => _filtro = f),
                child: Container(
                  margin: const EdgeInsets.only(right: 8),
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  decoration: BoxDecoration(
                    color: active ? Colors.indigo : Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: active ? Colors.indigo : Colors.grey[300]!),
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    f,
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: active ? Colors.white : Colors.grey[700],
                    ),
                  ),
                ),
              );
            },
          ),
        ),
        // Orders list
        Expanded(
          child: filtradas.isEmpty
              ? Center(child: Text('No hay comandas', style: GoogleFonts.inter(color: Colors.grey[500])))
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: filtradas.length,
                  itemBuilder: (_, i) => _KdsCard(
                    comanda: filtradas[i],
                    onEstadoChange: _cambiarEstadoComanda,
                    estadoColors: _estadoColors,
                    estadoTextColors: _estadoTextColors,
                  ),
                ),
        ),
      ],
    );
  }

  Widget _buildParqueadero() {
    return Column(
      children: [
        Container(
          margin: const EdgeInsets.all(16),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.indigo,
            borderRadius: BorderRadius.circular(20),
          ),
          child: Row(
            children: [
              const Icon(Icons.directions_car, color: Colors.white, size: 32),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Vehículos Activos',
                      style: GoogleFonts.inter(color: Colors.white70, fontSize: 12)),
                  Text('${_vehiculos.length}',
                      style: GoogleFonts.inter(
                          color: Colors.white, fontSize: 32, fontWeight: FontWeight.w900)),
                ],
              ),
            ],
          ),
        ),
        Expanded(
          child: _vehiculos.isEmpty
              ? Center(child: Text('Sin vehículos activos', style: GoogleFonts.inter(color: Colors.grey[500])))
              : ListView.builder(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                  itemCount: _vehiculos.length,
                  itemBuilder: (_, i) => _VehiculoCard(
                    vehiculo: _vehiculos[i],
                    onCobrar: () => _cobrarVehiculo(_vehiculos[i]),
                  ),
                ),
        ),
      ],
    );
  }

  Widget _buildCitas() {
    return _citas.isEmpty
        ? Center(child: Text('No hay citas activas', style: GoogleFonts.inter(color: Colors.grey[500])))
        : ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: _citas.length,
            itemBuilder: (_, i) => _CitaCard(cita: _citas[i], api: _api, onRefresh: _fetchData),
          );
  }

  Widget _buildPlacaModal() {
    return Container(
      color: Colors.black54,
      child: Center(
        child: Container(
          margin: const EdgeInsets.all(24),
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(24),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text('Registrar Vehículo',
                  style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.bold)),
              const SizedBox(height: 20),
              TextField(
                controller: _placaController,
                textCapitalization: TextCapitalization.characters,
                decoration: InputDecoration(
                  labelText: 'Placa',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  prefixIcon: const Icon(Icons.directions_car),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _telefonoController,
                keyboardType: TextInputType.phone,
                decoration: InputDecoration(
                  labelText: 'Teléfono (opcional)',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  prefixIcon: const Icon(Icons.phone),
                ),
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(
                    child: TextButton(
                      onPressed: () => setState(() => _placaModalOpen = false),
                      child: const Text('Cancelar'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: _registrarVehiculo,
                      style: ElevatedButton.styleFrom(backgroundColor: Colors.indigo),
                      child: Text('Registrar',
                          style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.bold)),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  void dispose() {
    _timer?.cancel();
    _placaController.dispose();
    _telefonoController.dispose();
    super.dispose();
  }
}

class _KdsCard extends StatelessWidget {
  final dynamic comanda;
  final Function(int, String) onEstadoChange;
  final Map<String, Color> estadoColors;
  final Map<String, Color> estadoTextColors;

  const _KdsCard({
    required this.comanda,
    required this.onEstadoChange,
    required this.estadoColors,
    required this.estadoTextColors,
  });

  static const _estadoSiguiente = {
    'Recibida': 'En Preparacion',
    'En Preparacion': 'Lista',
    'Lista': 'Entregada',
    'Entregada': 'Cobrada',
  };

  @override
  Widget build(BuildContext context) {
    final estado = comanda['estado'] ?? '';
    final bgColor = estadoColors[estado] ?? const Color(0xFFF1F5F9);
    final textColor = estadoTextColors[estado] ?? Colors.grey;
    final siguiente = _estadoSiguiente[estado];

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 8, offset: const Offset(0,2))],
      ),
      child: Column(
        children: [
          // Header
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: bgColor,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        comanda['tipoAtencion'] == 'Mesa'
                            ? '🍽️ Mesa ${comanda['identificadorMesa']}'
                            : comanda['tipoAtencion'] == 'Llevar' ? '🛵 Para Llevar' : '🏪 Mostrador',
                        style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 15, color: textColor),
                      ),
                      Text('Comanda #${comanda['id']}',
                          style: GoogleFonts.inter(color: textColor.withOpacity(0.7), fontSize: 12)),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  decoration: BoxDecoration(
                    color: textColor.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(estado,
                      style: GoogleFonts.inter(color: textColor, fontWeight: FontWeight.bold, fontSize: 12)),
                ),
              ],
            ),
          ),
          // Items
          Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              children: [
                if (comanda['detalles'] != null)
                  ...List.from(comanda['detalles']).map((d) => Padding(
                    padding: const EdgeInsets.only(bottom: 6),
                    child: Row(
                      children: [
                        Container(
                          width: 28,
                          height: 28,
                          decoration: BoxDecoration(
                            color: Colors.indigo[50],
                            borderRadius: BorderRadius.circular(8),
                          ),
                          alignment: Alignment.center,
                          child: Text('${d['cantidad']}',
                              style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: Colors.indigo)),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(d['nombreServicio'] ?? '',
                              style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                        ),
                      ],
                    ),
                  )).toList(),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('\$${(comanda['total'] ?? 0).toStringAsFixed(2)}',
                        style: GoogleFonts.inter(fontWeight: FontWeight.w900, fontSize: 18, color: Colors.indigo)),
                    if (siguiente != null)
                      ElevatedButton(
                        onPressed: () => onEstadoChange(comanda['id'], siguiente),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.indigo,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        ),
                        child: Text('→ $siguiente',
                            style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 12)),
                      ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _VehiculoCard extends StatelessWidget {
  final Vehiculo vehiculo;
  final VoidCallback onCobrar;
  const _VehiculoCard({required this.vehiculo, required this.onCobrar});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 8, offset: const Offset(0,2))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.directions_car, size: 32, color: Colors.indigo),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(vehiculo.placa,
                        style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.w900, letterSpacing: 2)),
                    if (vehiculo.telefono != null)
                      Text(vehiculo.telefono!,
                          style: GoogleFonts.inter(color: Colors.grey[600], fontSize: 13)),
                  ],
                ),
              ),
              Text(vehiculo.tiempoTranscurrido,
                  style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: Colors.orange[700])),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Ingreso: ${vehiculo.horaIngreso}',
                  style: GoogleFonts.inter(color: Colors.grey[600], fontSize: 12)),
              ElevatedButton.icon(
                onPressed: onCobrar,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.green,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                icon: const Icon(Icons.attach_money, size: 16),
                label: Text('\$${vehiculo.cobroPreliminar.toStringAsFixed(2)}',
                    style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _CitaCard extends StatelessWidget {
  final Cita cita;
  final ApiService api;
  final VoidCallback onRefresh;
  const _CitaCard({required this.cita, required this.api, required this.onRefresh});

  String _formatHora(String fecha) {
    try {
      final dt = DateTime.parse(fecha);
      return '${dt.hour.toString().padLeft(2,'0')}:${dt.minute.toString().padLeft(2,'0')}';
    } catch (_) {
      return fecha;
    }
  }

  @override
  Widget build(BuildContext context) {
    const estadoColors = {
      'Pendiente': Colors.orange,
      'En Proceso': Colors.blue,
      'Completada': Colors.green,
      'Cancelada': Colors.red,
    };
    final color = estadoColors[cita.estado] ?? Colors.grey;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border(left: BorderSide(color: color, width: 4)),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 8)],
      ),
      child: Row(
        children: [
          Column(
            children: [
              Text(_formatHora(cita.fechaHoraInicio),
                  style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.w900, color: Colors.indigo)),
              Text('${cita.duracionMinutos}min',
                  style: GoogleFonts.inter(fontSize: 11, color: Colors.grey[500])),
            ],
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(cita.nombreCliente,
                    style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 15)),
                if (cita.nombreServicio != null)
                  Text(cita.nombreServicio!,
                      style: GoogleFonts.inter(color: Colors.grey[600], fontSize: 13)),
                if (cita.nombreRecurso != null)
                  Text('con ${cita.nombreRecurso}',
                      style: GoogleFonts.inter(color: Colors.grey[500], fontSize: 12)),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(cita.estado,
                style: GoogleFonts.inter(color: color, fontWeight: FontWeight.bold, fontSize: 12)),
          ),
        ],
      ),
    );
  }
}
