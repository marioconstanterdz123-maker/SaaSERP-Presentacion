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
};

class ConfiguracionGlobalScreen extends StatefulWidget {
  const ConfiguracionGlobalScreen({Key? key}) : super(key: key);

  @override
  State<ConfiguracionGlobalScreen> createState() => _ConfiguracionGlobalScreenState();
}

class _ConfiguracionGlobalScreenState extends State<ConfiguracionGlobalScreen> {
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
      final res = await _api.get('/negocios');
      if (res.statusCode == 200 && mounted) {
        setState(() {
          _negocios = jsonDecode(res.body);
          _loading = false;
        });
      }
    } catch (e) {
      debugPrint('ConfigGlobal error: $e');
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _toggleModulo(Map<String, dynamic> n, String key, bool value) async {
    setState(() => n[key] = value);
    try {
      final payload = Map<String, dynamic>.from(n);
      payload[key] = value;
      await _api.put('/negocios/${n['id']}', payload);
    } catch (e) {
      debugPrint('Toggle error: $e');
    }
  }

  Future<void> _suspenderNegocio(Map<String, dynamic> n) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text('¿Suspender negocio?', style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
        content: Text('"${n['nombre']}" será enviado a la papelera y dejará de estar activo.',
            style: GoogleFonts.inter()),
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
            child: Text('Suspender', style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: Colors.white)),
          ),
        ],
      ),
    );
    if (confirmed == true) {
      final payload = Map<String, dynamic>.from(n);
      payload['activo'] = false;
      await _api.put('/negocios/${n['id']}', payload);
      _fetch();
    }
  }

  int _diasRestantes(String? fecha) {
    if (fecha == null) return 999;
    final d = DateTime.tryParse(fecha);
    if (d == null) return 999;
    return d.difference(DateTime.now()).inDays;
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
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.settings, color: Color(0xFF2563EB), size: 28),
                          const SizedBox(width: 10),
                          Text('Configuración', style: GoogleFonts.inter(fontSize: 24, fontWeight: FontWeight.w900, color: const Color(0xFF1E293B))),
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text('Administra módulos y acceso de cada negocio.',
                          style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF64748B))),
                    ],
                  ),
                ),
                Container(
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.6),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Colors.white.withOpacity(0.4)),
                  ),
                  child: IconButton(onPressed: _fetch, icon: const Icon(Icons.refresh, color: Color(0xFF64748B))),
                ),
              ],
            ),
          ),
          // Content
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator(color: Color(0xFF2563EB)))
                : RefreshIndicator(
                    onRefresh: _fetch,
                    child: ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: _negocios.length,
                      itemBuilder: (context, i) {
                        final n = _negocios[i] as Map<String, dynamic>;
                        final emoji = _sistemaIcon[n['sistemaAsignado']] ?? '🏢';
                        final dias = _diasRestantes(n['fechaVencimientoSuscripcion']?.toString());
                        final activo = n['activo'] as bool? ?? false;

                        return Container(
                          margin: const EdgeInsets.only(bottom: 16),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.8),
                            borderRadius: BorderRadius.circular(24),
                            border: Border.all(color: Colors.white.withOpacity(0.4)),
                            boxShadow: [
                              BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 12, offset: const Offset(0, 4)),
                            ],
                          ),
                          child: Theme(
                            data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
                            child: ExpansionTile(
                              tilePadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                              childrenPadding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
                              leading: Container(
                                width: 48, height: 48,
                                decoration: BoxDecoration(
                                  color: const Color(0xFFEFF6FF),
                                  borderRadius: BorderRadius.circular(14),
                                ),
                                child: Center(child: Text(emoji, style: const TextStyle(fontSize: 22))),
                              ),
                              title: Text(n['nombre'] ?? '', style: GoogleFonts.inter(fontWeight: FontWeight.w900, fontSize: 15)),
                              subtitle: Row(
                                children: [
                                  Text(n['sistemaAsignado'] ?? '', style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF2563EB), fontWeight: FontWeight.bold)),
                                  const SizedBox(width: 10),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: dias > 5 ? const Color(0xFFD1FAE5) : dias > 0 ? Colors.orange[50] : Colors.red[50],
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Text(
                                      dias > 900 ? 'Sin límite' : '$dias días',
                                      style: GoogleFonts.inter(
                                        fontSize: 10,
                                        fontWeight: FontWeight.bold,
                                        color: dias > 5 ? const Color(0xFF059669) : dias > 0 ? Colors.orange : Colors.red,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              children: [
                                // Module toggles
                                _ModuleToggle(label: 'Acceso Web', desc: 'Permite uso desde navegador', icon: Icons.language, value: n['accesoWeb'] == true, onChanged: (v) => _toggleModulo(n, 'accesoWeb', v)),
                                _ModuleToggle(label: 'Acceso Móvil', desc: 'Permite uso desde app nativa', icon: Icons.smartphone, value: n['accesoMovil'] == true, onChanged: (v) => _toggleModulo(n, 'accesoMovil', v)),
                                _ModuleToggle(label: 'Historial', desc: 'Ver historial de operaciones', icon: Icons.history, value: n['moduloHistorial'] == true, onChanged: (v) => _toggleModulo(n, 'moduloHistorial', v)),
                                _ModuleToggle(label: 'WhatsApp', desc: 'Notificaciones automáticas al cliente', icon: Icons.chat_bubble_outline, value: n['moduloWhatsApp'] == true, onChanged: (v) => _toggleModulo(n, 'moduloWhatsApp', v)),
                                _ModuleToggle(label: 'WhatsApp IA', desc: 'Número de WhatsApp IA por trabajador', icon: Icons.smart_toy_outlined, value: n['moduloWhatsAppIA'] == true, onChanged: (v) => _toggleModulo(n, 'moduloWhatsAppIA', v)),
                                _ModuleToggle(label: 'CRM', desc: 'Registro de clientes', icon: Icons.people_outline, value: n['moduloCRM'] == true, onChanged: (v) => _toggleModulo(n, 'moduloCRM', v)),
                                _ModuleToggle(label: 'Reportes', desc: 'Panel de reportes avanzados', icon: Icons.bar_chart, value: n['moduloReportes'] == true, onChanged: (v) => _toggleModulo(n, 'moduloReportes', v)),
                                const SizedBox(height: 12),
                                // WhatsApp QR Panel
                                _WhatsAppQrSection(negocioId: n['id'], negocioNombre: n['nombre'] ?? ''),
                                const SizedBox(height: 16),
                                if (activo)
                                  SizedBox(
                                    width: double.infinity,
                                    child: OutlinedButton.icon(
                                      onPressed: () => _suspenderNegocio(n),
                                      icon: const Icon(Icons.pause_circle_outline, size: 18, color: Colors.red),
                                      label: Text('Suspender / Desactivar', style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: Colors.red)),
                                      style: OutlinedButton.styleFrom(
                                        side: const BorderSide(color: Colors.red),
                                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                                        padding: const EdgeInsets.symmetric(vertical: 14),
                                      ),
                                    ),
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
    );
  }
}

class _ModuleToggle extends StatelessWidget {
  final String label;
  final String desc;
  final IconData icon;
  final bool value;
  final ValueChanged<bool> onChanged;

  const _ModuleToggle({
    required this.label,
    required this.desc,
    required this.icon,
    required this.value,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 10),
      decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: Color(0xFFF8FAFC)))),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: value ? const Color(0xFF2563EB) : const Color(0xFFF1F5F9),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, size: 18, color: value ? Colors.white : const Color(0xFF94A3B8)),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.bold, color: const Color(0xFF475569))),
                Text(desc, style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF94A3B8))),
              ],
            ),
          ),
          Switch.adaptive(
            value: value,
            onChanged: onChanged,
            activeColor: const Color(0xFF2563EB),
          ),
        ],
      ),
    );
  }
}

