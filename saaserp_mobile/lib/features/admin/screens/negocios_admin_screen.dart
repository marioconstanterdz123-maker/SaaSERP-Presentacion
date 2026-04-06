import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../../core/services/api_service.dart';

/// SuperAdmin screen: full CRUD for Negocios (list, create, toggle active, delete)
class NegociosAdminScreen extends StatefulWidget {
  const NegociosAdminScreen({Key? key}) : super(key: key);

  @override
  State<NegociosAdminScreen> createState() => _NegociosAdminScreenState();
}

class _NegociosAdminScreenState extends State<NegociosAdminScreen> {
  final _api = ApiService();
  List<dynamic> _negocios = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _fetchNegocios();
  }

  Future<void> _fetchNegocios() async {
    setState(() => _loading = true);
    try {
      final res = await _api.get('/Negocios');
      if (res.statusCode == 200 && mounted) {
        setState(() {
          _negocios = jsonDecode(res.body);
          _loading = false;
        });
      }
    } catch (e) {
      debugPrint('Error fetching negocios: $e');
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _toggleActivo(Map<String, dynamic> n) async {
    final updated = {...n, 'activo': !(n['activo'] as bool)};
    await _api.put('/Negocios/${n['id']}', updated);
    _fetchNegocios();
  }

  Future<void> _deleteNegocio(int id, String nombre) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Eliminar Negocio', style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
        content: Text('¿Eliminar "$nombre"? Esta acción no se puede deshacer.',
            style: GoogleFonts.inter()),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false),
              child: Text('Cancelar', style: GoogleFonts.inter(color: Colors.grey))),
          TextButton(onPressed: () => Navigator.pop(ctx, true),
              child: Text('Eliminar', style: GoogleFonts.inter(color: Colors.red, fontWeight: FontWeight.bold))),
        ],
      ),
    );
    if (confirmed == true) {
      await _api.delete('/Negocios/$id');
      _fetchNegocios();
    }
  }

  void _showCreateModal() {
    final _nombreCtrl = TextEditingController();
    final _telCtrl = TextEditingController();
    String _sistema = 'RESTAURANTES';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          padding: EdgeInsets.fromLTRB(
              20, 20, 20, MediaQuery.of(ctx).viewInsets.bottom + 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Nuevo Negocio',
                  style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w800)),
              const SizedBox(height: 16),
              TextField(
                controller: _nombreCtrl,
                decoration: InputDecoration(
                  labelText: 'Nombre del Negocio',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _telCtrl,
                keyboardType: TextInputType.phone,
                decoration: InputDecoration(
                  labelText: 'Teléfono WhatsApp',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                value: _sistema,
                decoration: InputDecoration(
                  labelText: 'Sistema',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
                items: ['RESTAURANTES', 'TAQUERIA', 'CITAS', 'PARQUEADERO']
                    .map((s) => DropdownMenuItem(value: s, child: Text(s)))
                    .toList(),
                onChanged: (v) => setModalState(() => _sistema = v!),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () async {
                    if (_nombreCtrl.text.isEmpty) return;
                    final body = {
                      'nombre': _nombreCtrl.text,
                      'telefonoWhatsApp': _telCtrl.text,
                      'sistemaAsignado': _sistema,
                      'activo': true,
                      'horaApertura': '09:00',
                      'horaCierre': '18:00',
                      'capacidadMaxima': 10,
                      'duracionMinutosCita': 30,
                      'usaMesas': _sistema == 'RESTAURANTES' || _sistema == 'TAQUERIA',
                    };
                    await _api.post('/Negocios', body);
                    if (ctx.mounted) Navigator.pop(ctx);
                    _fetchNegocios();
                  },
                  icon: const Icon(Icons.save),
                  label: Text('Crear Negocio', style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.indigo,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                ),
              ),
            ],
          ),
        ),
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
        title: Text('Gestión de Negocios',
            style: GoogleFonts.inter(fontWeight: FontWeight.w800, fontSize: 18)),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _fetchNegocios,
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showCreateModal,
        backgroundColor: Colors.indigo,
        icon: const Icon(Icons.add, color: Colors.white),
        label: Text('Nuevo', style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.bold)),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _fetchNegocios,
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: _negocios.length,
                itemBuilder: (context, i) {
                  final n = _negocios[i] as Map<String, dynamic>;
                  final activo = n['activo'] as bool? ?? false;
                  return Card(
                    elevation: 0,
                    margin: const EdgeInsets.only(bottom: 12),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                        side: const BorderSide(color: Color(0xFFE2E8F0))),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        children: [
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(10),
                                decoration: BoxDecoration(
                                  color: activo ? Colors.indigo[50] : Colors.grey[100],
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Icon(Icons.store,
                                    color: activo ? Colors.indigo : Colors.grey[400]),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(n['nombre'] ?? '',
                                        style: GoogleFonts.inter(
                                            fontWeight: FontWeight.w800, fontSize: 15)),
                                    Text((n['sistemaAsignado'] ?? '').toString(),
                                        style: GoogleFonts.inter(
                                            color: Colors.indigo,
                                            fontSize: 11,
                                            fontWeight: FontWeight.bold)),
                                  ],
                                ),
                              ),
                              Switch.adaptive(
                                value: activo,
                                onChanged: (_) => _toggleActivo(n),
                                activeColor: Colors.indigo,
                              ),
                            ],
                          ),
                          const Divider(height: 20),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.end,
                            children: [
                              TextButton.icon(
                                onPressed: () => _deleteNegocio(n['id'] as int, n['nombre'] ?? ''),
                                icon: const Icon(Icons.delete_outline, color: Colors.red, size: 16),
                                label: Text('Eliminar',
                                    style: GoogleFonts.inter(color: Colors.red, fontWeight: FontWeight.bold, fontSize: 13)),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
    );
  }
}
