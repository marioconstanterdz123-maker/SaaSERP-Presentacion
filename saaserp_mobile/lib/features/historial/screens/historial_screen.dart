import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../../core/services/api_service.dart';
import '../../../core/widgets/fade_slide_in.dart';

// Matches the ESTADO_COLORS map in PuntoDeVenta.tsx exactly
class _EstadoStyle {
  final Color bg;
  final Color text;
  final Color border;
  const _EstadoStyle({required this.bg, required this.text, required this.border});
}

const _estadoStyles = {
  'Recibida':       _EstadoStyle(bg: Color(0xFFFEF9C3), text: Color(0xFF92400E), border: Color(0xFFFDE68A)),
  'En Preparacion': _EstadoStyle(bg: Color(0xFFFEF3C7), text: Color(0xFF92400E), border: Color(0xFFFCD34D)),
  'Lista':          _EstadoStyle(bg: Color(0xFFD1FAE5), text: Color(0xFF065F46), border: Color(0xFF6EE7B7)),
  'Entregada':      _EstadoStyle(bg: Color(0xFFDBEAFE), text: Color(0xFF1E3A5F), border: Color(0xFF93C5FD)),
  'Cobrada':        _EstadoStyle(bg: Color(0xFFF1F5F9), text: Color(0xFF64748B), border: Color(0xFFCBD5E1)),
};

_EstadoStyle _getEstado(String estado) =>
    _estadoStyles[estado] ??
    const _EstadoStyle(bg: Color(0xFFF1F5F9), text: Color(0xFF64748B), border: Color(0xFFCBD5E1));

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
  int? _expandedId;

  final _mxFmt = NumberFormat.currency(locale: 'es_MX', symbol: '\$');

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
      final res = await _api.get(
        '/Reportes/historial/${widget.negocioId}?periodo=$_periodo',
        headers: {'X-Negocio-Id': widget.negocioId},
      );
      if (res.statusCode == 200 && mounted) {
        setState(() => _comandas = jsonDecode(res.body));
      }
    } catch (e) {
      debugPrint('Historial error: $e');
    }
    if (mounted) setState(() => _isLoading = false);
  }

  String _formatDate(String? fechaIso) {
    if (fechaIso == null || fechaIso.isEmpty) return '';
    try {
      final dt = DateTime.parse(fechaIso).toLocal();
      return DateFormat('dd/MM HH:mm', 'es_MX').format(dt);
    } catch (_) {
      return fechaIso;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: FadeSlideIn(
        child: Column(
          children: [
            // Period filter tabs (light glass styling)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
              child: Row(
                children: _periodos.map((p) {
                  final active = _periodo == p['value'];
                  return Expanded(
                    child: GestureDetector(
                      onTap: () {
                        setState(() {
                          _periodo = p['value']!;
                          _expandedId = null;
                        });
                        _fetchHistorial();
                      },
                      child: Container(
                        margin: const EdgeInsets.only(right: 8),
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        decoration: BoxDecoration(
                          color: active
                              ? const Color(0xFFF97316) // orange-500
                              : Colors.white.withOpacity(0.8),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: active
                                ? const Color(0xFFF97316)
                                : const Color(0xFFE2E8F0),
                          ),
                        ),
                        alignment: Alignment.center,
                        child: Text(p['label']!,
                            style: GoogleFonts.inter(
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                                color: active ? Colors.white : const Color(0xFF64748B))),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),

          // ── KPI summary card ─────────────────────────────────────────────
          if (!_isLoading)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
              child: Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF10B981), Color(0xFF059669)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                        color: const Color(0xFF10B981).withOpacity(0.4),
                        blurRadius: 16,
                        offset: const Offset(0, 6))
                  ],
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('TOTAL DEL PERÍODO',
                            style: GoogleFonts.inter(
                                color: const Color(0xFFD1FAE5),
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                                letterSpacing: 0.8)),
                        const SizedBox(height: 4),
                        Text(_mxFmt.format(_totalIngresos),
                            style: GoogleFonts.inter(
                                color: Colors.white,
                                fontSize: 30,
                                fontWeight: FontWeight.w900)),
                      ],
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 12),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Column(
                        children: [
                          Text('${_comandas.length}',
                              style: GoogleFonts.inter(
                                  color: Colors.white,
                                  fontSize: 24,
                                  fontWeight: FontWeight.w900)),
                          Text('ventas',
                              style: GoogleFonts.inter(
                                  color: const Color(0xFFD1FAE5),
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),

          // ── Orders list ──────────────────────────────────────────────────
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _comandas.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.receipt_long, size: 48, color: Colors.grey[300]),
                            const SizedBox(height: 12),
                            Text('Sin ventas en este período',
                                style: GoogleFonts.inter(
                                    fontWeight: FontWeight.bold,
                                    color: Colors.grey[400])),
                          ],
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: _fetchHistorial,
                        child: ListView.builder(
                          padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
                          itemCount: _comandas.length,
                          itemBuilder: (_, i) => _ComandaCard(
                            comanda: _comandas[i],
                            isExpanded: _expandedId == _comandas[i]['id'],
                            formatDate: _formatDate,
                            onTap: () => setState(() {
                              _expandedId = _expandedId == _comandas[i]['id']
                                  ? null
                                  : _comandas[i]['id'];
                            }),
                          ),
                        ),
                      ),
          ),
          ],
        ),
      ),
    );
  }
}

