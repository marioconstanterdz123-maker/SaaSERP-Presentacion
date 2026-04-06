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
import '../../auth/providers/auth_provider.dart';
import '../../business/providers/business_provider.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({Key? key}) : super(key: key);

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;

  void _exitBusiness(BuildContext context) {
    Provider.of<BusinessProvider>(context, listen: false).deseleccionarNegocio();
  }

  @override
  Widget build(BuildContext context) {
    final business = Provider.of<BusinessProvider>(context);
    final auth = Provider.of<AuthProvider>(context);
    final negocio = business.negocioActivo!;
    final negocioId = negocio.id.toString();
    final sistema = negocio.sistemaAsignado ?? 'TAQUERIA';
    final rol = auth.user?.rol ?? 'Operativo';
    final esSuperAdmin = rol == 'SuperAdmin';
    final esAdmin = rol == 'Admin' || esSuperAdmin;

    // Determine which operation icon/label to show
    final String opLabel = sistema == 'PARQUEADERO'
        ? 'Caseta'
        : sistema == 'CITAS'
            ? 'Citas'
            : 'Cocina';
    final IconData opIcon = sistema == 'PARQUEADERO'
        ? Icons.local_parking
        : sistema == 'CITAS'
            ? Icons.calendar_today_outlined
            : Icons.restaurant_outlined;

    // Build tabs — role-gated
    final List<_NavItem> navItems = [
      _NavItem(
        icon: Icons.dashboard_outlined,
        selectedIcon: Icons.dashboard,
        label: 'Dashboard',
        screen: DashboardScreen(negocioId: negocioId, negocioNombre: negocio.nombre),
      ),
      _NavItem(
        icon: Icons.point_of_sale_outlined,
        selectedIcon: Icons.point_of_sale,
        label: 'POS',
        screen: ChangeNotifierProvider(
          create: (_) => PosProvider(),
          child: PuntoDeVentaScreen(negocioId: negocioId, usaMesas: negocio.usaMesas),
        ),
      ),
      _NavItem(
        icon: opIcon,
        selectedIcon: opIcon,
        label: opLabel,
        screen: OperacionScreen(negocioId: negocioId, sistemaAsignado: sistema),
      ),
      // History only for Admin+
      if (esAdmin)
        _NavItem(
          icon: Icons.history_outlined,
          selectedIcon: Icons.history,
          label: 'Historial',
          screen: HistorialScreen(negocioId: negocioId),
        ),
      _NavItem(
        icon: Icons.menu_book_outlined,
        selectedIcon: Icons.menu_book,
        label: 'Catálogo',
        screen: CatalogosScreen(negocioId: negocioId, sistemaAsignado: sistema),
      ),
      // Config only for Admin+
      if (esAdmin)
        _NavItem(
          icon: Icons.settings_outlined,
          selectedIcon: Icons.settings,
          label: 'Ajustes',
          screen: ConfiguracionScreen(negocioId: negocioId),
        ),
      // SuperAdmin: business management global
      if (esSuperAdmin)
        _NavItem(
          icon: Icons.store_mall_directory_outlined,
          selectedIcon: Icons.store_mall_directory,
          label: 'Negocios',
          screen: const NegociosAdminScreen(),
        ),
    ];

    // Clamp index in case nav changed
    if (_currentIndex >= navItems.length) {
      _currentIndex = 0;
    }

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) async {
        if (didPop) return;
        if (_currentIndex != 0) {
          setState(() => _currentIndex = 0);
        } else {
          final shouldExit = await showDialog<bool>(
            context: context,
            builder: (ctx) => AlertDialog(
              title: Text('Salir de SaaSERP',
                  style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
              content: Text('¿Seguro que quieres cerrar la aplicación?',
                  style: GoogleFonts.inter()),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(ctx).pop(false),
                  child: Text('Cancelar',
                      style: GoogleFonts.inter(color: Colors.grey)),
                ),
                TextButton(
                  onPressed: () => Navigator.of(ctx).pop(true),
                  child: Text('Salir',
                      style: GoogleFonts.inter(
                          color: Colors.red, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
          );
          if (shouldExit == true && context.mounted) {
            Navigator.of(context).pop();
          }
        }
      },
      child: Scaffold(
        appBar: AppBar(
          backgroundColor: const Color(0xFF1E293B),
          foregroundColor: Colors.white,
          title: Text(
            negocio.nombre,
            style: GoogleFonts.inter(fontWeight: FontWeight.w800, fontSize: 16),
          ),
          actions: [
            // Exit-business button — returns to business selector
            IconButton(
              tooltip: 'Cambiar negocio',
              icon: const Icon(Icons.swap_horiz),
              onPressed: () => _exitBusiness(context),
            ),
          ],
        ),
        body: IndexedStack(
          index: _currentIndex,
          children: navItems.map((item) => item.screen).toList(),
        ),
        bottomNavigationBar: Container(
          decoration: BoxDecoration(
            boxShadow: [
              BoxShadow(
                  color: Colors.black.withOpacity(0.1), blurRadius: 20)
            ],
          ),
          child: NavigationBar(
            selectedIndex: _currentIndex,
            onDestinationSelected: (i) {
              if (i < navItems.length) setState(() => _currentIndex = i);
            },
            backgroundColor: Colors.white,
            indicatorColor: Colors.indigo.withOpacity(0.12),
            labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
            destinations: navItems
                .map((item) => NavigationDestination(
                      icon: Icon(item.icon),
                      selectedIcon: Icon(item.selectedIcon, color: Colors.indigo),
                      label: item.label,
                    ))
                .toList(),
          ),
        ),
      ),
    );
  }
}

class _NavItem {
  final IconData icon;
  final IconData selectedIcon;
  final String label;
  final Widget screen;

  const _NavItem({
    required this.icon,
    required this.selectedIcon,
    required this.label,
    required this.screen,
  });
}
