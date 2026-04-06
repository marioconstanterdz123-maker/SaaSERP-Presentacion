import 'dart:convert';
import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../../core/services/api_service.dart';

class DashboardScreen extends StatefulWidget {
  final String negocioId;
  final String negocioNombre;

  const DashboardScreen({
    Key? key,
    required this.negocioId,
    required this.negocioNombre,
  }) : super(key: key);

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final ApiService _api = ApiService();
  Map<String, dynamic> _stats = {};
  Map<String, dynamic>? _negocio;
  bool _isLoading = true;

  final _mxFmt = NumberFormat.currency(locale: 'es_MX', symbol: '\$');

  @override
  void initState() {
    super.initState();
    _fetchAll();
  }

  Future<void> _fetchAll() async {
    try {
      final results = await Future.wait([
        _api.get('/Reportes/dashboard/${widget.negocioId}'),
        _api.get('/Negocios'),
      ]);

      if (results[0].statusCode == 200) {
        setState(() => _stats = jsonDecode(results[0].body));
      }
      if (results[1].statusCode == 200) {
        final List negs = jsonDecode(results[1].body);
        final n = negs.firstWhere(
            (n) => n['id'].toString() == widget.negocioId,
            orElse: () => null);
        if (n != null) setState(() => _negocio = n as Map<String, dynamic>);
      }
    } catch (e) {
      debugPrint('Dashboard error: $e');
    }
    if (mounted) setState(() => _isLoading = false);
  }

