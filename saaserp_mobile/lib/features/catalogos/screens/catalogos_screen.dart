import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../../core/services/api_service.dart';
import '../../../models/models.dart';
import '../../../core/widgets/fade_slide_in.dart';

class CatalogosScreen extends StatefulWidget {
  final String negocioId;
  final String sistemaAsignado;
  const CatalogosScreen(
      {Key? key, required this.negocioId, required this.sistemaAsignado})
      : super(key: key);

  @override
  State<CatalogosScreen> createState() => _CatalogosScreenState();
}

class _CatalogosScreenState extends State<CatalogosScreen> {
  final ApiService _api = ApiService();
  List<Servicio> _servicios = [];
  bool _isLoading = true;
  String _search = '';
  bool _isSaving = false;

  final _nombreCtrl = TextEditingController();
  final _precioCtrl = TextEditingController();
  final _duracionCtrl = TextEditingController();
  bool _activo = true;

  final _mxFmt = NumberFormat.currency(locale: 'es_MX', symbol: '\$');

  bool get _isCitas => widget.sistemaAsignado == 'CITAS';
  bool get _isParqueadero => widget.sistemaAsignado == 'PARQUEADERO';

  String get _titulo => _isParqueadero
      ? 'Tarifas'
      : _isCitas
          ? 'Servicios'
          : 'Catálogo de Productos';

  IconData get _icon => _isParqueadero
      ? Icons.directions_car_outlined
      : _isCitas
          ? Icons.content_cut_outlined
          : Icons.coffee_outlined;

  @override
  void initState() {
    super.initState();
    _fetchServicios();
  }

  Future<void> _fetchServicios() async {
    setState(() => _isLoading = true);
    try {
      final res = await _api.get('/Servicios/negocio/${widget.negocioId}');
      if (res.statusCode == 200 && mounted) {
        final List data = jsonDecode(res.body);
        setState(() => _servicios = data.map((s) => Servicio.fromJson(s)).toList());
      }
    } catch (e) {
      debugPrint('Catalogos error: $e');
    }
    if (mounted) setState(() => _isLoading = false);
  }

  Future<void> _toggleEstado(Servicio s) async {
    await _api.put('/Servicios/${s.id}', {
      'id': s.id,
      'negocioId': int.tryParse(widget.negocioId) ?? 0,
      'nombre': s.nombre,
      'precio': s.precio,
      'duracionEstimadaMinutos': s.duracionEstimadaMinutos,
      'esPorFraccion': false,
      'activo': !s.activo,
    });
    _fetchServicios();
  }

  Future<void> _createServicio(BuildContext ctx) async {
    final nombre = _nombreCtrl.text.trim();
    final precio = double.tryParse(_precioCtrl.text.trim()) ?? 0;
    if (nombre.isEmpty || precio <= 0) return;
    setState(() => _isSaving = true);
    try {
      await _api.post('/Servicios', {
        'negocioId': int.tryParse(widget.negocioId) ?? 0,
        'nombre': nombre,
        'precio': precio,
        'duracionEstimadaMinutos':
            _isCitas ? (int.tryParse(_duracionCtrl.text) ?? 30) : 0,
        'esPorFraccion': _isParqueadero,
        'activo': _activo,
      });
      _nombreCtrl.clear();
      _precioCtrl.clear();
      _duracionCtrl.clear();
      if (ctx.mounted) Navigator.of(ctx).pop();
      _fetchServicios();
    } catch (e) {
      debugPrint('Create servicio error: $e');
    }
    if (mounted) setState(() => _isSaving = false);
  }

