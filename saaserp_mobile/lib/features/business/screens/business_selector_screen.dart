import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../auth/providers/auth_provider.dart';
import '../providers/business_provider.dart';
import '../../../models/negocio.dart';
import '../../admin/screens/usuarios_admin_screen.dart';
import '../../admin/screens/papelera_screen.dart';
import '../../admin/screens/configuracion_global_screen.dart';

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens — Match Layout.tsx blue/indigo palette
// ─────────────────────────────────────────────────────────────────────────────
const _kBluePrimary = Color(0xFF2563EB);
const _kIndigoPrimary = Color(0xFF4F46E5);
const _kSlate50 = Color(0xFFF8FAFC);
const _kSlate100 = Color(0xFFF1F5F9);
const _kSlate400 = Color(0xFF94A3B8);
const _kSlate500 = Color(0xFF64748B);
const _kSlate800 = Color(0xFF1E293B);

class BusinessSelectorScreen extends StatefulWidget {
  const BusinessSelectorScreen({Key? key}) : super(key: key);

  @override
  State<BusinessSelectorScreen> createState() => _BusinessSelectorScreenState();
}

class _BusinessSelectorScreenState extends State<BusinessSelectorScreen> {
  int _currentIndex = 0;
  bool _sidebarOpen = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final user = Provider.of<AuthProvider>(context, listen: false).user;
      Provider.of<BusinessProvider>(context, listen: false).fetchNegocios(user);
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final user = auth.user;
    final isSuperAdmin = user?.rol == 'SuperAdmin';
    final topPad = MediaQuery.of(context).padding.top;
    final bottomPad = MediaQuery.of(context).padding.bottom;

    // Pages available
    final List<_TabItem> tabs = [
      _TabItem(icon: Icons.store, label: 'Negocios', screen: _NegociosPage()),
      if (isSuperAdmin) ...[
        _TabItem(icon: Icons.people, label: 'Usuarios', screen: const UsuariosAdminScreen()),
        _TabItem(icon: Icons.settings, label: 'Config', screen: const ConfiguracionGlobalScreen()),
        _TabItem(icon: Icons.delete_outline, label: 'Papelera', screen: const PapeleraScreen()),
      ],
    ];

    return Scaffold(
      backgroundColor: _kSlate50,
      body: Stack(
        children: [
          // ── Background blobs (matching Layout.tsx) ───────────────────────
          Positioned(
            top: -80,
            left: -80,
            child: _BgBlob(size: 350, color: Colors.blue[400]!.withOpacity(0.2)),
          ),
          Positioned(
            top: MediaQuery.of(context).size.height * 0.2,
            right: -80,
            child: _BgBlob(size: 350, color: Colors.purple[400]!.withOpacity(0.2), delayed: true),
          ),

          // ── Main content column ─────────────────────────────────────────
          Positioned.fill(
            child: Column(
              children: [
                // ── TOP HEADER: "SaaSERP Victoria" + menu ──────────────
                ClipRRect(
                  child: BackdropFilter(
                    filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
                    child: Container(
                      color: Colors.white.withOpacity(0.9),
                      padding: EdgeInsets.fromLTRB(16, topPad + 10, 16, 10),
                      decoration: const BoxDecoration(
                        border: Border(bottom: BorderSide(color: Color(0xFFE2E8F0), width: 0.5)),
                      ),
                      child: Row(
                        children: [
                          Text.rich(
                            TextSpan(children: [
                              TextSpan(text: 'SaaSERP ', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w900, color: _kBluePrimary)),
                              TextSpan(text: 'Victoria', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w300, color: _kBluePrimary)),
                            ]),
                          ),
                          const Spacer(),
                          if (isSuperAdmin)
                            GestureDetector(
                              onTap: () => setState(() => _sidebarOpen = true),
                              child: Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(color: _kSlate100, borderRadius: BorderRadius.circular(12)),
                                child: const Icon(Icons.menu, size: 20, color: _kSlate500),
                              ),
                            ),
                        ],
                      ),
                    ),
                  ),
                ),

                // ── PAGE CONTENT ──────────────────────────────────────────
                Expanded(
                  child: IndexedStack(
                    index: _currentIndex.clamp(0, tabs.length - 1),
                    children: tabs.map((t) => t.screen).toList(),
                  ),
                ),
              ],
            ),
          ),