// ─── WhatsApp QR Panel (replicates WhatsAppPanel.tsx) ─────────────────────────
class _WhatsAppQrSection extends StatefulWidget {
  final int negocioId;
  final String negocioNombre;
  const _WhatsAppQrSection({required this.negocioId, required this.negocioNombre});

  @override
  State<_WhatsAppQrSection> createState() => _WhatsAppQrSectionState();
}

class _WhatsAppQrSectionState extends State<_WhatsAppQrSection> {
  final _api = ApiService();
  String _estado = 'CARGANDO';  // SIN_INSTANCIA | open | connecting | close | ERROR | CARGANDO
  String? _instancia;
  String? _qrBase64;
  bool _working = false;
  String _error = '';

  @override
  void initState() {
    super.initState();
    _fetchEstado();
  }

  Future<void> _fetchEstado() async {
    try {
      final res = await _api.get('/WhatsApp/${widget.negocioId}/estado');
      if (res.statusCode == 200 && mounted) {
        final data = jsonDecode(res.body);
        setState(() {
          _estado = data['estado'] ?? 'SIN_INSTANCIA';
          _instancia = data['instancia'];
        });
      }
    } catch (_) {
      if (mounted) setState(() => _estado = 'ERROR');
    }
  }

  Future<void> _crear() async {
    setState(() { _working = true; _error = ''; });
    try {
      await _api.post('/WhatsApp/${widget.negocioId}/crear', {});
      await _fetchEstado();
    } catch (e) {
      setState(() => _error = 'Error al crear la instancia.');
    }
    if (mounted) setState(() => _working = false);
  }

