import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';

import '../providers/pos_provider.dart';
import '../../../models/models.dart';
import '../../business/providers/business_provider.dart';

class PuntoDeVentaScreen extends StatefulWidget {
  final String negocioId;
  final bool usaMesas;

  const PuntoDeVentaScreen({
    Key? key,
    required this.negocioId,
    required this.usaMesas,
  }) : super(key: key);

  @override
  State<PuntoDeVentaScreen> createState() => _PuntoDeVentaScreenState();
}

class _PuntoDeVentaScreenState extends State<PuntoDeVentaScreen> {
  final _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<PosProvider>(context, listen: false)
          .init(widget.negocioId, widget.usaMesas);
    });
  }

  void _openCart(BuildContext context) {
    final pos = Provider.of<PosProvider>(context, listen: false);
    if (pos.cart.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Agrega productos al ticket primero')),
      );
      return;
    }

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => CartBottomSheet(negocioId: widget.negocioId),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<PosProvider>(builder: (context, pos, child) {
      if (pos.isLoading) {
        return const Center(child: CircularProgressIndicator());
      }

      final filteredProducts = pos.servicios.where((s) =>
          s.nombre.toLowerCase().contains(_searchQuery.toLowerCase())).toList();

      return Scaffold(
        backgroundColor: const Color(0xFFF1F5F9),
        appBar: AppBar(
          backgroundColor: const Color(0xFF1E293B),
          foregroundColor: Colors.white,
          title: Text(
            'Punto de Venta',
            style: GoogleFonts.inter(fontWeight: FontWeight.w800, fontSize: 18),
          ),
          actions: [
            // Cart badge button
            Stack(
              children: [
                IconButton(
                  icon: const Icon(Icons.shopping_cart_outlined),
                  onPressed: () => _openCart(context),
                ),
                if (pos.cartCount > 0)
                  Positioned(
                    right: 8,
                    top: 8,
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: const BoxDecoration(
                        color: Colors.indigo,
                        shape: BoxShape.circle,
                      ),
                      child: Text(
                        '${pos.cartCount}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ],
        ),
        body: Column(
          children: [
            // Mesa Selector
            if (widget.usaMesas && pos.mesas.isNotEmpty)
              _buildMesaSelector(pos),

            // Search bar
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
              child: TextField(
                controller: _searchController,
                style: GoogleFonts.inter(),
                decoration: InputDecoration(
                  hintText: 'Buscar productos...',
                  hintStyle: GoogleFonts.inter(color: Colors.grey[400]),
                  prefixIcon: const Icon(Icons.search, color: Colors.grey),
                  filled: true,
                  fillColor: Colors.white,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(16),
                    borderSide: BorderSide.none,
                  ),
                  contentPadding: const EdgeInsets.symmetric(vertical: 0, horizontal: 16),
                ),
                onChanged: (v) => setState(() => _searchQuery = v),
              ),
            ),

            // Products grid
            Expanded(
              child: filteredProducts.isEmpty
                  ? _buildEmptyState()
                  : GridView.builder(
                      padding: const EdgeInsets.fromLTRB(16, 0, 16, 100),
                      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 3,
                        childAspectRatio: 0.85,
                        crossAxisSpacing: 10,
                        mainAxisSpacing: 10,
                      ),
                      itemCount: filteredProducts.length,
                      itemBuilder: (context, index) {
                        final product = filteredProducts[index];
                        return _ProductCard(
                          product: product,
                          onTap: () => pos.addToCart(product),
                        );
                      },
                    ),
            ),
          ],
        ),
        // Persistent bottom bar when cart has items
        bottomNavigationBar: pos.cart.isNotEmpty
            ? _CartSummaryBar(
                total: pos.cartTotal,
                count: pos.cartCount,
                onViewCart: () => _openCart(context),
              )
            : null,
      );
    });
  }

  Widget _buildMesaSelector(PosProvider pos) {
    return SizedBox(
      height: 72,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        itemCount: pos.mesas.length,
        itemBuilder: (context, i) {
          final mesa = pos.mesas[i];
          final isSelected = pos.mesaSeleccionada == mesa.nombre;
          return GestureDetector(
            onTap: () {
              pos.mesaSeleccionada = mesa.nombre;
              pos.tipoAtencion = 'Mesa';
              (pos as dynamic).notifyListeners();
            },
            child: Container(
              margin: const EdgeInsets.only(right: 8),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: isSelected ? Colors.indigo : Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: isSelected ? Colors.indigo : Colors.grey[300]!,
                ),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.table_restaurant,
                    size: 18,
                    color: isSelected ? Colors.white : Colors.grey[600],
                  ),
                  const SizedBox(height: 2),
                  Text(
                    mesa.nombre,
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      color: isSelected ? Colors.white : Colors.grey[700],
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.coffee, size: 64, color: Colors.grey[300]),
          const SizedBox(height: 16),
          Text(
            'No hay productos activos',
            style: GoogleFonts.inter(color: Colors.grey[500], fontSize: 16),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }
}

class _ProductCard extends StatelessWidget {
  final Servicio product;
  final VoidCallback onTap;

  const _ProductCard({required this.product, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.04),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Text(
                product.nombre,
                style: GoogleFonts.inter(
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                  color: const Color(0xFF1E293B),
                ),
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              '\$${product.precio.toStringAsFixed(2)}',
              style: GoogleFonts.inter(
                fontSize: 16,
                fontWeight: FontWeight.w900,
                color: Colors.indigo[600],
              ),
            ),
            const SizedBox(height: 6),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 4),
              decoration: BoxDecoration(
                color: Colors.indigo[50],
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.add, size: 18, color: Colors.indigo),
            ),
          ],
        ),
      ),
    );
  }
}