          // ── BOTTOM TAB BAR ────────────────────────────────────────────
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: ClipRRect(
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
                child: Container(
                  padding: EdgeInsets.only(bottom: bottomPad),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.95),
                    border: const Border(top: BorderSide(color: Color(0xFFE2E8F0), width: 0.5)),
                    boxShadow: [
                      BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 24, offset: const Offset(0, -4)),
                    ],
                  ),
                  child: Row(
                    children: List.generate(tabs.length, (i) {
                      final isActive = _currentIndex == i;
                      return Expanded(
                        child: GestureDetector(
                          behavior: HitTestBehavior.opaque,
                          onTap: () => setState(() => _currentIndex = i),
                          child: Padding(
                            padding: const EdgeInsets.symmetric(vertical: 10),
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                AnimatedScale(
                                  scale: isActive ? 1.15 : 1.0,
                                  duration: const Duration(milliseconds: 200),
                                  child: Icon(tabs[i].icon, size: 22, color: isActive ? _kBluePrimary : _kSlate400),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  tabs[i].label,
                                  style: GoogleFonts.inter(
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                    color: isActive ? _kBluePrimary : _kSlate400,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    }),
                  ),
                ),
              ),
            ),
          ),

          // ── SIDEBAR DRAWER (more options, user info, logout) ──────────
          if (_sidebarOpen) ...[
            // Backdrop
            Positioned.fill(
              child: GestureDetector(
                onTap: () => setState(() => _sidebarOpen = false),
                child: Container(color: const Color(0xFF0F172A).withOpacity(0.5)),
              ),
            ),
            // Drawer
            Positioned(
              top: 0,
              bottom: 0,
              right: 0,
              width: 288,
              child: Material(
                elevation: 16,
                child: Container(
                  color: Colors.white,
                  child: SafeArea(
                    child: Column(
                      children: [
                        // Drawer header
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                          decoration: const BoxDecoration(
                            gradient: LinearGradient(colors: [_kBluePrimary, _kIndigoPrimary]),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text.rich(TextSpan(children: [
                                TextSpan(text: 'SaaSERP ', style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.w900, color: Colors.white)),
                                TextSpan(text: 'Victoria', style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.w300, color: Colors.white)),
                              ])),
                              GestureDetector(
                                onTap: () => setState(() => _sidebarOpen = false),
                                child: Container(
                                  padding: const EdgeInsets.all(6),
                                  decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(8)),
                                  child: const Icon(Icons.close, size: 20, color: Colors.white),
                                ),
                              ),
                            ],
                          ),
                        ),

                        // Navigation items
                        Expanded(
                          child: ListView(
                            padding: const EdgeInsets.all(16),
                            children: List.generate(tabs.length, (i) {
                              final isActive = _currentIndex == i;
                              return GestureDetector(
                                onTap: () {
                                  setState(() {
                                    _currentIndex = i;
                                    _sidebarOpen = false;
                                  });
                                },
                                child: Container(
                                  margin: const EdgeInsets.only(bottom: 4),
                                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                                  decoration: BoxDecoration(
                                    gradient: isActive
                                        ? const LinearGradient(colors: [_kBluePrimary, _kIndigoPrimary])
                                        : null,
                                    color: isActive ? null : Colors.transparent,
                                    borderRadius: BorderRadius.circular(16),
                                    boxShadow: isActive
                                        ? [BoxShadow(color: _kBluePrimary.withOpacity(0.3), blurRadius: 12, offset: const Offset(0, 4))]
                                        : null,
                                  ),
                                  child: Row(
                                    children: [
                                      Icon(tabs[i].icon, size: 22, color: isActive ? Colors.white : _kSlate500),
                                      const SizedBox(width: 12),
                                      Text(tabs[i].label,
                                          style: GoogleFonts.inter(
                                            fontSize: 14,
                                            fontWeight: FontWeight.w600,
                                            color: isActive ? Colors.white : _kSlate500,
                                          )),
                                    ],
                                  ),
                                ),
                              );
                            }),
                          ),
                        ),

                        // User info + Logout
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: const BoxDecoration(border: Border(top: BorderSide(color: _kSlate100))),
                          child: Column(
                            children: [
                              Row(
                                children: [
                                  Container(
                                    width: 36, height: 36,
                                    decoration: const BoxDecoration(
                                      gradient: LinearGradient(colors: [_kBluePrimary, _kIndigoPrimary]),
                                      shape: BoxShape.circle,
                                    ),
                                    child: Center(
                                      child: Text(
                                        (user?.email ?? 'A')[0].toUpperCase(),
                                        style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 14),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(user?.email ?? 'Admin', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold, color: _kSlate800), overflow: TextOverflow.ellipsis),
                                        Text(user?.rol ?? 'SuperAdmin', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.bold, color: _kBluePrimary)),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              SizedBox(
                                width: double.infinity,
                                child: ElevatedButton.icon(
                                  onPressed: () {
                                    Provider.of<BusinessProvider>(context, listen: false).deseleccionarNegocio();
                                    auth.logout();
                                  },
                                  icon: const Icon(Icons.logout, size: 16),
                                  label: Text('Cerrar Sesión', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 13)),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: Colors.red[50],
                                    foregroundColor: Colors.red,
                                    elevation: 0,
                                    padding: const EdgeInsets.symmetric(vertical: 12),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab item model
// ─────────────────────────────────────────────────────────────────────────────
class _TabItem {
  final IconData icon;
  final String label;
  final Widget screen;
  _TabItem({required this.icon, required this.label, required this.screen});
}

// ─────────────────────────────────────────────────────────────────────────────
// Negocios tab (the first/default page — matches Negocios.tsx exactly)
// ─────────────────────────────────────────────────────────────────────────────
class _NegociosPage extends StatelessWidget {
  String _getEmoji(String? sistema) {
    switch (sistema) {
      case 'CITAS': return '✂️';
      case 'TAQUERIA': return '🌮';
      case 'RESTAURANTES': return '🍽️';
      case 'PARQUEADERO': return '🅿️';
      case 'TATTOO': return '🎨';
      default: return '🏪';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<BusinessProvider>(
      builder: (context, provider, child) {
        return RefreshIndicator(
          onRefresh: () async {
            final user = Provider.of<AuthProvider>(context, listen: false).user;
            await provider.fetchNegocios(user);
          },
          child: CustomScrollView(
            // Add padding at the bottom so content doesn't clip behind bottom bar
            slivers: [
              // Header section
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                const Icon(Icons.store, color: _kBluePrimary, size: 28),
                                const SizedBox(width: 10),
                                Text('Tus Negocios',
                                    style: GoogleFonts.inter(fontSize: 24, fontWeight: FontWeight.w900, color: _kSlate800)),
                              ],
                            ),
                            const SizedBox(height: 2),
                            Text('Selecciona una tarjeta para configurar sus servicios, citas y punto de venta.',
                                style: GoogleFonts.inter(fontSize: 13, color: _kSlate500)),
                          ],
                        ),
                      ),
                      if (Provider.of<AuthProvider>(context, listen: false).user?.rol == 'SuperAdmin')
                        _NewNegocioButton(),
                    ],
                  ),
                ),
              ),

              // Content
              if (provider.isLoading)
                const SliverFillRemaining(child: Center(child: CircularProgressIndicator(color: _kBluePrimary)))
              else if (provider.negocios.isEmpty)
                SliverFillRemaining(
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.store_outlined, size: 56, color: Colors.grey[300]),
                        const SizedBox(height: 16),
                        Text('No tienes negocios asignados',
                            style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.grey[500])),
                        const SizedBox(height: 8),
                        Text('Contacta al administrador del sistema.',
                            style: GoogleFonts.inter(fontSize: 13, color: Colors.grey[400])),
                      ],
                    ),
                  ),
                )
              else
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 90), // 90 = bottom bar height
                  sliver: SliverGrid(
                    gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: MediaQuery.of(context).size.width > 600 ? 2 : 1,
                      mainAxisSpacing: 16,
                      crossAxisSpacing: 16,
                      childAspectRatio: MediaQuery.of(context).size.width > 600 ? 1.5 : 2.0,
                    ),
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        final negocio = provider.negocios[index];
                        return _NegocioCard(
                          negocio: negocio,
                          emoji: _getEmoji(negocio.sistemaAsignado),
                          onTap: () => provider.seleccionarNegocio(negocio),
                        );
                      },
                      childCount: provider.negocios.length,
                    ),
                  ),
                ),
            ],
          ),
        );
      },
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// NegocioCard — Matches Negocios.tsx card with glass effect
// ─────────────────────────────────────────────────────────────────────────────
class _NegocioCard extends StatelessWidget {
  final Negocio negocio;
  final String emoji;
  final VoidCallback onTap;

