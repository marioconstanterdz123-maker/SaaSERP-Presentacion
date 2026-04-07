import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../dashboard/screens/dashboard_screen.dart';
import '../../pos/screens/pos_screen.dart';
import '../../pos/providers/pos_provider.dart';
import '../../operacion/screens/operacion_screen.dart';
import '../../historial/screens/historial_screen.dart';
import '../../catalogos/screens/catalogos_screen.dart';
import '../../ajustes/screens/configuracion_screen.dart';
import '../../admin/screens/negocios_admin_screen.dart';
import '../../admin/screens/usuarios_admin_screen.dart';
import '../../auth/providers/auth_provider.dart';
import '../../business/providers/business_provider.dart';
import '../../shared/screens/whatsapp_webview_screen.dart';

// ─── Web design tokens ────────────────────────────────────────────────────────
const kSlate50  = Color(0xFFF8FAFC);
const kSlate100 = Color(0xFFF1F5F9);
const kSlate200 = Color(0xFFE2E8F0);
const kSlate400 = Color(0xFF94A3B8);
const kSlate500 = Color(0xFF64748B);
const kSlate800 = Color(0xFF1E293B);
const kSlate900 = Color(0xFF0F172A);

// Active nav = orange-500→rose-500 (matches web exactly)
const kActiveGradient = [Color(0xFFF97316), Color(0xFFF43F5E)];
const kActiveOrange   = Color(0xFFF97316);
const kInactiveColor  = kSlate400;

class HomeScreen extends StatefulWidget {
  const HomeScreen({Key? key}) : super(key: key);

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;
  bool _sidebarOpen = false;

