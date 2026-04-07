import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/services/api_service.dart';
import '../../../core/widgets/fade_slide_in.dart';

class UsuariosAdminScreen extends StatefulWidget {
  const UsuariosAdminScreen({Key? key}) : super(key: key);

  @override
  State<UsuariosAdminScreen> createState() => _UsuariosAdminScreenState();
}

class _UsuariosAdminScreenState extends State<UsuariosAdminScreen> {
  final _api = ApiService();
  List<dynamic> _usuarios = [];
  List<dynamic> _negocios = [];
  bool _loading = true;
  String _search = '';

  static const _rolColors = {
    'SuperAdmin': Color(0xFF6D28D9), // violet
    'Admin': Color(0xFF1D4ED8), // blue
    'Operativo': Color(0xFF047857), // emerald
    'Mesero': Color(0xFFC2410C), // orange
    'Cocina': Color(0xFFB91C1C), // red
  };

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    setState(() => _loading = true);
    try {
      final resUs = await _api.get('/Auth/usuarios');
      final resNeg = await _api.get('/Negocios');
      
      if (resUs.statusCode == 200 && resNeg.statusCode == 200 && mounted) {
        setState(() {
          _usuarios = jsonDecode(resUs.body);
          _negocios = jsonDecode(resNeg.body);
          _loading = false;
        });
      }
    } catch (e) {
      debugPrint('Error fetching data: $e');
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _deleteUsuario(int id, String nombre) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Eliminar Usuario', style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
        content: Text('¿Eliminar a "$nombre"? Esta acción no se puede deshacer.',
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
      await _api.delete('/Auth/usuarios/$id');
      _fetchData();
    }
  }