  Future<void> _obtenerQR() async {
    setState(() { _working = true; _error = ''; _qrBase64 = null; });
    try {
      final res = await _api.get('/WhatsApp/${widget.negocioId}/qr');
      if (res.statusCode == 200 && mounted) {
        final data = jsonDecode(res.body);
        final qr = data['base64'] ?? data['code'] ?? data['qr'];
        if (qr != null) {
          setState(() => _qrBase64 = qr.toString());
        } else {
          setState(() => _error = 'El servidor no devolvió un QR.');
        }
      }
    } catch (e) {
      setState(() => _error = 'Error al obtener QR.');
    }
    if (mounted) setState(() => _working = false);
  }

  Future<void> _eliminar() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text('¿Desconectar WhatsApp?', style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
        content: Text('"${widget.negocioNombre}" ya no enviará mensajes automáticos.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancelar')),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
            child: Text('Desconectar', style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    setState(() { _working = true; _error = ''; });
    try {
      await _api.delete('/WhatsApp/${widget.negocioId}');
      setState(() { _estado = 'SIN_INSTANCIA'; _instancia = null; _qrBase64 = null; });
    } catch (e) {
      setState(() => _error = 'Error al eliminar.');
    }
    if (mounted) setState(() => _working = false);
  }

  Widget _badge() {
    IconData icon;
    String label;
    Color color;
    Color bg;

    switch (_estado) {
      case 'open':
        icon = Icons.check_circle; label = 'Conectado'; color = const Color(0xFF059669); bg = const Color(0xFFD1FAE5);
        break;
      case 'SIN_INSTANCIA':
        icon = Icons.cancel_outlined; label = 'Sin configurar'; color = const Color(0xFF94A3B8); bg = const Color(0xFFF8FAFC);
        break;
      case 'CARGANDO':
        icon = Icons.hourglass_empty; label = 'Cargando...'; color = const Color(0xFF3B82F6); bg = const Color(0xFFDBEAFE);
        break;
      default:
        icon = Icons.smartphone; label = _estado == 'connecting' ? 'Esperando QR…' : _estado; color = const Color(0xFFD97706); bg = const Color(0xFFFEF3C7);
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(20), border: Border.all(color: color.withOpacity(0.3))),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Icon(icon, size: 12, color: color),
        const SizedBox(width: 4),
        Text(label, style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.bold, color: color)),
      ]),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(top: 4),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(colors: [Color(0xFFF8FAFC), Colors.white]),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(color: const Color(0xFF25D366), borderRadius: BorderRadius.circular(8)),
                child: const Icon(Icons.smartphone, size: 14, color: Colors.white),
              ),
              const SizedBox(width: 8),
              Text('WhatsApp Business', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.bold, color: const Color(0xFF475569))),
              const Spacer(),
              _badge(),
              const SizedBox(width: 6),
              GestureDetector(
                onTap: _fetchEstado,
                child: const Icon(Icons.refresh, size: 16, color: Color(0xFF94A3B8)),
              ),
            ],
          ),

          if (_error.isNotEmpty) ...[
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(color: Colors.red[50], borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.red[100]!)),
              child: Text(_error, style: GoogleFonts.inter(fontSize: 11, color: Colors.red[600])),
            ),
          ],

          // QR display
          if (_qrBase64 != null && _estado != 'open') ...[
            const SizedBox(height: 12),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: const Color(0xFFE2E8F0))),
              child: Column(
                children: [
                  Text('📱 Escanea con WhatsApp → Dispositivos Vinculados',
                      textAlign: TextAlign.center,
                      style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.bold, color: const Color(0xFF64748B))),
                  const SizedBox(height: 12),
                  // QR image from base64
                  if (_qrBase64!.startsWith('data:'))
                    Image.memory(
                      base64Decode(_qrBase64!.split(',').last),
                      width: 192, height: 192,
                    )
                  else
                    Container(
                      width: 192, height: 192,
                      decoration: BoxDecoration(color: Colors.grey[200], borderRadius: BorderRadius.circular(12)),
                      child: Center(child: Text('QR', style: GoogleFonts.inter(fontSize: 32, fontWeight: FontWeight.w900, color: Colors.grey[400]))),
                    ),
                  const SizedBox(height: 8),
                  Text('El QR expira en ~60 seg.', style: GoogleFonts.inter(fontSize: 10, color: Colors.grey[400])),
                ],
              ),
            ),
          ],

          // Action buttons
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              if (_estado == 'SIN_INSTANCIA')
                _WaButton(
                  label: 'Configurar WhatsApp',
                  color: const Color(0xFF25D366),
                  icon: Icons.flash_on,
                  working: _working,
                  onTap: _crear,
                ),
              if (_estado != 'SIN_INSTANCIA' && _estado != 'CARGANDO' && _estado != 'open')
                _WaButton(
                  label: _qrBase64 != null ? 'Nuevo QR' : 'Mostrar QR',
                  color: const Color(0xFF4F46E5),
                  icon: Icons.qr_code,
                  working: _working,
                  onTap: _obtenerQR,
                ),
              if (_instancia != null)
                _WaButton(
                  label: 'Desconectar',
                  color: Colors.grey,
                  icon: Icons.delete_outline,
                  working: _working,
                  onTap: _eliminar,
                  outlined: true,
                ),
            ],
          ),

          if (_estado == 'open' && _instancia != null) ...[
            const SizedBox(height: 8),
            Text('✅ Conectado como $_instancia. Mensajes automáticos activos.',
                style: GoogleFonts.inter(fontSize: 10, color: Colors.grey[500])),
          ],
        ],
      ),
    );
  }
}

class _WaButton extends StatelessWidget {
  final String label;
  final Color color;
  final IconData icon;
  final bool working;
  final VoidCallback onTap;
  final bool outlined;
  const _WaButton({required this.label, required this.color, required this.icon, required this.working, required this.onTap, this.outlined = false});

  @override
  Widget build(BuildContext context) {
    if (outlined) {
      return OutlinedButton.icon(
        onPressed: working ? null : onTap,
        icon: Icon(icon, size: 12, color: Colors.grey[500]),
        label: Text(label, style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: Colors.grey[500])),
        style: OutlinedButton.styleFrom(
          side: BorderSide(color: Colors.grey[300]!),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        ),
      );
    }
    return ElevatedButton.icon(
      onPressed: working ? null : onTap,
      icon: working
          ? const SizedBox(width: 12, height: 12, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
          : Icon(icon, size: 12),
      label: Text(label, style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.bold)),
      style: ElevatedButton.styleFrom(
        backgroundColor: color,
        foregroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      ),
    );
  }
}
