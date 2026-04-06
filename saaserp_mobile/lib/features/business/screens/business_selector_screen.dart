import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../auth/providers/auth_provider.dart';
import '../providers/business_provider.dart';
import '../../../models/negocio.dart';

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

  String _getEmoji(String? sistema) {
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

  Color _getSistemaColor(String? sistema) {
    switch (sistema) {
      case 'CITAS':
        return const Color(0xFFA855F7);
      case 'TAQUERIA':
      case 'RESTAURANTES':
        return const Color(0xFFF97316);
      case 'PARQUEADERO':
        return const Color(0xFF3B82F6);
      default:
        return const Color(0xFF6366F1);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final user = auth.user;

    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      body: Consumer<BusinessProvider>(
        builder: (context, provider, child) {
          return CustomScrollView(
            slivers: [
              // Decorative header matching the web's dark aesthetic
              SliverToBoxAdapter(
                child: Container(
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      colors: [Color(0xFF1E293B), Color(0xFF0F172A)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                  ),
                  padding: EdgeInsets.fromLTRB(
                      24, MediaQuery.of(context).padding.top + 24, 24, 32),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(10),
                                decoration: BoxDecoration(
                                  color: Colors.indigo.withOpacity(0.3),
                                  borderRadius: BorderRadius.circular(14),
                                ),
                                child: const Icon(Icons.store_mall_directory,
                                    color: Colors.white, size: 22),
                              ),
                              const SizedBox(width: 12),
                              Text('SaaSERP',
                                  style: GoogleFonts.inter(
                                      color: Colors.white,
                                      fontSize: 22,
                                      fontWeight: FontWeight.w900)),
                            ],
                          ),
                          // Logout
                          GestureDetector(
                            onTap: () {
                              provider.deseleccionarNegocio();
                              auth.logout();
                            },
                            child: Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: Colors.white.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: const Icon(Icons.logout,
                                  color: Colors.white70, size: 18),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),
                      Text('Tus Negocios',
                          style: GoogleFonts.inter(
                              color: Colors.white,
                              fontSize: 28,
                              fontWeight: FontWeight.w900)),
                      const SizedBox(height: 4),
                      Text(
                          'Selecciona una sucursal para iniciar operaciones',
                          style: GoogleFonts.inter(
                              color: Colors.white54, fontSize: 13)),
                      if (user != null) ...[
                        const SizedBox(height: 16),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 12, vertical: 8),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              CircleAvatar(
                                radius: 14,
                                backgroundColor: Colors.indigo,
                                child: Text(
                                  user.email[0].toUpperCase(),
                                  style: GoogleFonts.inter(
                                      color: Colors.white,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 12),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(user.email,
                                      style: GoogleFonts.inter(
                                          color: Colors.white,
                                          fontSize: 12,
                                          fontWeight: FontWeight.bold),
                                      overflow: TextOverflow.ellipsis),
                                  Text(user.rol,
                                      style: GoogleFonts.inter(
                                          color: Colors.indigo[200],
                                          fontSize: 10,
                                          fontWeight: FontWeight.bold)),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),

              // Business list
              if (provider.isLoading)
                const SliverFillRemaining(
                    child: Center(child: CircularProgressIndicator()))
              else if (provider.negocios.isEmpty)
                SliverFillRemaining(
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.store_outlined,
                            size: 56, color: Colors.grey[300]),
                        const SizedBox(height: 16),
                        Text('No tienes negocios asignados',
                            style: GoogleFonts.inter(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: Colors.grey[500])),
                        const SizedBox(height: 8),
                        Text('Contacta al administrador del sistema.',
                            style: GoogleFonts.inter(
                                fontSize: 13, color: Colors.grey[400])),
                      ],
                    ),
                  ),
                )
              else
                SliverPadding(
                  padding: const EdgeInsets.all(16),
                  sliver: SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        final negocio = provider.negocios[index];
                        return _NegocioCard(
                          negocio: negocio,
                          emoji: _getEmoji(negocio.sistemaAsignado),
                          sistemaColor: _getSistemaColor(negocio.sistemaAsignado),
                          onTap: () => provider.seleccionarNegocio(negocio),
                        );
                      },
                      childCount: provider.negocios.length,
                    ),
                  ),
                ),
            ],
          );
        },
      ),
    );
  }
}

class _NegocioCard extends StatelessWidget {
  final Negocio negocio;
  final String emoji;
  final Color sistemaColor;
  final VoidCallback onTap;

  const _NegocioCard({
    required this.negocio,
    required this.emoji,
    required this.sistemaColor,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: const Color(0xFFE2E8F0)),
          boxShadow: [
            BoxShadow(
                color: Colors.black.withOpacity(0.04),
                blurRadius: 16,
                offset: const Offset(0, 4))
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            children: [
              Row(
                children: [
                  Container(
                    width: 52,
                    height: 52,
                    decoration: BoxDecoration(
                      color: sistemaColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Center(
                      child: Text(emoji,
                          style: const TextStyle(fontSize: 24)),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(negocio.nombre,
                            style: GoogleFonts.inter(
                                fontSize: 16,
                                fontWeight: FontWeight.w800,
                                color: const Color(0xFF1E293B))),
                        Text(
                            (negocio.sistemaAsignado ?? '').toUpperCase(),
                            style: GoogleFonts.inter(
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                                color: sistemaColor)),
                      ],
                    ),
                  ),
                  // Active badge
                  if (negocio.activo)
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF0FDF4),
                        borderRadius: BorderRadius.circular(12),
                        border:
                            Border.all(color: const Color(0xFFBBF7D0)),
                      ),
                      child: Text('Activo',
                          style: GoogleFonts.inter(
                              color: const Color(0xFF16A34A),
                              fontSize: 11,
                              fontWeight: FontWeight.bold)),
                    )
                  else
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(12),
                        border:
                            Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: Text('Inactivo',
                          style: GoogleFonts.inter(
                              color: const Color(0xFF94A3B8),
                              fontSize: 11,
                              fontWeight: FontWeight.bold)),
                    ),
                ],
              ),
              const SizedBox(height: 16),
              const Divider(height: 1, color: Color(0xFFF1F5F9)),
              const SizedBox(height: 14),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  Text('Entrar al Dashboard',
                      style: GoogleFonts.inter(
                          fontWeight: FontWeight.w700,
                          fontSize: 13,
                          color: const Color(0xFF475569))),
                  const SizedBox(width: 4),
                  const Icon(Icons.arrow_forward_ios,
                      size: 12, color: Color(0xFF475569)),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