  List<_NavItem> _buildNavItems(
      String negocioId, dynamic negocio, String rol) {
    final sistema = negocio.sistemaAsignado ?? 'TAQUERIA';
    final bool isTaqueria = sistema == 'TAQUERIA' || sistema == 'RESTAURANTES';
    final bool isCitas = sistema == 'CITAS';
    final bool isParqueadero = sistema == 'PARQUEADERO';
    final bool isAdmin = rol == 'SuperAdmin' || rol == 'AdminNegocio';
    final bool esSuperAdmin = rol == 'SuperAdmin';

    final items = <_NavItem>[];

    if (isAdmin) {
      items.add(_NavItem(
        icon: Icons.dashboard_outlined,
        selectedIcon: Icons.dashboard,
        shortName: 'Inicio',
        name: 'Resumen Local',
        screen: DashboardScreen(negocioId: negocioId, negocioNombre: negocio.nombre),
      ));
    }

    if (isTaqueria) {
      if (isAdmin) {
        items.add(_NavItem(
          icon: Icons.coffee_outlined,
          selectedIcon: Icons.coffee,
          shortName: 'Menú',
          name: 'Menú (Platillos)',
          screen: CatalogosScreen(negocioId: negocioId, sistemaAsignado: sistema),
        ));
      }
      if (rol != 'Cocinero') {
        items.add(_NavItem(
          icon: Icons.receipt_long_outlined,
          selectedIcon: Icons.receipt_long,
          shortName: 'POS',
          name: 'Punto de Venta',
          screen: ChangeNotifierProvider(
            create: (_) => PosProvider(),
            child: PuntoDeVentaScreen(negocioId: negocioId, usaMesas: negocio.usaMesas),
          ),
        ));
      }
      if (rol != 'Mesero') {
        items.add(_NavItem(
          icon: Icons.restaurant_outlined,
          selectedIcon: Icons.restaurant,
          shortName: 'Cocina',
          name: 'Cocina (KDS)',
          hasBadge: true,
          screen: OperacionScreen(negocioId: negocioId, sistemaAsignado: sistema, rol: rol),
        ));
      }
    } else if (isCitas) {
      if (isAdmin) {
        items.add(_NavItem(
          icon: Icons.content_cut_outlined,
          selectedIcon: Icons.content_cut,
          shortName: 'Servicios',
          name: 'Servicios',
          screen: CatalogosScreen(negocioId: negocioId, sistemaAsignado: sistema),
        ));
      }
      items.add(_NavItem(
        icon: Icons.calendar_month_outlined,
        selectedIcon: Icons.calendar_month,
        shortName: 'Agenda',
        name: 'Agenda / Citas',
        screen: OperacionScreen(negocioId: negocioId, sistemaAsignado: sistema, rol: rol),
      ));
    } else if (isParqueadero) {
      items.add(_NavItem(
        icon: Icons.local_parking_outlined,
        selectedIcon: Icons.local_parking,
        shortName: 'Caseta',
        name: 'Caseta Vehículos',
        screen: OperacionScreen(negocioId: negocioId, sistemaAsignado: sistema, rol: rol),
      ));
    } else {
      if (isAdmin) {
        items.add(_NavItem(
          icon: Icons.menu_book_outlined,
          selectedIcon: Icons.menu_book,
          shortName: 'Catálogo',
          name: 'Catálogo',
          screen: CatalogosScreen(negocioId: negocioId, sistemaAsignado: sistema),
        ));
      }
      items.add(_NavItem(
        icon: Icons.point_of_sale_outlined,
        selectedIcon: Icons.point_of_sale,
        shortName: 'POS',
        name: 'Punto de Venta',
        screen: ChangeNotifierProvider(
          create: (_) => PosProvider(),
          child: PuntoDeVentaScreen(negocioId: negocioId, usaMesas: negocio.usaMesas),
        ),
      ));
    }

    items.add(_NavItem(
      icon: Icons.chat_bubble_outline,
      selectedIcon: Icons.chat_bubble,
      shortName: 'WhatsApp',
      name: 'WhatsApp Web',
      screen: const WhatsAppWebviewScreen(),
    ));

    if (isAdmin) {
      items.add(_NavItem(
        icon: Icons.archive_outlined,
        selectedIcon: Icons.archive,
        shortName: 'Historial',
        name: 'Historial',
        screen: HistorialScreen(negocioId: negocioId),
      ));
      items.add(_NavItem(
        icon: Icons.settings_outlined,
        selectedIcon: Icons.settings,
        shortName: 'Ajustes',
        name: 'Ajustes',
        screen: ConfiguracionScreen(negocioId: negocioId),
      ));
    }

    if (esSuperAdmin) {
      items.add(_NavItem(
        icon: Icons.store_mall_directory_outlined,
        selectedIcon: Icons.store_mall_directory,
        shortName: 'Global',
        name: 'Gestión Global',
        screen: const NegociosAdminScreen(),
      ));
      items.add(_NavItem(
        icon: Icons.people_outline,
        selectedIcon: Icons.people,
        shortName: 'Usuarios',
        name: 'Gestión de Usuarios',
        screen: const UsuariosAdminScreen(),
      ));
    }

    return items;
  }

