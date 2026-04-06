import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../../core/services/api_service.dart';
import '../../auth/providers/auth_provider.dart';

class ConfiguracionScreen extends StatefulWidget {
  final String negocioId;
  const ConfiguracionScreen({Key? key, required this.negocioId})
      : super(key: key);

  @override
  State<ConfiguracionScreen> createState() => _ConfiguracionScreenState();
}

class _ConfiguracionScreenState extends State<ConfiguracionScreen> {
  final _api = ApiService();
  Map<String, dynamic>? _negocio;
  bool _loading = true;
  bool _saving = false;

  final _horaAperturaCtrl = TextEditingController();
  final _horaCierreCtrl = TextEditingController();
  final _capacidadCtrl = TextEditingController();
  final _duracionCitaCtrl = TextEditingController();

  // Module toggle states
  bool _accesoWeb = true;
  bool _accesoMovil = true;
  bool _moduloHistorial = true;
  bool _moduloWhatsApp = false;
  bool _moduloWhatsAppIA = false;
  bool _moduloCRM = false;
  bool _moduloReportes = false;
  bool _usaMesas = false;

  @override
  void initState() {
    super.initState();
    _loadNegocio();
  }

  @override
  void dispose() {
    _horaAperturaCtrl.dispose();
    _horaCierreCtrl.dispose();
    _capacidadCtrl.dispose();
    _duracionCitaCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadNegocio() async {
    try {
      final res = await _api.get('/Negocios');
      if (res.statusCode == 200) {
        final List data = jsonDecode(res.body);
        final n = data.firstWhere(
          (n) => n['id'].toString() == widget.negocioId,
          orElse: () => null,
        );
        if (n != null && mounted) {
          setState(() {
            _negocio = n;
            _accesoWeb = n['accesoWeb'] ?? true;
            _accesoMovil = n['accesoMovil'] ?? true;
            _moduloHistorial = n['moduloHistorial'] ?? true;
            _moduloWhatsApp = n['moduloWhatsApp'] ?? false;
            _moduloWhatsAppIA = n['moduloWhatsAppIA'] ?? false;
            _moduloCRM = n['moduloCRM'] ?? false;
            _moduloReportes = n['moduloReportes'] ?? false;
            _usaMesas = n['usaMesas'] ?? false;
            _horaAperturaCtrl.text = n['horaApertura'] ?? '08:00';
            _horaCierreCtrl.text = n['horaCierre'] ?? '22:00';
            _capacidadCtrl.text = (n['capacidadMaxima'] ?? 0).toString();
            _duracionCitaCtrl.text =
                (n['duracionMinutosCita'] ?? 30).toString();
            _loading = false;
          });
        }
      }
    } catch (e) {
      debugPrint('Error loading negocio config: $e');
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      final body = {
        ..._negocio!,
        'accesoWeb': _accesoWeb,
        'accesoMovil': _accesoMovil,
        'moduloHistorial': _moduloHistorial,
        'moduloWhatsApp': _moduloWhatsApp,
        'moduloWhatsAppIA': _moduloWhatsAppIA,
        'moduloCRM': _moduloCRM,
        'moduloReportes': _moduloReportes,
        'usaMesas': _usaMesas,
        'horaApertura': _horaAperturaCtrl.text,
        'horaCierre': _horaCierreCtrl.text,
        'capacidadMaxima': int.tryParse(_capacidadCtrl.text) ?? 0,
        'duracionMinutosCita': int.tryParse(_duracionCitaCtrl.text) ?? 30,
      };
      final res = await _api.put('/Negocios/${widget.negocioId}', body);
      if (res.statusCode == 200 && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('Configuración guardada',
              style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
          backgroundColor: Colors.green[700],
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ));
      }
    } catch (e) {
      debugPrint('Error saving: $e');
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context, listen: false);

    if (_loading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    final suscripcion = _negocio?['fechaVencimientoSuscripcion'];
    int diasRestantes = 999;
    if (suscripcion != null) {
      final fecha = DateTime.tryParse(suscripcion);
      if (fecha != null) {
        diasRestantes = fecha.difference(DateTime.now()).inDays;
      }
    }

    final sistema = _negocio?['sistemaAsignado'] ?? '';

    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E293B),
        foregroundColor: Colors.white,
        title: Text('Configuración',
            style: GoogleFonts.inter(fontWeight: FontWeight.w800, fontSize: 18)),
        actions: [
          TextButton.icon(
            onPressed: _saving ? null : _save,
            icon: _saving
                ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(
                        color: Colors.white, strokeWidth: 2))
                : const Icon(Icons.save_outlined, color: Colors.white, size: 18),
            label: Text('Guardar',
                style: GoogleFonts.inter(
                    color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Business identity card
          _Card(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _sectionTitle('Identidad del Negocio', Icons.store_outlined),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Container(
                      width: 52,
                      height: 52,
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFFf97316), Color(0xFFef4444)],
                        ),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Center(
                        child: Text(
                          _getSistemaEmoji(sistema),
                          style: const TextStyle(fontSize: 24),
                        ),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            _negocio?['nombre'] ?? '',
                            style: GoogleFonts.inter(
                                fontSize: 16, fontWeight: FontWeight.w800),
                          ),
                          Text(
                            sistema,
                            style: GoogleFonts.inter(
                                fontSize: 12, color: Colors.indigo, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                // Subscription badge
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: diasRestantes > 5
                        ? const Color(0xFFD1FAE5)
                        : diasRestantes > 0
                            ? Colors.orange[50]
                            : Colors.red[50],
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: diasRestantes > 5
                          ? const Color(0xFF10b981)
                          : diasRestantes > 0
                              ? Colors.orange
                              : Colors.red,
                    ),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        diasRestantes > 5
                            ? Icons.verified_outlined
                            : diasRestantes > 0
                                ? Icons.warning_amber_outlined
                                : Icons.cancel_outlined,
                        size: 16,
                        color: diasRestantes > 5
                            ? const Color(0xFF10b981)
                            : diasRestantes > 0
                                ? Colors.orange
                                : Colors.red,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        diasRestantes >= 999
                            ? 'Suscripción sin límite'
                            : diasRestantes > 0
                                ? 'Suscripción activa: $diasRestantes días'
                                : 'Suscripción vencida',
                        style: GoogleFonts.inter(
                            fontSize: 12, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 12),

          // Horario
          _Card(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _sectionTitle('Horario de Operación', Icons.schedule_outlined),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: _TimeField(
                        label: 'Apertura',
                        controller: _horaAperturaCtrl,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _TimeField(
                        label: 'Cierre',
                        controller: _horaCierreCtrl,
                      ),
                    ),
                  ],
                ),
                if (sistema == 'CITAS') ...[
                  const SizedBox(height: 12),
                  _NumberField(
                    label: 'Duración de cita (minutos)',
                    controller: _duracionCitaCtrl,
                    icon: Icons.timer_outlined,
                  ),
                ],
                if (sistema == 'PARQUEADERO') ...[
                  const SizedBox(height: 12),
                  _NumberField(
                    label: 'Capacidad Máxima',
                    controller: _capacidadCtrl,
                    icon: Icons.local_parking,
                  ),
                ],
              ],
            ),
          ),