  @override
  Widget build(BuildContext context) {
    final sistema = _negocio?['sistemaAsignado'] ?? '';

    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      body: RefreshIndicator(
        onRefresh: () async {
          setState(() => _isLoading = true);
          await _fetchAll();
        },
        child: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : CustomScrollView(
                slivers: [
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Header — matches web <header>
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.center,
                            children: [
                              Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: Colors.blue[50],
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Icon(Icons.show_chart,
                                    color: Colors.blue[600], size: 22),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text('Panel de Rendimiento',
                                        style: GoogleFonts.inter(
                                            fontSize: 20,
                                            fontWeight: FontWeight.w900,
                                            color: const Color(0xFF1E293B))),
                                    Text('Sucursal: ${widget.negocioNombre}',
                                        style: GoogleFonts.inter(
                                            fontSize: 12,
                                            color: const Color(0xFF64748B))),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 20),

                          // KPI Cards — emerald main + white glass secondaries
                          _buildKpiCards(sistema),
                          const SizedBox(height: 20),

                          // 7-day income trend chart
                          _buildChartCard(),
                          const SizedBox(height: 24),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
      ),
    );
  }

  Widget _buildKpiCards(String sistema) {
    final ingresosHoy = (_stats['ingresosHoy'] ?? _stats['totalHoy'] ?? 0).toDouble();
    final crecimiento = (_stats['crecimiento'] ?? 0).toDouble();

    return Column(
      children: [
        // Main emerald card — Caja del Día (full width)
        _EmeraldCard(
          ingresosHoy: ingresosHoy,
          crecimiento: crecimiento,
          fmt: _mxFmt,
        ),
        const SizedBox(height: 12),

        // Secondary cards row
        Row(
          children: [
            // System-specific card
            Expanded(
              child: _systemCard(sistema),
            ),
            const SizedBox(width: 12),
            // Clientes atendidos — always shown
            Expanded(
              child: _GlassKpiCard(
                label: 'CLIENTES ATENDIDOS',
                value: '${_stats['clientesRegistrados'] ?? _stats['totalComandas'] ?? 0}',
                icon: Icons.people_outline,
                iconBg: const Color(0xFFF3E8FF),
                iconColor: const Color(0xFFA855F7),
                badge: 'Buen flujo de tráfico',
                badgeBg: const Color(0xFFF3E8FF),
                badgeText: const Color(0xFF9333EA),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        // Ticket promedio + Pendientes
        Row(
          children: [
            Expanded(
              child: _GlassKpiCard(
                label: 'TICKET PROMEDIO',
                value: _mxFmt.format((_stats['ticketPromedio'] ?? 0).toDouble()),
                icon: Icons.bar_chart_outlined,
                iconBg: const Color(0xFFFFF7ED),
                iconColor: const Color(0xFFF97316),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _GlassKpiCard(
                label: 'PENDIENTES',
                value: '${_stats['comandasPendientes'] ?? 0}',
                icon: Icons.hourglass_top_outlined,
                iconBg: const Color(0xFFFEF2F2),
                iconColor: const Color(0xFFEF4444),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _systemCard(String sistema) {
    final comandasActivas = _stats['comandasActivas'] ?? 0;
    final vehiculosAdentro = _stats['vehiculosAdentro'] ?? 0;
    final capacidadMaxima = _negocio?['capacidadMaxima'] ?? 1;

    if (sistema == 'PARQUEADERO') {
      final pct = ((vehiculosAdentro / (capacidadMaxima == 0 ? 1 : capacidadMaxima)) * 100).clamp(0, 100);
      return _GlassKpiCard(
        label: 'OCUPACIÓN ACTUAL',
        value: '$vehiculosAdentro / $capacidadMaxima',
        icon: Icons.local_parking,
        iconBg: const Color(0xFFEFF6FF),
        iconColor: const Color(0xFF3B82F6),
        progressValue: pct / 100,
        progressLabel: 'Capacidad al ${pct.round()}%',
      );
    }

    if (sistema == 'CITAS') {
      return _GlassKpiCard(
        label: 'CITAS RESTANTES HOY',
        value: '${_stats['citasHoy'] ?? 0}',
        icon: Icons.schedule_outlined,
        iconBg: const Color(0xFFFDF4FF),
        iconColor: const Color(0xFFD946EF),
        badge: 'Próxima en 15 mins.',
        badgeBg: const Color(0xFFFDF4FF),
        badgeText: const Color(0xFFD946EF),
      );
    }

    // Taqueria / Restaurantes
    return _GlassKpiCard(
      label: 'COMANDAS EN COCINA',
      value: '$comandasActivas',
      valueColor: const Color(0xFFF97316),
      icon: Icons.coffee_outlined,
      iconBg: const Color(0xFFFFF7ED),
      iconColor: const Color(0xFFF97316),
      badge: 'Requieren atención inmediata.',
      badgeBg: const Color(0xFFFFF7ED),
      badgeText: const Color(0xFFF97316),
    );
  }

  Widget _buildChartCard() {
    final semana = (_stats['ingresosSemana'] as List?) ?? [];
    final hasData = semana.isNotEmpty;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
              color: Colors.black.withOpacity(0.06),
              blurRadius: 20,
              offset: const Offset(0, 4)),
        ],
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Tendencia de Ingresos',
              style: GoogleFonts.inter(
                  fontSize: 17, fontWeight: FontWeight.w800, color: const Color(0xFF1E293B))),
          Text('Histórico de la caja de los últimos 7 días.',
              style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B))),
          const SizedBox(height: 16),
          SizedBox(
            height: 180,
            child: hasData
                ? LineChart(_buildLineChartData(semana))
                : Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.trending_up, size: 40, color: Colors.grey[300]),
                        const SizedBox(height: 8),
                        Text('Aún no hay datos suficientes para la gráfica.',
                            textAlign: TextAlign.center,
                            style: GoogleFonts.inter(
                                fontSize: 12,
                                color: Colors.grey[400],
                                fontWeight: FontWeight.bold)),
                        Text('Genera cobros para ver la tendencia.',
                            style: GoogleFonts.inter(fontSize: 11, color: Colors.grey[400])),
                      ],
                    ),
                  ),
          ),
        ],
      ),
    );
  }

  LineChartData _buildLineChartData(List semana) {
    final spots = semana.asMap().entries.map((e) {
      final v = (e.value['ventas'] ?? 0).toDouble();
      return FlSpot(e.key.toDouble(), v);
    }).toList();

    final maxY = spots.isEmpty ? 100.0 : spots.map((s) => s.y).reduce((a, b) => a > b ? a : b) * 1.2;

    return LineChartData(
      gridData: FlGridData(
        show: true,
        drawVerticalLine: false,
        getDrawingHorizontalLine: (_) =>
            FlLine(color: const Color(0xFFE2E8F0), strokeWidth: 1),
      ),
      titlesData: FlTitlesData(
        bottomTitles: AxisTitles(
          sideTitles: SideTitles(
            showTitles: true,
            getTitlesWidget: (v, meta) {
              final idx = v.toInt();
              if (idx < 0 || idx >= semana.length) return const SizedBox.shrink();
              return Padding(
                padding: const EdgeInsets.only(top: 6),
                child: Text(semana[idx]['name'] ?? '',
                    style: GoogleFonts.inter(
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                        color: const Color(0xFF64748B))),
              );
            },
          ),
        ),
        leftTitles: AxisTitles(
          sideTitles: SideTitles(
            showTitles: true,
            reservedSize: 50,
            getTitlesWidget: (v, meta) => Text('\$${v.toInt()}',
                style: GoogleFonts.inter(
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    color: const Color(0xFF64748B))),
          ),
        ),
        topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
        rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
      ),
      borderData: FlBorderData(show: false),
      minY: 0,
      maxY: maxY,
      lineBarsData: [
        LineChartBarData(
          spots: spots,
          isCurved: true,
          color: const Color(0xFF3B82F6),
          barWidth: 4,
          isStrokeCapRound: true,
          dotData: const FlDotData(show: false),
          belowBarData: BarAreaData(
            show: true,
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                const Color(0xFF3B82F6).withOpacity(0.4),
                const Color(0xFF3B82F6).withOpacity(0.0),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

// ─── Emerald main KPI card ───────────────────────────────────────────────────
class _EmeraldCard extends StatelessWidget {
  final double ingresosHoy;
  final double crecimiento;
  final NumberFormat fmt;
  const _EmeraldCard(
      {required this.ingresosHoy, required this.crecimiento, required this.fmt});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF10B981), Color(0xFF059669)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF10B981).withOpacity(0.5),
            blurRadius: 24,
            offset: const Offset(0, 8),
          )
        ],
      ),
      child: Stack(
        children: [
          // Decorative blob
          Positioned(
            right: -20,
            top: -20,
            child: Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('CAJA DEL DÍA',
                          style: GoogleFonts.inter(
                              color: const Color(0xFFD1FAE5),
                              fontWeight: FontWeight.w700,
                              fontSize: 12,
                              letterSpacing: 1.2)),
                      const SizedBox(height: 4),
                      Text(fmt.format(ingresosHoy),
                          style: GoogleFonts.inter(
                              color: Colors.white,
                              fontSize: 36,
                              fontWeight: FontWeight.w900,
                              letterSpacing: -0.5)),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: const Icon(Icons.attach_money, color: Colors.white, size: 24),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.black.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.trending_up, color: Colors.white, size: 14),
                    const SizedBox(width: 4),
                    Text('+${crecimiento.toStringAsFixed(1)}% vs. ayer',
                        style: GoogleFonts.inter(
                            color: Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.w700)),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ─── White glass secondary KPI card ──────────────────────────────────────────
class _GlassKpiCard extends StatelessWidget {
  final String label;
  final String value;
  final Color? valueColor;
  final IconData icon;
  final Color iconBg;
  final Color iconColor;
  final String? badge;
  final Color? badgeBg;
  final Color? badgeText;
  final double? progressValue;
  final String? progressLabel;

  const _GlassKpiCard({
    required this.label,
    required this.value,
    this.valueColor,
    required this.icon,
    required this.iconBg,
    required this.iconColor,
    this.badge,
    this.badgeBg,
    this.badgeText,
    this.progressValue,
    this.progressLabel,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 12,
              offset: const Offset(0, 4))
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(label,
                    style: GoogleFonts.inter(
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFF64748B),
                        letterSpacing: 0.8)),
              ),
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                    color: iconBg, borderRadius: BorderRadius.circular(12)),
                child: Icon(icon, color: iconColor, size: 18),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(value,
              style: GoogleFonts.inter(
                  fontSize: 28,
                  fontWeight: FontWeight.w900,
                  color: valueColor ?? const Color(0xFF1E293B))),
          if (progressValue != null) ...[
            const SizedBox(height: 8),
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: LinearProgressIndicator(
                value: progressValue,
                minHeight: 8,
                backgroundColor: const Color(0xFFE2E8F0),
                valueColor: AlwaysStoppedAnimation(iconColor),
              ),
            ),
            const SizedBox(height: 4),
            Text(progressLabel ?? '',
                style: GoogleFonts.inter(
                    fontSize: 10, fontWeight: FontWeight.w700, color: const Color(0xFF64748B))),
          ],
          if (badge != null) ...[
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                  color: badgeBg, borderRadius: BorderRadius.circular(8)),
              child: Text(badge!,
                  style:
                      GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: badgeText)),
            ),
          ],
        ],
      ),
    );
  }
}