  @override
  Widget build(BuildContext context) {
    final business = Provider.of<BusinessProvider>(context);
    final auth     = Provider.of<AuthProvider>(context);
    final negocio  = business.negocioActivo!;
    final negocioId = negocio.id.toString();
    final rol       = auth.user?.rol ?? 'Operativo';

    final navItems = _buildNavItems(negocioId, negocio, rol);

    // Clamp index in case role changed
    if (_currentIndex >= navItems.length) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) setState(() => _currentIndex = 0);
      });
    }

    // Show max 5 in bottom bar, rest in sidebar drawer
    final bottomItems = navItems.take(5).toList();

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) async {
        if (didPop) return;
        if (_currentIndex != 0) {
          setState(() => _currentIndex = 0);
          return;
        }
        final shouldExit = await showDialog<bool>(
          context: context,
          builder: (ctx) => AlertDialog(
            title: Text('Salir', style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
            content: Text('¿Cerrar la aplicación?', style: GoogleFonts.inter()),
            actions: [
              TextButton(
                  onPressed: () => Navigator.pop(ctx, false),
                  child: Text('Cancelar', style: GoogleFonts.inter(color: Colors.grey))),
              TextButton(
                  onPressed: () => Navigator.pop(ctx, true),
                  child: Text('Salir',
                      style: GoogleFonts.inter(
                          color: Colors.red, fontWeight: FontWeight.bold))),
            ],
          ),
        );
        if (shouldExit == true && context.mounted) Navigator.of(context).pop();
      },
      child: Scaffold(
        backgroundColor: kSlate50,
        body: Stack(
          children: [
            // ── Animated background blobs (matching the web) ──────────────
            _AnimatedBlob(
              size: 320,
              color: const Color(0xFFFB923C).withOpacity(0.15), // orange-400
              top: -80,
              right: -60,
            ),
            _AnimatedBlob(
              size: 320,
              color: const Color(0xFFFB7185).withOpacity(0.12), // rose-400
              bottom: -80,
              left: -60,
              delayed: true,
            ),

            // ── Main content area ─────────────────────────────────────────
            Positioned.fill(
              child: Column(
                children: [
                  // WHITE BLUR TOP BAR (matches web's mobile top header)
                  _TopBar(
                    negocioNombre: negocio.nombre,
                    sistema: negocio.sistemaAsignado ?? '',
                    navItems: navItems,
                    onBack: () {
                      Provider.of<BusinessProvider>(context, listen: false)
                          .deseleccionarNegocio();
                    },
                    onMenuTap: navItems.length > 5
                        ? () => setState(() => _sidebarOpen = true)
                        : null,
                  ),
  
                  // Page content
                  Expanded(
                    child: IndexedStack(
                      index: _currentIndex.clamp(0, navItems.length - 1),
                      children: navItems.map((item) => item.screen).toList(),
                    ),
                  ),
                ],
              ),
            ),

            // ── Sidebar drawer (for overflow items) ───────────────────────
            if (_sidebarOpen)
              _SidebarDrawer(
                negocio: negocio,
                navItems: navItems,
                currentIndex: _currentIndex,
                onSelect: (i) => setState(() {
                  _currentIndex = i;
                  _sidebarOpen = false;
                }),
                onClose: () => setState(() => _sidebarOpen = false),
                onLogout: () {
                  auth.logout();
                  business.deseleccionarNegocio();
                },
                userEmail: auth.user?.email ?? '',
                userRol: auth.user?.rol ?? '',
              ),
          ],
        ),

        // ── BOTTOM TAB BAR ─────────────────────────────────────────────
        bottomNavigationBar: _BottomTabBar(
          items: bottomItems,
          currentIndex: _currentIndex,
          hasMore: navItems.length > 5,
          sidebarOpen: _sidebarOpen,
          onTap: (i) => setState(() => _currentIndex = i),
          onMoreTap: () => setState(() => _sidebarOpen = true),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Animated background blob (approximate web's filter blur blob)
// ─────────────────────────────────────────────────────────────────────────────
class _AnimatedBlob extends StatefulWidget {
  final double size;
  final Color color;
  final double? top;
  final double? bottom;
  final double? left;
  final double? right;
  final bool delayed;
  const _AnimatedBlob({
    required this.size,
    required this.color,
    this.top,
    this.bottom,
    this.left,
    this.right,
    this.delayed = false,
  });
  @override
  State<_AnimatedBlob> createState() => _AnimatedBlobState();
}

class _AnimatedBlobState extends State<_AnimatedBlob>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _anim;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
        vsync: this, duration: const Duration(seconds: 8))
      ..repeat(reverse: true);
    _anim = Tween(begin: 0.85, end: 1.15).animate(
        CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut));
    if (widget.delayed) {
      Future.delayed(const Duration(seconds: 2), () {
        if (mounted) _ctrl.forward();
      });
    }
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Positioned(
      top: widget.top,
      bottom: widget.bottom,
      left: widget.left,
      right: widget.right,
      child: AnimatedBuilder(
        animation: _anim,
        builder: (_, __) => Transform.scale(
          scale: _anim.value,
          child: ImageFiltered(
            imageFilter: ImageFilter.blur(sigmaX: 60, sigmaY: 60),
            child: Container(
              width: widget.size,
              height: widget.size,
              decoration: BoxDecoration(
                color: widget.color,
                shape: BoxShape.circle,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// White blur top bar
// ─────────────────────────────────────────────────────────────────────────────
class _TopBar extends StatelessWidget {
  final String negocioNombre;
  final String sistema;
  final List<_NavItem> navItems;
  final VoidCallback onBack;
  final VoidCallback? onMenuTap;

  const _TopBar({
    required this.negocioNombre,
    required this.sistema,
    required this.navItems,
    required this.onBack,
    this.onMenuTap,
  });

  @override
  Widget build(BuildContext context) {
    final topPad = MediaQuery.of(context).padding.top;
    return ClipRRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
        child: Container(
          color: Colors.white.withOpacity(0.9),
          padding: EdgeInsets.fromLTRB(16, topPad + 8, 16, 10),
          decoration: const BoxDecoration(
            border: Border(
              bottom: BorderSide(color: Color(0xFFE2E8F0), width: 0.5),
            ),
          ),
          child: Row(
            children: [
              // Back to negocio selector
              GestureDetector(
                onTap: onBack,
                child: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: kSlate100,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.arrow_back, size: 18, color: kSlate500),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(negocioNombre,
                        style: GoogleFonts.inter(
                            fontSize: 15,
                            fontWeight: FontWeight.w900,
                            color: kSlate800),
                        overflow: TextOverflow.ellipsis),
                    if (sistema.isNotEmpty)
                      Text('Workspace · $sistema',
                          style: GoogleFonts.inter(
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                              color: kActiveOrange,
                              letterSpacing: 0.5)),
                  ],
                ),
              ),
              // Menu button (appears when navItems > 5)
              if (onMenuTap != null)
                GestureDetector(
                  onTap: onMenuTap,
                  child: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: kSlate100,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.menu, size: 20, color: kSlate500),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Bottom tab bar — orange active, exactly like web
// ─────────────────────────────────────────────────────────────────────────────
class _BottomTabBar extends StatelessWidget {
  final List<_NavItem> items;
  final int currentIndex;
  final bool hasMore;
  final bool sidebarOpen;
  final ValueChanged<int> onTap;
  final VoidCallback onMoreTap;

  const _BottomTabBar({
    required this.items,
    required this.currentIndex,
    required this.hasMore,
    required this.sidebarOpen,
    required this.onTap,
    required this.onMoreTap,
  });

  @override
  Widget build(BuildContext context) {
    final bottomPad = MediaQuery.of(context).padding.bottom;
    return ClipRRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
        child: Container(
          decoration: const BoxDecoration(
            color: Color(0xFFFAFAFB), // near-white like web
            border: Border(top: BorderSide(color: Color(0xFFE2E8F0), width: 0.5)),
            boxShadow: [
              BoxShadow(
                  color: Color(0x14000000),
                  blurRadius: 24,
                  offset: Offset(0, -4)),
            ],
          ),
          padding: EdgeInsets.only(bottom: bottomPad),
          child: Row(
            children: [
              ...items.asMap().entries.map((e) {
                final i = e.key;
                final item = e.value;
                final isActive = currentIndex == i;
                return Expanded(
                  child: GestureDetector(
                    onTap: () => onTap(i),
                    behavior: HitTestBehavior.opaque,
                    child: _TabItem(item: item, isActive: isActive),
                  ),
                );
              }),
              if (hasMore)
                Expanded(
                  child: GestureDetector(
                    onTap: onMoreTap,
                    behavior: HitTestBehavior.opaque,
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Padding(
                          padding: const EdgeInsets.only(top: 8),
                          child: Icon(Icons.menu,
                              size: 22,
                              color: sidebarOpen ? kActiveOrange : kInactiveColor),
                        ),
                        Padding(
                          padding: const EdgeInsets.only(bottom: 8, top: 2),
                          child: Text('Más',
                              style: GoogleFonts.inter(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w700,
                                  color: sidebarOpen ? kActiveOrange : kInactiveColor)),
                        ),
                      ],
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _TabItem extends StatelessWidget {
  final _NavItem item;
  final bool isActive;
  const _TabItem({required this.item, required this.isActive});

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // TOP Indicator line (exact match to web's h-0.5 orange bar)
        Container(
          height: 2,
          width: 32,
          margin: const EdgeInsets.only(bottom: 0),
          decoration: BoxDecoration(
            color: isActive ? kActiveOrange : Colors.transparent,
            borderRadius: BorderRadius.circular(2),
          ),
        ),
        AnimatedScale(
          scale: isActive ? 1.1 : 1.0,
          duration: const Duration(milliseconds: 200),
          child: Padding(
            padding: const EdgeInsets.only(top: 6),
            child: Icon(
              isActive ? item.selectedIcon : item.icon,
              size: 22,
              color: isActive ? kActiveOrange : kInactiveColor,
            ),
          ),
        ),
        Padding(
          padding: const EdgeInsets.only(top: 2, bottom: 8),
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              Text(
                item.shortName,
                style: GoogleFonts.inter(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    color: isActive ? kActiveOrange : kInactiveColor),
              ),
              // Pulsing badge for Kitchen (KDS) — like web's animate-ping orange dot
              if (item.hasBadge)
                Positioned(
                  top: -4,
                  right: -8,
                  child: _PingDot(),
                ),
            ],
          ),
        ),
      ],
    );
  }
}

class _PingDot extends StatefulWidget {
  @override
  State<_PingDot> createState() => _PingDotState();
}

class _PingDotState extends State<_PingDot> with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _anim;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 900))
      ..repeat(reverse: false);
    _anim = Tween(begin: 0.4, end: 1.0).animate(
        CurvedAnimation(parent: _ctrl, curve: Curves.easeOut));
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 8,
      height: 8,
      child: Stack(
        alignment: Alignment.center,
        children: [
          ScaleTransition(
            scale: _anim,
            child: Container(
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: kActiveOrange.withOpacity(0.4),
              ),
            ),
          ),
          Container(
            width: 5,
            height: 5,
            decoration: const BoxDecoration(
              shape: BoxShape.circle,
              color: kActiveOrange,
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar drawer — matches web's mobile overlay
// ─────────────────────────────────────────────────────────────────────────────
class _SidebarDrawer extends StatelessWidget {
  final dynamic negocio;
  final List<_NavItem> navItems;
  final int currentIndex;
  final ValueChanged<int> onSelect;
  final VoidCallback onClose;
  final VoidCallback onLogout;
  final String userEmail;
  final String userRol;

  const _SidebarDrawer({
    required this.negocio,
    required this.navItems,
    required this.currentIndex,
    required this.onSelect,
    required this.onClose,
    required this.onLogout,
    required this.userEmail,
    required this.userRol,
  });

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        // Scrim
        GestureDetector(
          onTap: onClose,
          child: Container(
            color: kSlate900.withOpacity(0.5),
          ),
        ),
        // Drawer on the right (web uses ml-auto w-72)
        Positioned(
          top: 0,
          right: 0,
          bottom: 0,
          width: 288,
          child: Material(
            color: Colors.white,
            elevation: 24,
            child: Column(
              children: [
                SizedBox(height: MediaQuery.of(context).padding.top),
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 16, 16, 16),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              negocio.nombre ?? '',
                              style: GoogleFonts.inter(
                                  fontWeight: FontWeight.w900,
                                  fontSize: 16,
                                  color: kSlate800),
                            ),
                            Text(
                              (negocio.sistemaAsignado ?? '').toUpperCase(),
                              style: GoogleFonts.inter(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w700,
                                  color: kActiveOrange,
                                  letterSpacing: 1),
                            ),
                          ],
                        ),
                      ),
                      GestureDetector(
                        onTap: onClose,
                        child: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                              color: kSlate100,
                              borderRadius: BorderRadius.circular(12)),
                          child: const Icon(Icons.close, size: 20, color: kSlate500),
                        ),
                      ),
                    ],
                  ),
                ),
                const Divider(color: Color(0xFFF1F5F9), height: 1),
                Expanded(
                  child: ListView(
                    padding: const EdgeInsets.all(16),
                    children: navItems.asMap().entries.map((e) {
                      final isActive = currentIndex == e.key;
                      return GestureDetector(
                        onTap: () => onSelect(e.key),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          margin: const EdgeInsets.only(bottom: 4),
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                          decoration: BoxDecoration(
                            gradient: isActive
                                ? const LinearGradient(
                                    colors: kActiveGradient,
                                    begin: Alignment.centerLeft,
                                    end: Alignment.centerRight)
                                : null,
                            color: isActive ? null : Colors.transparent,
                            borderRadius: BorderRadius.circular(16),
                            boxShadow: isActive
                                ? [
                                    BoxShadow(
                                        color: kActiveOrange.withOpacity(0.3),
                                        blurRadius: 12,
                                        offset: const Offset(0, 4))
                                  ]
                                : null,
                          ),
                          child: Row(
                            children: [
                              Icon(
                                isActive ? e.value.selectedIcon : e.value.icon,
                                size: 20,
                                color: isActive ? Colors.white : kSlate500,
                              ),
                              const SizedBox(width: 12),
                              Text(e.value.name,
                                  style: GoogleFonts.inter(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w600,
                                      color: isActive ? Colors.white : kSlate500)),
                            ],
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ),
                const Divider(color: Color(0xFFF1F5F9), height: 1),
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      Row(
                        children: [
                          Container(
                            width: 36,
                            height: 36,
                            decoration: const BoxDecoration(
                              gradient: LinearGradient(
                                  colors: [Color(0xFFFB923C), Color(0xFFF43F5E)]),
                              shape: BoxShape.circle,
                            ),
                            child: Center(
                              child: Text(
                                userEmail.isNotEmpty
                                    ? userEmail[0].toUpperCase()
                                    : 'U',
                                style: GoogleFonts.inter(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w700,
                                    fontSize: 14),
                              ),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(userEmail,
                                    style: GoogleFonts.inter(
                                        fontSize: 12,
                                        fontWeight: FontWeight.bold,
                                        color: kSlate800),
                                    overflow: TextOverflow.ellipsis),
                                Text(userRol,
                                    style: GoogleFonts.inter(
                                        fontSize: 11,
                                        fontWeight: FontWeight.w700,
                                        color: kActiveOrange)),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      GestureDetector(
                        onTap: onLogout,
                        child: Container(
                          width: double.infinity,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFEF2F2),
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.logout,
                                  size: 16, color: Color(0xFFEF4444)),
                              const SizedBox(width: 6),
                              Text('Cerrar Sesión',
                                  style: GoogleFonts.inter(
                                      fontSize: 13,
                                      fontWeight: FontWeight.w700,
                                      color: const Color(0xFFEF4444))),
                            ],
                          ),
                        ),
                      ),
                      SizedBox(height: MediaQuery.of(context).padding.bottom),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Nav item data model
// ─────────────────────────────────────────────────────────────────────────────
class _NavItem {
  final IconData icon;
  final IconData selectedIcon;
  final String shortName;
  final String name;
  final Widget screen;
  final bool hasBadge;

  const _NavItem({
    required this.icon,
    required this.selectedIcon,
    required this.shortName,
    required this.name,
    required this.screen,
    this.hasBadge = false,
  });
}
