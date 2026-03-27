import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../dashboard/screens/dashboard_screen.dart';
import '../../pos/screens/pos_screen.dart';
import '../../pos/providers/pos_provider.dart';
import '../../operacion/screens/operacion_screen.dart';
import '../../historial/screens/historial_screen.dart';
import '../../catalogos/screens/catalogos_screen.dart';
import '../../auth/providers/auth_provider.dart';
import '../../business/providers/business_provider.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({Key? key}) : super(key: key);

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    final business = Provider.of<BusinessProvider>(context);
    final auth = Provider.of<AuthProvider>(context);
    final negocio = business.negocioActivo!;
    final negocioId = negocio.id.toString();
    final sistema = negocio.sistemaAsignado ?? 'TAQUERIA';

    // Determine which operation icon/label to show
    final String opLabel = sistema == 'PARQUEADERO' ? 'Caseta'
        : sistema == 'CITAS' ? 'Citas' : 'Cocina';
    final IconData opIcon = sistema == 'PARQUEADERO' ? Icons.local_parking
        : sistema == 'CITAS' ? Icons.calendar_today_outlined : Icons.restaurant_outlined;

    final List<Widget> screens = [
      DashboardScreen(negocioId: negocioId, negocioNombre: negocio.nombre),
      ChangeNotifierProvider(
        create: (_) => PosProvider(),
        child: PuntoDeVentaScreen(negocioId: negocioId, usaMesas: negocio.usaMesas),
      ),
      OperacionScreen(negocioId: negocioId, sistemaAsignado: sistema),
      HistorialScreen(negocioId: negocioId),
      CatalogosScreen(negocioId: negocioId, sistemaAsignado: sistema),
    ];

    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: screens,
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 20)],
        ),
        child: NavigationBar(
          selectedIndex: _currentIndex,
          onDestinationSelected: (i) => setState(() => _currentIndex = i),
          backgroundColor: Colors.white,
          indicatorColor: Colors.indigo.withOpacity(0.12),
          labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
          destinations: [
            NavigationDestination(
              icon: const Icon(Icons.dashboard_outlined),
              selectedIcon: const Icon(Icons.dashboard, color: Colors.indigo),
              label: 'Dashboard',
            ),
            NavigationDestination(
              icon: const Icon(Icons.point_of_sale_outlined),
              selectedIcon: const Icon(Icons.point_of_sale, color: Colors.indigo),
              label: 'POS',
            ),
            NavigationDestination(
              icon: Icon(opIcon),
              selectedIcon: Icon(opIcon, color: Colors.indigo),
              label: opLabel,
            ),
            NavigationDestination(
              icon: const Icon(Icons.history_outlined),
              selectedIcon: const Icon(Icons.history, color: Colors.indigo),
              label: 'Historial',
            ),
            NavigationDestination(
              icon: const Icon(Icons.menu_book_outlined),
              selectedIcon: const Icon(Icons.menu_book, color: Colors.indigo),
              label: 'Catálogo',
            ),
          ],
        ),
      ),
    );
  }
}