  const _NegocioCard({required this.negocio, required this.emoji, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final isActivo = negocio.activo;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: isActivo ? Colors.white.withOpacity(0.8) : const Color(0xFFE2E8F0).withOpacity(0.5),
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: isActivo ? Colors.white.withOpacity(0.4) : const Color(0xFFCBD5E1).withOpacity(0.5)),
          boxShadow: [
            BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 20, offset: const Offset(0, 6)),
          ],
        ),
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top row: icon + active badge
            Row(
              children: [
                Container(
                  width: 48, height: 48,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(colors: [Color(0xFFDBEAFE), Color(0xFFEFF6FF)]),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Center(child: Text(emoji, style: const TextStyle(fontSize: 22))),
                ),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: isActivo ? const Color(0xFFF0FDF4) : _kSlate100,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: isActivo ? const Color(0xFFBBF7D0) : const Color(0xFFE2E8F0)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(isActivo ? Icons.check_circle : Icons.cancel, size: 12, color: isActivo ? const Color(0xFF16A34A) : _kSlate400),
                      const SizedBox(width: 4),
                      Text(isActivo ? 'Activo' : 'Suspendido',
                          style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.bold, color: isActivo ? const Color(0xFF16A34A) : _kSlate400)),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            // Name + system
            Text(negocio.nombre, style: GoogleFonts.inter(fontSize: 17, fontWeight: FontWeight.w800, color: _kSlate800)),
            Text((negocio.sistemaAsignado ?? '').toUpperCase(),
                style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: _kBluePrimary)),
            const Spacer(),
            // Bottom button
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 12),
              decoration: BoxDecoration(
                color: _kSlate50,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.settings, size: 16, color: _kSlate500),
                  const SizedBox(width: 6),
                  Text('Ir al Dashboard', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700, color: _kSlate500)),
                  const SizedBox(width: 4),
                  Icon(Icons.arrow_forward, size: 14, color: _kSlate500),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// "Nuevo Negocio" button