          const SizedBox(height: 12),

          // Módulos
          _Card(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _sectionTitle('Módulos Activos', Icons.extension_outlined),
                const SizedBox(height: 4),
                _Toggle(
                  label: 'Acceso Web',
                  description: 'Permite ingresar desde navegador',
                  icon: Icons.public,
                  value: _accesoWeb,
                  onChanged: (v) => setState(() => _accesoWeb = v),
                  activeColor: Colors.blue,
                ),
                _Toggle(
                  label: 'Acceso Móvil',
                  description: 'Permite uso desde la app',
                  icon: Icons.smartphone,
                  value: _accesoMovil,
                  onChanged: (v) => setState(() => _accesoMovil = v),
                  activeColor: Colors.blue,
                ),
                _Toggle(
                  label: 'Módulo Historial',
                  description: 'Registro de transacciones',
                  icon: Icons.history,
                  value: _moduloHistorial,
                  onChanged: (v) => setState(() => _moduloHistorial = v),
                  activeColor: Colors.indigo,
                ),
                _Toggle(
                  label: 'Módulo Reportes',
                  description: 'Gráficas e informes avanzados',
                  icon: Icons.bar_chart,
                  value: _moduloReportes,
                  onChanged: (v) => setState(() => _moduloReportes = v),
                  activeColor: Colors.indigo,
                ),
                _Toggle(
                  label: 'WhatsApp',
                  description: 'Notificaciones automáticas',
                  icon: Icons.chat_outlined,
                  value: _moduloWhatsApp,
                  onChanged: (v) => setState(() => _moduloWhatsApp = v),
                  activeColor: Colors.green,
                ),
                _Toggle(
                  label: 'WhatsApp IA',
                  description: 'Asistente IA conversacional',
                  icon: Icons.auto_awesome,
                  value: _moduloWhatsAppIA,
                  onChanged: (v) => setState(() => _moduloWhatsAppIA = v),
                  activeColor: Colors.green,
                ),
                _Toggle(
                  label: 'CRM Clientes',
                  description: 'Gestión de base de clientes',
                  icon: Icons.people_outline,
                  value: _moduloCRM,
                  onChanged: (v) => setState(() => _moduloCRM = v),
                  activeColor: Colors.purple,
                ),
                if (sistema == 'TAQUERIA' || sistema == 'RESTAURANTES')
                  _Toggle(
                    label: 'Sistema de Mesas',
                    description: 'Asignación y control de mesas',
                    icon: Icons.table_restaurant,
                    value: _usaMesas,
                    onChanged: (v) => setState(() => _usaMesas = v),
                    activeColor: Colors.orange,
                  ),
              ],
            ),
          ),

          const SizedBox(height: 12),

          // Account
          _Card(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _sectionTitle('Cuenta', Icons.account_circle_outlined),
                const SizedBox(height: 12),
                Row(
                  children: [
                    CircleAvatar(
                      radius: 22,
                      backgroundColor: Colors.indigo[100],
                      child: Text(
                        (auth.user?.email ?? 'U')[0].toUpperCase(),
                        style: GoogleFonts.inter(
                            fontWeight: FontWeight.bold,
                            color: Colors.indigo,
                            fontSize: 18),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(auth.user?.email ?? '',
                              style: GoogleFonts.inter(
                                  fontWeight: FontWeight.bold, fontSize: 13),
                              overflow: TextOverflow.ellipsis),
                          Text(auth.user?.rol ?? '',
                              style: GoogleFonts.inter(
                                  color: Colors.indigo,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 11)),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    onPressed: () {
                      auth.logout();
                    },
                    icon: const Icon(Icons.logout, color: Colors.red, size: 18),
                    label: Text('Cerrar Sesión',
                        style: GoogleFonts.inter(
                            color: Colors.red, fontWeight: FontWeight.bold)),
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: Colors.red),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 32),
        ],
      ),
    );
  }

  String _getSistemaEmoji(String sistema) {
    switch (sistema) {
      case 'CITAS':
        return '✂️';
      case 'TAQUERIA':
        return '🌮';
      case 'RESTAURANTES':
        return '🍽️';
      case 'PARQUEADERO':
        return '🅿️';
      default:
        return '🏪';
    }
  }

  Widget _sectionTitle(String title, IconData icon) {
    return Row(
      children: [
        Icon(icon, size: 18, color: Colors.indigo),
        const SizedBox(width: 8),
        Text(title,
            style: GoogleFonts.inter(
                fontSize: 14, fontWeight: FontWeight.w800, color: const Color(0xFF1E293B))),
      ],
    );
  }
}

