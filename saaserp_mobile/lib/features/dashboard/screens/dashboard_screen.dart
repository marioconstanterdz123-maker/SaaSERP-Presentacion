import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

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
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchStats();
  }

  Future<void> _fetchStats() async {
    try {
      final res = await _api.get('/Reportes/dashboard/${widget.negocioId}');
      if (res.statusCode == 200) {
        setState(() => _stats = jsonDecode(res.body));
      }
    } catch (e) {
      print('Dashboard stats error: $e');
    }
    setState(() => _isLoading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E293B),
        foregroundColor: Colors.white,
        automaticallyImplyLeading: false,
        title: Text(
          widget.negocioNombre,
          style: GoogleFonts.inter(fontWeight: FontWeight.w800, fontSize: 18),
        ),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _fetchStats),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _fetchStats,
        child: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  _buildBanner(),
                  const SizedBox(height: 20),
                  _buildKpiGrid(),
                  const SizedBox(height: 20),
                  _buildRecentOrders(),
                ],
              ),
      ),
    );
  }

  Widget _buildBanner() {
    final now = DateTime.now();
    final hour = now.hour;
    final greeting = hour < 12 ? '🌅 Buenos días' : hour < 18 ? '☀️ Buenas tardes' : '🌙 Buenas noches';

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF4F46E5), Color(0xFF7C3AED)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.indigo.withOpacity(0.4),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(greeting, style: GoogleFonts.inter(color: Colors.white70, fontSize: 14)),
          const SizedBox(height: 4),
          Text(
            widget.negocioNombre,
            style: GoogleFonts.inter(
                color: Colors.white, fontSize: 22, fontWeight: FontWeight.w900),
          ),
          const SizedBox(height: 16),
          Text(
            '\$${(_stats['totalHoy'] ?? 0).toStringAsFixed(2)}',
            style: GoogleFonts.inter(
                color: Colors.white, fontSize: 40, fontWeight: FontWeight.w900),
          ),
          Text('Ingresos hoy', style: GoogleFonts.inter(color: Colors.white60, fontSize: 13)),
        ],
      ),
    );
  }

  Widget _buildKpiGrid() {
    final kpis = [
      {
        'label': 'Comandas Hoy',
        'value': '${_stats['totalComandas'] ?? 0}',
        'icon': Icons.receipt_long,
        'color': Colors.blue,
      },
      {
        'label': 'Ticket Promedio',
        'value': '\$${(_stats['ticketPromedio'] ?? 0).toStringAsFixed(2)}',
        'icon': Icons.bar_chart,
        'color': Colors.orange,
      },
      {
        'label': 'Artículos',
        'value': '${_stats['totalArticulos'] ?? 0}',
        'icon': Icons.inventory_2_outlined,
        'color': Colors.green,
      },
      {
        'label': 'Pendientes',
        'value': '${_stats['comandasPendientes'] ?? 0}',
        'icon': Icons.hourglass_top,
        'color': Colors.red,
      },
    ];

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 1.6,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
      ),
      itemCount: kpis.length,
      itemBuilder: (_, i) {
        final kpi = kpis[i];
        final color = kpi['color'] as Color;
        return Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8)],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(kpi['icon'] as IconData, color: color, size: 20),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(kpi['value'] as String,
                      style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.w900)),
                  Text(kpi['label'] as String,
                      style: GoogleFonts.inter(fontSize: 11, color: Colors.grey[600])),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildRecentOrders() {
    final recientes = (_stats['ultimasComandas'] as List?) ?? [];

    if (recientes.isEmpty) {
      return const SizedBox.shrink();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Últimas Comandas',
            style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold)),
        const SizedBox(height: 12),
        ...recientes.map((c) => Container(
          margin: const EdgeInsets.only(bottom: 10),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
          ),
          child: Row(
            children: [
              const Icon(Icons.receipt, size: 20, color: Colors.indigo),
              const SizedBox(width: 12),
              Expanded(
                child: Text(c['nombreCliente'] ?? 'Cliente',
                    style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
              ),
              Text('\$${(c['total'] ?? 0).toStringAsFixed(2)}',
                  style: GoogleFonts.inter(
                      fontWeight: FontWeight.w900, color: Colors.indigo)),
            ],
          ),
        )),
      ],
    );
  }
}