// ─────────────────────────────────────────────────────────────────────────────
class _NewNegocioButton extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => _showCreateDialog(context),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: _kBluePrimary,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [BoxShadow(color: _kBluePrimary.withOpacity(0.3), blurRadius: 12, offset: const Offset(0, 4))],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.add, color: Colors.white, size: 18),
            const SizedBox(width: 6),
            Text('Nuevo', style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
          ],
        ),
      ),
    );
  }

  void _showCreateDialog(BuildContext context) {
    final nameCtrl = TextEditingController();
    final whatsCtrl = TextEditingController();
    String sistema = '';
    bool usaMesas = false;
    int capacidad = 10;
    int duracion = 30;
    final aperturaCtrl = TextEditingController(text: '09:00');
    final cierreCtrl = TextEditingController(text: '18:00');

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) {
        return StatefulBuilder(builder: (ctx, setModalState) {
          return Padding(
            padding: EdgeInsets.fromLTRB(24, 16, 24, MediaQuery.of(ctx).viewInsets.bottom + 24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Handle
                Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.grey[300], borderRadius: BorderRadius.circular(2)))),
                const SizedBox(height: 16),
                Text('Crear Nuevo Negocio', style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.bold)),
                const SizedBox(height: 16),
                _field('Nombre Comercial', nameCtrl),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: DropdownButtonFormField<String>(
                        value: sistema.isEmpty ? null : sistema,
                        decoration: _inputDec('Sistema'),
                        items: ['TAQUERIA', 'CITAS', 'PARQUEADERO', 'RESTAURANTES', 'TATTOO']
                            .map((s) => DropdownMenuItem(value: s, child: Text(s, style: GoogleFonts.inter(fontSize: 13))))
                            .toList(),
                        onChanged: (v) => setModalState(() => sistema = v ?? ''),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(child: _field('WhatsApp', whatsCtrl)),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(child: _field('Apertura', aperturaCtrl)),
                    const SizedBox(width: 12),
                    Expanded(child: _field('Cierre', cierreCtrl)),
                  ],
                ),
                const SizedBox(height: 20),
                ElevatedButton(
                  onPressed: () async {
                    if (nameCtrl.text.isEmpty || sistema.isEmpty) return;
                    final provider = Provider.of<BusinessProvider>(ctx, listen: false);
                    final auth = Provider.of<AuthProvider>(ctx, listen: false);
                    try {
                      final api = provider.api;
                      await api.post('/negocios', {
                        'nombre': nameCtrl.text,
                        'sistemaAsignado': sistema,
                        'telefonoWhatsApp': whatsCtrl.text,
                        'horaApertura': aperturaCtrl.text,
                        'horaCierre': cierreCtrl.text,
                        'capacidadMaxima': capacidad,
                        'duracionMinutosCita': duracion,
                        'usaMesas': usaMesas,
                        'activo': true,
                      });
                      if (ctx.mounted) Navigator.pop(ctx);
                      provider.fetchNegocios(auth.user);
                    } catch (e) {
                      debugPrint('Create error: $e');
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _kBluePrimary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  child: Text('Guardar Negocio', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 15)),
                ),
              ],
            ),
          );
        });
      },
    );
  }

  Widget _field(String label, TextEditingController ctrl) {
    return TextField(
      controller: ctrl,
      style: GoogleFonts.inter(fontSize: 14),
      decoration: _inputDec(label),
    );
  }

  static InputDecoration _inputDec(String label) {
    return InputDecoration(
      labelText: label,
      labelStyle: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.bold, color: _kSlate400, letterSpacing: 1),
      filled: true,
      fillColor: _kSlate50,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: _kBluePrimary, width: 1.5)),
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Background blob (lightweight, matching Layout.tsx)
// ─────────────────────────────────────────────────────────────────────────────
class _BgBlob extends StatefulWidget {
  final double size;
  final Color color;
  final bool delayed;
  const _BgBlob({required this.size, required this.color, this.delayed = false});

  @override
  State<_BgBlob> createState() => _BgBlobState();
}

class _BgBlobState extends State<_BgBlob> with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _anim;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(seconds: 8))..repeat(reverse: true);
    _anim = Tween(begin: 0.85, end: 1.15).animate(CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut));
    if (widget.delayed) {
      _ctrl.stop();
      Future.delayed(const Duration(seconds: 2), () { if (mounted) _ctrl.repeat(reverse: true); });
    }
  }

  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _anim,
      builder: (_, __) => Transform.scale(
        scale: _anim.value,
        child: ImageFiltered(
          imageFilter: ImageFilter.blur(sigmaX: 60, sigmaY: 60),
          child: Container(
            width: widget.size,
            height: widget.size,
            decoration: BoxDecoration(color: widget.color, shape: BoxShape.circle),
          ),
        ),
      ),
    );
  }
}