  void _showCreateBottomSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
        padding: EdgeInsets.fromLTRB(
            24, 24, 24, MediaQuery.of(ctx).viewInsets.bottom + 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Nuevo ${_isCitas ? 'Servicio' : _isParqueadero ? 'Tarifa' : 'Artículo'}',
                    style: GoogleFonts.inter(
                        fontSize: 20, fontWeight: FontWeight.w800)),
                IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.of(ctx).pop()),
              ],
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _nombreCtrl,
              decoration: InputDecoration(
                labelText: 'Nombre',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _precioCtrl,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              decoration: InputDecoration(
                labelText: 'Precio',
                prefixText: '\$ ',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
              ),
            ),
            if (_isCitas) ...[
              const SizedBox(height: 12),
              TextField(
                controller: _duracionCtrl,
                keyboardType: TextInputType.number,
                decoration: InputDecoration(
                  labelText: 'Duración (minutos)',
                  suffixText: 'min',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
                ),
              ),
            ],
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _isSaving ? null : () => _createServicio(ctx),
                icon: _isSaving
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(
                            strokeWidth: 2, color: Colors.white))
                    : const Icon(Icons.save),
                label: Text('Guardar en catálogo',
                    style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF6366F1),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14)),
                  elevation: 0,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final filtrados = _servicios
        .where((s) => s.nombre.toLowerCase().contains(_search.toLowerCase()))
        .toList();

    final activos = filtrados.where((s) => s.activo).length;
    final inactivos = filtrados.length - activos;

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: FadeSlideIn(
        child: Column(
          children: [
            // ── Top Action & Stats Bar ──────────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 16),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      // Stats
                      Expanded(
                        child: Row(
                          children: [
                            _StatPill(label: '${filtrados.length} total', color: const Color(0xFFF1F5F9), text: const Color(0xFF64748B)),
                            const SizedBox(width: 8),
                            _StatPill(label: '$activos activos', color: const Color(0xFFF0FDF4), text: const Color(0xFF16A34A)),
                            const SizedBox(width: 8),
                            _StatPill(label: '$inactivos in', color: const Color(0xFFFEF2F2), text: const Color(0xFFDC2626)),
                          ],
                        ),
                      ),
                      // Create button
                      GestureDetector(
                        onTap: _showCreateBottomSheet,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 14, vertical: 8),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF97316),
                            borderRadius: BorderRadius.circular(12),
                            boxShadow: [
                              BoxShadow(color: const Color(0xFFF97316).withOpacity(0.3), blurRadius: 8, offset: const Offset(0, 2))
                            ]
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.add, color: Colors.white, size: 16),
                              const SizedBox(width: 4),
                              Text('Nuevo',
                                  style: GoogleFonts.inter(
                                      color: Colors.white,
                                      fontWeight: FontWeight.w700,
                                      fontSize: 13)),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  // Search bar
                  TextField(
                    style: GoogleFonts.inter(),
                    decoration: InputDecoration(
                      hintText: 'Buscar en el catálogo...',
                      hintStyle: GoogleFonts.inter(color: Colors.grey[400]),
                      prefixIcon: const Icon(Icons.search, color: Colors.grey, size: 20),
                      filled: true,
                      fillColor: Colors.white.withOpacity(0.8),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(14),
                        borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(14),
                        borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(14),
                        borderSide: const BorderSide(color: Color(0xFFF97316), width: 1.5),
                      ),
                      contentPadding: const EdgeInsets.symmetric(vertical: 0),
                    ),
                    onChanged: (v) => setState(() => _search = v),
                  ),
                ],
              ),
            ),

          // ── Product list ──────────────────────────────────────────────
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : filtrados.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(_icon, size: 48, color: Colors.grey[300]),
                            const SizedBox(height: 12),
                            Text('Sin artículos en el catálogo',
                                style: GoogleFonts.inter(
                                    fontWeight: FontWeight.bold,
                                    color: Colors.grey[400])),
                          ],
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: _fetchServicios,
                        child: ListView.builder(
                          padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
                          itemCount: filtrados.length,
                          itemBuilder: (_, i) {
                            final s = filtrados[i];
                            return Container(
                              margin: const EdgeInsets.only(bottom: 12),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(
                                    color: s.activo
                                        ? const Color(0xFFE2E8F0)
                                        : const Color(0xFFF1F5F9)),
                                boxShadow: [
                                  BoxShadow(
                                      color: Colors.black.withOpacity(0.04),
                                      blurRadius: 10,
                                      offset: const Offset(0, 3)),
                                ],
                              ),
                              child: Padding(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 16, vertical: 14),
                                child: Row(
                                  children: [
                                    // Icon indicator
                                    Container(
                                      padding: const EdgeInsets.all(10),
                                      decoration: BoxDecoration(
                                        color: s.activo
                                            ? const Color(0xFFEEF2FF)
                                            : const Color(0xFFF8FAFC),
                                        borderRadius: BorderRadius.circular(14),
                                      ),
                                      child: Icon(_icon,
                                          color: s.activo
                                              ? const Color(0xFF6366F1)
                                              : Colors.grey[400],
                                          size: 20),
                                    ),
                                    const SizedBox(width: 14),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(s.nombre,
                                              style: GoogleFonts.inter(
                                                  fontWeight: FontWeight.w800,
                                                  fontSize: 14,
                                                  color: s.activo
                                                      ? const Color(0xFF1E293B)
                                                      : const Color(0xFF94A3B8))),
                                          Text(
                                            _mxFmt.format(s.precio),
                                            style: GoogleFonts.inter(
                                                fontSize: 13,
                                                fontWeight: FontWeight.w900,
                                                color: s.activo
                                                    ? const Color(0xFF6366F1)
                                                    : Colors.grey[400]),
                                          ),
                                          if (_isCitas &&
                                              s.duracionEstimadaMinutos > 0)
                                            Text(
                                                '${s.duracionEstimadaMinutos} min',
                                                style: GoogleFonts.inter(
                                                    fontSize: 11,
                                                    color: Colors.grey[400])),
                                        ],
                                      ),
                                    ),
                                    // Active badge
                                    Container(
                                      margin: const EdgeInsets.only(right: 8),
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 8, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: s.activo
                                            ? const Color(0xFFF0FDF4)
                                            : const Color(0xFFFEF2F2),
                                        borderRadius: BorderRadius.circular(10),
                                      ),
                                      child: Text(
                                          s.activo ? 'Activo' : 'Inactivo',
                                          style: GoogleFonts.inter(
                                              fontSize: 10,
                                              fontWeight: FontWeight.w700,
                                              color: s.activo
                                                  ? const Color(0xFF16A34A)
                                                  : const Color(0xFFDC2626))),
                                    ),
                                    Switch.adaptive(
                                      value: s.activo,
                                      activeColor: const Color(0xFF6366F1),
                                      onChanged: (_) => _toggleEstado(s),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                      ),
          ),
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    _nombreCtrl.dispose();
    _precioCtrl.dispose();
    _duracionCtrl.dispose();
    super.dispose();
  }
}

class _StatPill extends StatelessWidget {
  final String label;
  final Color color;
  final Color text;
  const _StatPill(
      {required this.label, required this.color, required this.text});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
          color: color, borderRadius: BorderRadius.circular(20)),
      child: Text(label,
          style: GoogleFonts.inter(
              color: text, fontSize: 11, fontWeight: FontWeight.w700)),
    );
  }
}
