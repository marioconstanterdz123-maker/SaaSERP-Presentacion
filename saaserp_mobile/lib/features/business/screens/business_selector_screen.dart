import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../auth/providers/auth_provider.dart';
import '../providers/business_provider.dart';

class BusinessSelectorScreen extends StatefulWidget {
  const BusinessSelectorScreen({Key? key}) : super(key: key);

  @override
  State<BusinessSelectorScreen> createState() => _BusinessSelectorScreenState();
}

class _BusinessSelectorScreenState extends State<BusinessSelectorScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final user = Provider.of<AuthProvider>(context, listen: false).user;
      Provider.of<BusinessProvider>(context, listen: false).fetchNegocios(user);
    });
  }

  void _onBusinessSelected(BuildContext context, dynamic negocio) {
    Provider.of<BusinessProvider>(context, listen: false).seleccionarNegocio(negocio);
    // TODO: Navegar al Dashboard / Punto de Venta Principal
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.blueGrey[50],
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Text(
          'Tus Negocios',
          style: GoogleFonts.inter(
            color: Colors.blueGrey[900],
            fontWeight: FontWeight.w800,
            fontSize: 24,
          ),
        ),
        actions: [
          IconButton(
            icon: Icon(Icons.logout, color: Colors.blueGrey[600]),
            onPressed: () {
              Provider.of<BusinessProvider>(context, listen: false).deseleccionarNegocio();
              Provider.of<AuthProvider>(context, listen: false).logout();
            },
          )
        ],
      ),
      body: Consumer<BusinessProvider>(
        builder: (context, provider, child) {
          if (provider.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          if (provider.negocios.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.store_outlined, size: 64, color: Colors.blueGrey[300]),
                  const SizedBox(height: 16),
                  Text(
                    'No tienes negocios asignados',
                    style: GoogleFonts.inter(fontSize: 18, color: Colors.blueGrey[500]),
                  ),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () async {
              final user = Provider.of<AuthProvider>(context, listen: false).user;
              await provider.fetchNegocios(user);
            },
            child: ListView.builder(
              padding: const EdgeInsets.all(16.0),
              itemCount: provider.negocios.length,
              itemBuilder: (context, index) {
                final negocio = provider.negocios[index];
                
                return Card(
                  margin: const EdgeInsets.only(bottom: 16.0),
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(20),
                    side: BorderSide(color: Colors.white, width: 2),
                  ),
                  child: InkWell(
                    borderRadius: BorderRadius.circular(20),
                    onTap: () => _onBusinessSelected(context, negocio),
                    child: Padding(
                      padding: const EdgeInsets.all(20.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: Colors.blue[50],
                                  borderRadius: BorderRadius.circular(16),
                                ),
                                child: Icon(Icons.storefront, color: Colors.blue[700]),
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      negocio.nombre,
                                      style: GoogleFonts.inter(
                                        fontSize: 18,
                                        fontWeight: FontWeight.bold,
                                        color: Colors.blueGrey[900],
                                      ),
                                    ),
                                    if (negocio.sistemaAsignado != null)
                                      Text(
                                        negocio.sistemaAsignado!.toUpperCase(),
                                        style: GoogleFonts.inter(
                                          fontSize: 12,
                                          fontWeight: FontWeight.w600,
                                          color: Colors.blue[600],
                                        ),
                                      ),
                                  ],
                                ),
                              ),
                              if (negocio.activo)
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: Colors.green[50],
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(color: Colors.green[200]!),
                                  ),
                                  child: Text(
                                    'Activo',
                                    style: GoogleFonts.inter(
                                      color: Colors.green[700],
                                      fontSize: 12,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                            ],
                          ),
                          const SizedBox(height: 20),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.end,
                            children: [
                              Text(
                                'Entrar al Dashboard',
                                style: GoogleFonts.inter(
                                  fontWeight: FontWeight.w600,
                                  color: Colors.blueGrey[700],
                                ),
                              ),
                              const SizedBox(width: 8),
                              Icon(Icons.arrow_forward, size: 18, color: Colors.blueGrey[700]),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }
}