class _Card extends StatelessWidget {
  final Widget child;
  const _Card({required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
              color: Colors.black.withOpacity(0.04),
              blurRadius: 12,
              offset: const Offset(0, 2)),
        ],
      ),
      child: child,
    );
  }
}

class _Toggle extends StatelessWidget {
  final String label;
  final String description;
  final IconData icon;
  final bool value;
  final ValueChanged<bool> onChanged;
  final Color activeColor;

  const _Toggle({
    required this.label,
    required this.description,
    required this.icon,
    required this.value,
    required this.onChanged,
    required this.activeColor,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: value ? activeColor : Colors.grey[100],
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon,
                size: 18, color: value ? Colors.white : Colors.grey[400]),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label,
                    style: GoogleFonts.inter(
                        fontSize: 13, fontWeight: FontWeight.bold)),
                Text(description,
                    style: GoogleFonts.inter(
                        fontSize: 11, color: Colors.grey[500])),
              ],
            ),
          ),
          Switch.adaptive(
            value: value,
            onChanged: onChanged,
            activeColor: activeColor,
          ),
        ],
      ),
    );
  }
}

class _TimeField extends StatelessWidget {
  final String label;
  final TextEditingController controller;
  const _TimeField({required this.label, required this.controller});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style: GoogleFonts.inter(
                fontSize: 11,
                fontWeight: FontWeight.bold,
                color: Colors.grey[600])),
        const SizedBox(height: 4),
        TextField(
          controller: controller,
          keyboardType: TextInputType.datetime,
          style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.bold),
          decoration: InputDecoration(
            prefixIcon:
                const Icon(Icons.access_time, color: Colors.indigo, size: 18),
            filled: true,
            fillColor: Colors.grey[50],
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
            ),
            contentPadding:
                const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
          ),
        ),
      ],
    );
  }
}

class _NumberField extends StatelessWidget {
  final String label;
  final TextEditingController controller;
  final IconData icon;
  const _NumberField(
      {required this.label, required this.controller, required this.icon});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style: GoogleFonts.inter(
                fontSize: 11,
                fontWeight: FontWeight.bold,
                color: Colors.grey[600])),
        const SizedBox(height: 4),
        TextField(
          controller: controller,
          keyboardType: TextInputType.number,
          style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.bold),
          decoration: InputDecoration(
            prefixIcon: Icon(icon, color: Colors.indigo, size: 18),
            filled: true,
            fillColor: Colors.grey[50],
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
            ),
            contentPadding:
                const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
          ),
        ),
      ],
    );
  }
}