class _CartSummaryBar extends StatelessWidget {
  final double total;
  final int count;
  final VoidCallback onViewCart;

  const _CartSummaryBar({
    required this.total,
    required this.count,
    required this.onViewCart,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 20),
      decoration: const BoxDecoration(
        color: Color(0xFF1E293B),
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        boxShadow: [BoxShadow(color: Colors.black26, blurRadius: 16)],
      ),
      child: SafeArea(
        child: GestureDetector(
          onTap: onViewCart,
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.indigo,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.shopping_cart, color: Colors.white, size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  'Ver Ticket ($count items)',
                  style: GoogleFonts.inter(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 15,
                  ),
                ),
              ),
              Text(
                '\$${total.toStringAsFixed(2)}',
                style: GoogleFonts.inter(
                  color: Colors.white,
                  fontWeight: FontWeight.w900,
                  fontSize: 18,
                ),
              ),
              const SizedBox(width: 8),
              const Icon(Icons.chevron_right, color: Colors.white70),
            ],
          ),
        ),
      ),
    );
  }
}

class CartBottomSheet extends StatelessWidget {
  final String negocioId;

  const CartBottomSheet({Key? key, required this.negocioId}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Consumer<PosProvider>(builder: (context, pos, child) {
      return DraggableScrollableSheet(
        initialChildSize: 0.85,
        maxChildSize: 0.95,
        minChildSize: 0.4,
        builder: (ctx, scrollController) {
          return Container(
            decoration: const BoxDecoration(
              color: Color(0xFF1E293B),
              borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
            ),
            child: Column(
              children: [
                // Handle + Header
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      Container(
                        width: 40,
                        height: 4,
                        decoration: BoxDecoration(
                          color: Colors.white24,
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          const Icon(Icons.receipt_long, color: Colors.white70),
                          const SizedBox(width: 8),
                          Text(
                            'Ticket de Pedido',
                            style: GoogleFonts.inter(
                              color: Colors.white,
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const Spacer(),
                          TextButton.icon(
                            onPressed: () {
                              pos.clearCart();
                              Navigator.pop(ctx);
                            },
                            icon: const Icon(Icons.delete_outline, color: Colors.redAccent, size: 18),
                            label: Text('Vaciar',
                              style: GoogleFonts.inter(color: Colors.redAccent, fontSize: 13)),
                          ),
                        ],
                      ),
                      // Tipo Atencion selector
                      const SizedBox(height: 12),
                      _TipoAtencionSelector(pos: pos),
                    ],
                  ),
                ),
                // Cart items
                Expanded(
                  child: ListView.builder(
                    controller: scrollController,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: pos.cart.length,
                    itemBuilder: (context, i) {
                      final item = pos.cart[i];
                      return _CartItemRow(item: item, pos: pos);
                    },
                  ),
                ),
                // Total + Button
                Container(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('Total:', style: GoogleFonts.inter(color: Colors.white70, fontSize: 16)),
                          Text(
                            '\$${pos.cartTotal.toStringAsFixed(2)}',
                            style: GoogleFonts.inter(
                              color: Colors.white,
                              fontSize: 28,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton.icon(
                          onPressed: pos.isSubmitting ? null : () async {
                            final success = await pos.submitOrder(negocioId);
                            if (success && context.mounted) {
                              Navigator.pop(context);
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('¡Pedido Enviado a Cocina!'),
                                  backgroundColor: Colors.green,
                                ),
                              );
                            }
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.indigo,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                            ),
                          ),
                          icon: pos.isSubmitting
                              ? const SizedBox(width: 18, height: 18,
                                  child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                              : const Icon(Icons.send),
                          label: Text(
                            pos.isSubmitting ? 'Enviando...' : 'Enviar a Cocina',
                            style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
      );
    });
  }
}

class _TipoAtencionSelector extends StatelessWidget {
  final PosProvider pos;
  const _TipoAtencionSelector({required this.pos});

  @override
  Widget build(BuildContext context) {
    final types = ['Mesa', 'Llevar', 'Mostrador'];
    return Row(
      children: types.map((t) {
        final isSelected = pos.tipoAtencion == t;
        return Expanded(
          child: GestureDetector(
            onTap: () {
              pos.tipoAtencion = t;
              (pos as dynamic).notifyListeners();
            },
            child: Container(
              margin: const EdgeInsets.only(right: 6),
              padding: const EdgeInsets.symmetric(vertical: 8),
              decoration: BoxDecoration(
                color: isSelected ? Colors.indigo : Colors.white12,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                t,
                textAlign: TextAlign.center,
                style: GoogleFonts.inter(
                  color: isSelected ? Colors.white : Colors.white54,
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                ),
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}

class _CartItemRow extends StatelessWidget {
  final CartItem item;
  final PosProvider pos;
  const _CartItemRow({required this.item, required this.pos});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white10,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(item.nombre,
                    style: GoogleFonts.inter(
                        color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                Text('\$${item.precio.toStringAsFixed(2)} c/u',
                    style: GoogleFonts.inter(color: Colors.white38, fontSize: 12)),
              ],
            ),
          ),
          Row(
            children: [
              _CircleBtn(
                icon: Icons.remove,
                onTap: () => pos.removeFromCart(item.servicioId),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 10),
                child: Text(
                  '${item.cantidad}',
                  style: GoogleFonts.inter(
                      color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                ),
              ),
              _CircleBtn(
                icon: Icons.add,
                onTap: () {
                  final s = pos.servicios.firstWhere((s) => s.id == item.servicioId);
                  pos.addToCart(s);
                },
              ),
            ],
          ),
          const SizedBox(width: 12),
          Text(
            '\$${item.subtotal.toStringAsFixed(2)}',
            style: GoogleFonts.inter(
              color: Colors.indigo[200],
              fontWeight: FontWeight.bold,
              fontSize: 14,
            ),
          ),
          const SizedBox(width: 6),
          GestureDetector(
            onTap: () => pos.deleteFromCart(item.servicioId),
            child: const Icon(Icons.close, color: Colors.redAccent, size: 20),
          ),
        ],
      ),
    );
  }
}

class _CircleBtn extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  const _CircleBtn({required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(6),
        decoration: BoxDecoration(
          color: Colors.white12,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(icon, color: Colors.white, size: 16),
      ),
    );
  }
}
