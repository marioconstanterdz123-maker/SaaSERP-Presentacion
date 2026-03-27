import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/services/api_service.dart';

class HistorialScreen extends StatefulWidget {
  final String negocioId;
  const HistorialScreen({Key? key, required this.negocioId}) : super(key: key);

  @override
  State<HistorialScreen> createState() => _HistorialScreenState();
}

class _HistorialScreenState extends State<HistorialScreen> {
  final ApiService _api = ApiService();
  List<dynamic> _comandas = [];
  bool _isLoading = true;
  String _periodo = 'hoy';

  final _periodos = [
    {'label': 'Hoy', 'value': 'hoy'},
    {'label': '7 días', 'value': 'semana'},
    {'label': '30 días', 'value': 'mes'},
  ];

  double get _totalIngresos =>
      _comandas.fold(0.0, (sum, c) => sum + ((c['total'] ?? 0) as num).toDouble());

  @override
  void initState() {
    super.initState();
    _fetchHistorial();
  }

  Future<void> _fetchHistorial() async {
    setState(() => _isLoading = true);
    try {
      final res = await _api.get('/Reportes/historial/${widget.negocioId}?periodo=$_periodo');
      if (res.statusCode == 200) {
        setState(() => _comandas = jsonDecode(res.body));
      }
    } catch (e) {
      print('Historial error: $e');
    }
    setState(() => _isLoading = false);
  }

  Color _estadoColor(String estado) {
    switch (estado) {
      case 'Cobrada': return Colors.green;
      case 'Entregada': return Colors.blue;
      case 'Lista': return Colors.teal;
      case 'En Preparacion': return Colors.orange;
      default: return Colors.grey;
    }
  }

  String _formatDate(String fechaIso) {
    try {
      final dt = DateTime.parse(fechaIso).toLocal();
      return '${dt.day.toString().padLeft(2,'0')}/${dt.month.toString().padLeft(2,'0')} ${dt.hour.toString().padLeft(2,'0')}:${dt.minute.toString().padLeft(2,'0')}';
    } catch (_) {
      return fechaIso;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E293B),
        foregroundColor: Colors.white,
        automaticallyImplyLeading: false,
        title: Text('Historial de Ventas',
            style: GoogleFonts.inter(fontWeight: FontWeight.w800, fontSize: 18)),
      ),
      body: Column(
        children: [
          // Period selector
          Container(
            color: const Color(0xFF1E293B),
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            child: Row(
              children: _periodos.map((p) {
                final active = _periodo == p['value'];
                return Expanded(
                  child: GestureDetector(
                    onTap: () {
                      setState(() => _periodo = p['value']!);
                      _fetchHistorial();
                    },
                    child: Container(
                      margin: const EdgeInsets.only(right: 8),
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      decoration: BoxDecoration(
                        color: active ? Colors.indigo : Colors.white12,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      alignment: Alignment.center,
                      child: Text(p['label']!,
                          style: GoogleFonts.inter(
                            color: active ? Colors.white : Colors.white54,
                            fontWeight: FontWeight.bold,
                            fontSize: 13,
                          )),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),

          // Totals banner
          if (!_isLoading)
            Container(
              margin: const EdgeInsets.all(16),
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF4F46E5), Color(0xFF7C3AED)],
                ),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Total del Período',
                          style: GoogleFonts.inter(color: Colors.white70, fontSize: 13)),
                      Text('\$${_totalIngresos.toStringAsFixed(2)}',
                          style: GoogleFonts.inter(
                              color: Colors.white, fontSize: 28, fontWeight: FontWeight.w900)),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.white12,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Text('${_comandas.length}\nventas',
                        textAlign: TextAlign.center,
                        style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            ),

          // List
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _comandas.isEmpty
                    ? Center(
                        child: Text('Sin ventas en este período',
                            style: GoogleFonts.inter(color: Colors.grey[500])))
                    : RefreshIndicator(
                        onRefresh: _fetchHistorial,
                        child: ListView.builder(
                          padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                          itemCount: _comandas.length,
                          itemBuilder: (_, i) {
                            final c = _comandas[i];
                            final estado = c['estado'] ?? '';
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
                                  Container(
                                    width: 4,
                                    height: 48,
                                    decoration: BoxDecoration(
                                      color: _estadoColor(estado),
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(c['nombreCliente'] ?? 'Cliente',
                                            style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
                                        Text(
                                          '${c['tipoAtencion']} • #${c['id']}',
                                          style: GoogleFonts.inter(color: Colors.grey[500], fontSize: 12),
                                        ),
                                        Text(_formatDate(c['fechaCreacion'] ?? ''),
                                            style: GoogleFonts.inter(color: Colors.grey[400], fontSize: 11)),
                                      ],
                                    ),
                                  ),
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.end,
                                    children: [
                                      Text('\$${(c['total'] ?? 0).toStringAsFixed(2)}',
                                          style: GoogleFonts.inter(
                                              fontWeight: FontWeight.w900, fontSize: 16, color: Colors.indigo)),
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: _estadoColor(estado).withOpacity(0.1),
                                          borderRadius: BorderRadius.circular(8),
                                        ),
                                        child: Text(estado,
                                            style: GoogleFonts.inter(
                                                color: _estadoColor(estado),
                                                fontSize: 10,
                                                fontWeight: FontWeight.bold)),
                                      ),
                                    ],
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
    );
  }
}
