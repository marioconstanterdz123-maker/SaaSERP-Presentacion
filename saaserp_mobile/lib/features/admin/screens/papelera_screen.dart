import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/services/api_service.dart';
import '../../../core/widgets/fade_slide_in.dart';

const _sistemaIcon = {
  'CITAS': '✂️',
  'TAQUERIA': '🌮',
  'PARQUEADERO': '🅿️',
  'RESTAURANTES': '🍽️',
  'TATTOO': '🎨',
};

class PapeleraScreen extends StatefulWidget {
  const PapeleraScreen({Key? key}) : super(key: key);

  @override
  State<PapeleraScreen> createState() => _PapeleraScreenState();
}

class _PapeleraScreenState extends State<PapeleraScreen> {
  final _api = ApiService();
  List<dynamic> _negocios = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _fetch();
  }

  Future<void> _fetch() async {
    setState(() => _loading = true);
    try {
      final res = await _api.get('/negocios/papelera');
      if (res.statusCode == 200 && mounted) {
        setState(() {
          _negocios = jsonDecode(res.body);
          _loading = false;
        });
      }
    } catch (e) {
      debugPrint('Papelera error: $e');
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _restaurar(Map<String, dynamic> n) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text('¿Restaurar negocio?', style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
        content: Text('"${n['nombre']}" volverá a estar activo en el sistema.',
            style: GoogleFonts.inter()),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: Text('Cancelar', style: GoogleFonts.inter(color: Colors.grey))),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF4F46E5),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: Text('✅ Restaurar', style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: Colors.white)),
          ),
        ],
      ),
    );
    if (confirmed == true) {
      await _api.post('/negocios/${n['id']}/restaurar', {});
      _fetch();
    }
  }

  Future<void> _eliminarDefinitivo(Map<String, dynamic> n) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text('⚠️ Eliminar permanentemente', style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Esto borrará "${n['nombre']}" y todos sus datos de forma irreversible.',
                style: GoogleFonts.inter()),
            const SizedBox(height: 8),
            Text('Esta acción NO se puede deshacer.',
                style: GoogleFonts.inter(color: Colors.red, fontWeight: FontWeight.bold)),
          ],
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: Text('Cancelar', style: GoogleFonts.inter(color: Colors.grey))),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: Text('🗑️ Eliminar para siempre', style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: Colors.white)),
          ),
        ],
      ),
    );
    if (confirmed != true) return;

    // Double confirmation: ask to type the name
    final nameCtrl = TextEditingController();
    final secondConfirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text('Confirma escribiendo el nombre', style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
        content: TextField(
          controller: nameCtrl,
          decoration: InputDecoration(
            hintText: n['nombre'],
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
          ),
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: Text('Cancelar', style: GoogleFonts.inter(color: Colors.grey))),
          ElevatedButton(
            onPressed: () {
              if (nameCtrl.text == n['nombre']) {
                Navigator.pop(ctx, true);
              } else {
                ScaffoldMessenger.of(ctx).showSnackBar(
                  SnackBar(content: Text('Debes escribir exactamente: ${n['nombre']}')),
                );
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: Text('Eliminar', style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: Colors.white)),
          ),
        ],
      ),
    );
    if (secondConfirm == true) {
      await _api.delete('/negocios/${n['id']}/definitivo');
      _fetch();
    }
  }

  @override
  Widget build(BuildContext context) {
    return FadeSlideIn(
      child: Column(
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
            child: Row(
              children: [
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.6),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: Colors.white.withOpacity(0.4)),
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.red[600],
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: const Icon(Icons.delete, color: Colors.white, size: 24),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Papelera de Negocios',
                                  style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w900, color: const Color(0xFF1E293B))),
                              Text('Negocios eliminados. Puedes restaurarlos o eliminarlos definitivamente.',
                                  style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B))),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.6),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Colors.white.withOpacity(0.4)),
                  ),
                  child: IconButton(
                    onPressed: _fetch,
                    icon: const Icon(Icons.refresh, color: Color(0xFF64748B)),
                  ),
                ),
              ],
            ),
          ),
          // Content
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator(color: Colors.red))
                : _negocios.isEmpty
                    ? Center(
                        child: Container(
                          margin: const EdgeInsets.all(16),
                          padding: const EdgeInsets.all(40),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.6),
                            borderRadius: BorderRadius.circular(24),
                            border: Border.all(color: Colors.white),
                          ),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.delete_outline, size: 48, color: Colors.grey[300]),
                              const SizedBox(height: 12),
                              Text('La papelera está vacía', style: GoogleFonts.inter(color: Colors.grey[400], fontWeight: FontWeight.w600)),
                              Text('Los negocios eliminados aparecerán aquí.', style: GoogleFonts.inter(color: Colors.grey[300], fontSize: 12)),
                            ],
                          ),
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _negocios.length,
                        itemBuilder: (context, i) {
                          final n = _negocios[i] as Map<String, dynamic>;
                          final emoji = _sistemaIcon[n['sistemaAsignado']] ?? '🏢';
                          return Container(
                            margin: const EdgeInsets.only(bottom: 12),
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.8),
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: Colors.red[50]!),
                            ),
                            child: Row(
                              children: [
                                Container(
                                  width: 48, height: 48,
                                  decoration: BoxDecoration(
                                    color: Colors.red[50],
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Center(child: Text(emoji, style: const TextStyle(fontSize: 24))),
                                ),
                                const SizedBox(width: 14),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(n['nombre'] ?? '', style: GoogleFonts.inter(fontWeight: FontWeight.w900, fontSize: 15, color: const Color(0xFF475569))),
                                      Wrap(
                                        spacing: 8,
                                        children: [
                                          Container(
                                            margin: const EdgeInsets.only(top: 4),
                                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                            decoration: BoxDecoration(color: const Color(0xFFF1F5F9), borderRadius: BorderRadius.circular(8)),
                                            child: Text(n['sistemaAsignado'] ?? '', style: GoogleFonts.inter(fontSize: 10, color: const Color(0xFF94A3B8))),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                                Column(
                                  children: [
                                    SizedBox(
                                      height: 32,
                                      child: ElevatedButton.icon(
                                        onPressed: () => _restaurar(n),
                                        icon: const Icon(Icons.replay, size: 14),
                                        label: Text('Restaurar', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.bold)),
                                        style: ElevatedButton.styleFrom(
                                          backgroundColor: const Color(0xFF4F46E5),
                                          foregroundColor: Colors.white,
                                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                          padding: const EdgeInsets.symmetric(horizontal: 12),
                                        ),
                                      ),
                                    ),
                                    const SizedBox(height: 6),
                                    SizedBox(
                                      height: 32,
                                      child: ElevatedButton.icon(
                                        onPressed: () => _eliminarDefinitivo(n),
                                        icon: const Icon(Icons.delete_forever, size: 14),
                                        label: Text('Eliminar', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.bold)),
                                        style: ElevatedButton.styleFrom(
                                          backgroundColor: Colors.red[50],
                                          foregroundColor: Colors.red[700],
                                          elevation: 0,
                                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                          padding: const EdgeInsets.symmetric(horizontal: 12),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }
}
