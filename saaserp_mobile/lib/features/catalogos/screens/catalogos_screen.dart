import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/services/api_service.dart';
import '../../../models/models.dart';

class CatalogosScreen extends StatefulWidget {
  final String negocioId;
  final String sistemaAsignado;
  const CatalogosScreen({Key? key, required this.negocioId, required this.sistemaAsignado}) : super(key: key);

  @override
  State<CatalogosScreen> createState() => _CatalogosScreenState();
}

class _CatalogosScreenState extends State<CatalogosScreen> {
  final ApiService _api = ApiService();
  List<Servicio> _servicios = [];
  bool _isLoading = true;
  String _search = '';
  bool _showCreateModal = false;

  String get _titulo => widget.sistemaAsignado == 'PARQUEADERO' ? 'Tarifas'
      : widget.sistemaAsignado == 'CITAS' ? 'Servicios'
      : 'Catálogo';

  // Form state
  final _nombreCtrl = TextEditingController();
  final _precioCtrl = TextEditingController();
  bool _activo = true;

  @override
  void initState() {
    super.initState();
    _fetchServicios();
  }

  Future<void> _fetchServicios() async {
    setState(() => _isLoading = true);
    try {
      final res = await _api.get('/Servicios/negocio/${widget.negocioId}');
      if (res.statusCode == 200) {
        final List data = jsonDecode(res.body);
        setState(() => _servicios = data.map((s) => Servicio.fromJson(s)).toList());
      }
    } catch (e) {
      print('Catalogos error: $e');
    }
    setState(() => _isLoading = false);
  }

  Future<void> _toggleEstado(Servicio s) async {
    await _api.put('/Servicios/${s.id}', {
      ...{
        'id': s.id,
        'negocioId': int.tryParse(widget.negocioId) ?? 0,
        'nombre': s.nombre,
        'precio': s.precio,
        'duracionEstimadaMinutos': s.duracionEstimadaMinutos,
        'esPorFraccion': false,
        'activo': !s.activo,
      }
    });
    _fetchServicios();
  }

  Future<void> _createServicio() async {
    final nombre = _nombreCtrl.text.trim();
    final precio = double.tryParse(_precioCtrl.text.trim()) ?? 0;
    if (nombre.isEmpty || precio <= 0) return;

    await _api.post('/Servicios', {
      'negocioId': int.tryParse(widget.negocioId) ?? 0,
      'nombre': nombre,
      'precio': precio,
      'duracionEstimadaMinutos': 0,
      'esPorFraccion': false,
      'activo': _activo,
    });

    _nombreCtrl.clear();
    _precioCtrl.clear();
    setState(() => _showCreateModal = false);
    _fetchServicios();
  }

  @override
  Widget build(BuildContext context) {
    final filtrados = _servicios.where((s) =>
        s.nombre.toLowerCase().contains(_search.toLowerCase())).toList();

    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E293B),
        foregroundColor: Colors.white,
        automaticallyImplyLeading: false,
        title: Text(_titulo, style: GoogleFonts.inter(fontWeight: FontWeight.w800, fontSize: 18)),
        actions: [
          IconButton(
            icon: const Icon(Icons.add_circle_outline),
            onPressed: () => setState(() => _showCreateModal = true),
          ),
        ],
      ),
      body: Stack(
        children: [
          Column(
            children: [
              // Search
              Padding(
                padding: const EdgeInsets.all(16),
                child: TextField(
                  style: GoogleFonts.inter(),
                  decoration: InputDecoration(
                    hintText: 'Buscar...',
                    hintStyle: GoogleFonts.inter(color: Colors.grey[400]),
                    prefixIcon: const Icon(Icons.search, color: Colors.grey),
                    filled: true,
                    fillColor: Colors.white,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: BorderSide.none,
                    ),
                    contentPadding: const EdgeInsets.symmetric(vertical: 0),
                  ),
                  onChanged: (v) => setState(() => _search = v),
                ),
              ),
              Expanded(
                child: _isLoading
                    ? const Center(child: CircularProgressIndicator())
                    : filtrados.isEmpty
                        ? Center(child: Text('Sin artículos en el catálogo',
                            style: GoogleFonts.inter(color: Colors.grey[500])))
                        : RefreshIndicator(
                            onRefresh: _fetchServicios,
                            child: ListView.builder(
                              padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                              itemCount: filtrados.length,
                              itemBuilder: (_, i) {
                                final s = filtrados[i];
                                return Container(
                                  margin: const EdgeInsets.only(bottom: 10),
                                  padding: const EdgeInsets.all(16),
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(16),
                                    boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8)],
                                  ),
                                  child: Row(
                                    children: [
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(s.nombre,
                                                style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 15)),
                                            Text('\$${s.precio.toStringAsFixed(2)}',
                                                style: GoogleFonts.inter(
                                                    color: Colors.indigo, fontSize: 16, fontWeight: FontWeight.w900)),
                                          ],
                                        ),
                                      ),
                                      Switch(
                                        value: s.activo,
                                        activeColor: Colors.indigo,
                                        onChanged: (_) => _toggleEstado(s),
                                      ),
                                    ],
                                  ),
                                );
                              },
                            ),
                          ),
              ),
            ],
          ),
          if (_showCreateModal) _buildCreateModal(),
        ],
      ),
    );
  }

  Widget _buildCreateModal() {
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
              Row(
                children: [
                  Text('Nuevo Artículo',
                      style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.bold)),
                  const Spacer(),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => setState(() => _showCreateModal = false),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _nombreCtrl,
                decoration: InputDecoration(
                  labelText: 'Nombre',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _precioCtrl,
                keyboardType: TextInputType.number,
                decoration: InputDecoration(
                  labelText: 'Precio',
                  prefixText: '\$ ',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
              const SizedBox(height: 20),
              ElevatedButton(
                onPressed: _createServicio,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.indigo,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                child: Text('Guardar en Catálogo',
                    style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  void dispose() {
    _nombreCtrl.dispose();
    _precioCtrl.dispose();
    super.dispose();
  }
}