  void _showCreateModal() {
    final _nombreCtrl = TextEditingController();
    final _correoCtrl = TextEditingController();
    final _passCtrl = TextEditingController();
    String _rol = 'Operativo';
    String? _negocioId;
    bool _showPass = false;

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
              Text('Nuevo Usuario',
                  style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w800)),
              Text('Se le enviará acceso al correo registrado.',
                  style: GoogleFonts.inter(fontSize: 13, color: Colors.grey[500])),
              const SizedBox(height: 16),
              TextField(
                controller: _nombreCtrl,
                decoration: InputDecoration(
                  labelText: 'Nombre Completo',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _correoCtrl,
                keyboardType: TextInputType.emailAddress,
                decoration: InputDecoration(
                  labelText: 'Correo Electrónico',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _passCtrl,
                obscureText: !_showPass,
                decoration: InputDecoration(
                  labelText: 'Contraseña Inicial',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  suffixIcon: IconButton(
                    icon: Icon(_showPass ? Icons.visibility_off : Icons.visibility),
                    onPressed: () => setModalState(() => _showPass = !_showPass),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      value: _rol,
                      decoration: InputDecoration(
                        labelText: 'Rol',
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
                      ),
                      isExpanded: true,
                      items: ['Operativo', 'Mesero', 'Cocina', 'Admin', 'SuperAdmin']
                          .map((s) => DropdownMenuItem(value: s, child: Text(s, overflow: TextOverflow.ellipsis)))
                          .toList(),
                      onChanged: (v) => setModalState(() => _rol = v!),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: DropdownButtonFormField<String?>(
                      value: _negocioId,
                      decoration: InputDecoration(
                        labelText: 'Negocio',
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
                      ),
                      isExpanded: true,
                      items: [
                        const DropdownMenuItem<String?>(value: null, child: Text('-- Global --')),
                        ..._negocios.map((n) => DropdownMenuItem<String?>(
                          value: n['id'].toString(), child: Text(n['nombre'], overflow: TextOverflow.ellipsis)))
                      ],
                      onChanged: (v) => setModalState(() => _negocioId = v),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () async {
                    if (_nombreCtrl.text.isEmpty || _correoCtrl.text.isEmpty || _passCtrl.text.isEmpty) return;
                    final body = {
                      'nombre': _nombreCtrl.text,
                      'correo': _correoCtrl.text,
                      'password': _passCtrl.text,
                      'rol': _rol,
                      'negocioId': _negocioId != null ? int.parse(_negocioId!) : null,
                    };
                    await _api.post('/Auth/registrar', body);
                    if (ctx.mounted) Navigator.pop(ctx);
                    _fetchData();
                  },
                  icon: const Icon(Icons.person_add),
                  label: Text('Crear Usuario', style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
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
    final filtrados = _usuarios.where((u) {
      final nameMatches = (u['nombre'] ?? '').toLowerCase().contains(_search.toLowerCase());
      final mailMatches = (u['correo'] ?? '').toLowerCase().contains(_search.toLowerCase());
      return nameMatches || mailMatches;
    }).toList();

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: FadeSlideIn(
        child: Column(
          children: [
            // Top Actions
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  ElevatedButton.icon(
                    onPressed: _showCreateModal,
                    icon: const Icon(Icons.add, size: 18),
                    label: Text('Nuevo Usuario', style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFF97316),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      elevation: 0,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.8),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: IconButton(
                      icon: const Icon(Icons.refresh, color: Color(0xFF64748B)),
                      onPressed: _fetchData,
                      tooltip: 'Actualizar',
                    ),
                  ),
                ],
              ),
            ),
            
            // Search Bar
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: TextField(
                style: GoogleFonts.inter(),
                decoration: InputDecoration(
                  hintText: 'Buscar usuarios...',
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
            ),
            
            // Stats Row
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                children: [
                  _StatBox(label: 'Total', count: _usuarios.length, color: const Color(0xFF4F46E5)),
                  const SizedBox(width: 8),
                  _StatBox(label: 'Admins', count: _usuarios.where((u) => u['rol'] == 'SuperAdmin' || u['rol'] == 'Admin').length, color: Colors.blue),
                  const SizedBox(width: 8),
                  _StatBox(label: 'Operativos', count: _usuarios.where((u) => u['rol'] != 'SuperAdmin' && u['rol'] != 'Admin').length, color: Colors.teal),
                ],
              ),
            ),

            // List
            Expanded(
              child: _loading
                  ? const Center(child: CircularProgressIndicator(color: Color(0xFFF97316)))
                  : RefreshIndicator(
                      onRefresh: _fetchData,
                      child: ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: filtrados.length,
                        itemBuilder: (context, i) {
                          final u = filtrados[i] as Map<String, dynamic>;
                          final rolColor = _rolColors[u['rol']] ?? Colors.grey;
                          
                          return Container(
                            margin: const EdgeInsets.only(bottom: 12),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(16),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.04),
                                  blurRadius: 8, offset: const Offset(0, 2)
                                )
                              ],
                            ),
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: Row(
                                children: [
                                  // Avatar
                                  Container(
                                    width: 44, height: 44,
                                    decoration: BoxDecoration(
                                      gradient: const LinearGradient(
                                        colors: [Color(0xFF818CF8), Color(0xFF2563EB)],
                                      ),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    alignment: Alignment.center,
                                    child: Text(
                                      (u['nombre'] ?? 'U')[0].toUpperCase(),
                                      style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 18),
                                    ),
                                  ),
                                  const SizedBox(width: 14),
                                  
                                  // Texts
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(u['nombre'] ?? '',
                                            style: GoogleFonts.inter(fontWeight: FontWeight.w800, fontSize: 15)),
                                        Text(u['correo'] ?? '',
                                            style: GoogleFonts.inter(color: Colors.grey[500], fontSize: 13)),
                                        const SizedBox(height: 4),
                                        Row(
                                          children: [
                                            if (u['negocioNombre'] != null)
                                              Row(
                                                children: [
                                                  const Icon(Icons.store, size: 12, color: Colors.grey),
                                                  const SizedBox(width: 4),
                                                  Text(u['negocioNombre'], style: GoogleFonts.inter(fontSize: 11, color: Colors.grey[600], fontWeight: FontWeight.bold)),
                                                ],
                                              )
                                            else
                                              Row(
                                                children: [
                                                  const Icon(Icons.shield, size: 12, color: Colors.deepPurple),
                                                  const SizedBox(width: 4),
                                                  Text('Acceso Global', style: GoogleFonts.inter(fontSize: 11, color: Colors.deepPurple, fontWeight: FontWeight.bold)),
                                                ],
                                              ),
                                          ],
                                        )
                                      ],
                                    ),
                                  ),
                                  
                                  // Role Badge + Delete
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.end,
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                        decoration: BoxDecoration(
                                          color: rolColor.withOpacity(0.15),
                                          borderRadius: BorderRadius.circular(12),
                                          border: Border.all(color: rolColor.withOpacity(0.3)),
                                        ),
                                        child: Text(
                                          u['rol'] ?? 'Operativo',
                                          style: GoogleFonts.inter(color: rolColor, fontSize: 10, fontWeight: FontWeight.bold),
                                        ),
                                      ),
                                      const SizedBox(height: 8),
                                      IconButton(
                                        padding: EdgeInsets.zero,
                                        constraints: const BoxConstraints(),
                                        icon: const Icon(Icons.delete_outline, size: 18, color: Colors.red),
                                        onPressed: () => _deleteUsuario(u['id'], u['nombre']),
                                      )
                                    ],
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
}

class _StatBox extends StatelessWidget {
  final String label;
  final int count;
  final Color color;

  const _StatBox({required this.label, required this.count, required this.color});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.8),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.white),
        ),
        child: Column(
          children: [
            Text(label.toUpperCase(), style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey[500], letterSpacing: 1)),
            const SizedBox(height: 4),
            Text('$count', style: GoogleFonts.inter(fontSize: 24, fontWeight: FontWeight.w900, color: color)),
          ],
        ),
      ),
    );
  }
}