class _ComandaCard extends StatelessWidget {
  final Map<String, dynamic> comanda;
  final bool isExpanded;
  final String Function(String?) formatDate;
  final VoidCallback onTap;

  const _ComandaCard({
    required this.comanda,
    required this.isExpanded,
    required this.formatDate,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final estado = comanda['estado'] ?? '';
    final style = _getEstado(estado);
    final detalles = (comanda['detalles'] as List?) ?? [];
    final mxFmt = NumberFormat.currency(locale: 'es_MX', symbol: '\$');

    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: const Color(0xFFE2E8F0)),
          boxShadow: [
            BoxShadow(
                color: Colors.black.withOpacity(0.04),
                blurRadius: 10,
                offset: const Offset(0, 3)),
          ],
        ),
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  // Color bar — matches the web's left accent pill
                  Container(
                    width: 4,
                    height: 52,
                    decoration: BoxDecoration(
                      color: style.text,
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(comanda['nombreCliente'] ?? 'Cliente',
                            style: GoogleFonts.inter(
                                fontWeight: FontWeight.w800,
                                fontSize: 14,
                                color: const Color(0xFF1E293B))),
                        Text(
                          '${comanda['tipoAtencion'] ?? ''} • #${comanda['id']}',
                          style: GoogleFonts.inter(
                              color: const Color(0xFF64748B), fontSize: 12),
                        ),
                        Text(formatDate(comanda['fechaCreacion']),
                            style: GoogleFonts.inter(
                                color: const Color(0xFF94A3B8), fontSize: 11)),
                      ],
                    ),
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(mxFmt.format((comanda['total'] ?? 0).toDouble()),
                          style: GoogleFonts.inter(
                              fontWeight: FontWeight.w900,
                              fontSize: 16,
                              color: const Color(0xFF6366F1))),
                      const SizedBox(height: 6),
                      // Status badge — exact match to web ESTADO_COLORS
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 3),
                        decoration: BoxDecoration(
                          color: style.bg,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: style.border),
                        ),
                        child: Text(estado,
                            style: GoogleFonts.inter(
                                color: style.text,
                                fontSize: 10,
                                fontWeight: FontWeight.w700)),
                      ),
                    ],
                  ),
                  const SizedBox(width: 6),
                  Icon(
                    isExpanded
                        ? Icons.keyboard_arrow_up
                        : Icons.keyboard_arrow_down,
                    color: const Color(0xFF94A3B8),
                    size: 18,
                  ),
                ],
              ),
            ),
            // Expandable details
            if (isExpanded && detalles.isNotEmpty) ...[
              const Divider(height: 1, color: Color(0xFFF1F5F9)),
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Detalle del pedido',
                        style: GoogleFonts.inter(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: const Color(0xFF64748B))),
                    const SizedBox(height: 8),
                    ...detalles.map((d) => Padding(
                          padding: const EdgeInsets.symmetric(vertical: 3),
                          child: Row(
                            children: [
                              Container(
                                width: 22,
                                height: 22,
                                alignment: Alignment.center,
                                decoration: BoxDecoration(
                                  color: const Color(0xFFF1F5F9),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text('${d['cantidad']}',
                                    style: GoogleFonts.inter(
                                        fontSize: 11,
                                        fontWeight: FontWeight.w800,
                                        color: const Color(0xFF475569))),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(d['nombreServicio'] ?? d['servicio']?['nombre'] ?? '',
                                    style: GoogleFonts.inter(
                                        fontSize: 13,
                                        color: const Color(0xFF1E293B))),
                              ),
                              Text(
                                  mxFmt.format(
                                      (d['subtotal'] ?? 0).toDouble()),
                                  style: GoogleFonts.inter(
                                      fontSize: 13,
                                      fontWeight: FontWeight.w700,
                                      color: const Color(0xFF6366F1))),
                            ],
                          ),
                        )),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
