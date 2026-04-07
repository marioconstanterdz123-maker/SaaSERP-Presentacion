import 'dart:convert';
import 'package:flutter/material.dart';
import '../../../models/models.dart';
import '../../../core/services/api_service.dart';

class PosProvider with ChangeNotifier {
  final ApiService _api = ApiService();
  List<Servicio> servicios = [];
  List<CartItem> cart = [];
  List<ComandaActiva> comandasActivas = [];
  List<Mesa> mesas = [];
  String tipoAtencion = 'Mostrador';
  String mesaSeleccionada = '';
  // Client identification fields (persist across modal open/close)
  String identificadorCliente = '';
  String telefonoCliente = '';
  bool isLoading = true;
  bool isSubmitting = false;

  int get cartCount => cart.fold(0, (sum, i) => sum + i.cantidad);
  double get cartTotal => cart.fold(0.0, (sum, i) => sum + i.subtotal);

  Future<void> init(String negocioId, bool usaMesas) async {
    isLoading = true;
    notifyListeners();

    try {
      final servRes = await _api.get('/Servicios/negocio/$negocioId');
      if (servRes.statusCode == 200) {
        final List data = jsonDecode(servRes.body);
        servicios = data
            .map((s) => Servicio.fromJson(s))
            .where((s) => s.activo)
            .toList();
      }

      if (usaMesas) {
        final mesaRes = await _api.get('/Recursos/negocio/$negocioId');
        if (mesaRes.statusCode == 200) {
          final List data = jsonDecode(mesaRes.body);
          mesas = data.map((m) => Mesa.fromJson(m)).toList();
          tipoAtencion = 'Mesa';
        }
      }

      await fetchComandasActivas(negocioId);
    } catch (e) {
      debugPrint('POS init error: $e');
    }

    isLoading = false;
    notifyListeners();
  }

  Future<void> fetchComandasActivas(String negocioId) async {
    try {
      final res = await _api.get('/Comandas/activas', headers: {'X-Negocio-Id': negocioId});
      if (res.statusCode == 200) {
        final List data = jsonDecode(res.body);
        comandasActivas = data.map((c) => ComandaActiva.fromJson(c)).toList();
        notifyListeners();
      }
    } catch (e) {
      debugPrint('Error fetching comandas: $e');
    }
  }

  /// Each tap on a product ALWAYS adds a new separate line item.
  /// This is intentional: items with the same product can have different
  /// notes (e.g., "sin cebolla"), so they must be independent.
  void addToCart(Servicio s) {
    cart.add(CartItem(
      servicioId: s.id,
      nombre: s.nombre,
      precio: s.precio,
      cantidad: 1,
    ));
    notifyListeners();
  }

  /// Increase quantity of a specific line item (identified by its list index).
  void incrementItem(int index) {
    if (index >= 0 && index < cart.length) {
      cart[index].cantidad++;
      notifyListeners();
    }
  }

  /// Decrease quantity of a specific line item (remove if it reaches 0).
  void decrementItem(int index) {
    if (index < 0 || index >= cart.length) return;
    if (cart[index].cantidad > 1) {
      cart[index].cantidad--;
    } else {
      cart.removeAt(index);
    }
    notifyListeners();
  }

  /// Remove a specific line item by its list index.
  void deleteItem(int index) {
    if (index >= 0 && index < cart.length) {
      cart.removeAt(index);
      notifyListeners();
    }
  }

  void updateItemNotes(int index, String notes) {
    if (index >= 0 && index < cart.length) {
      cart[index].notas = notes;
      // No notifyListeners here to avoid disrupting the TextField focus
    }
  }

  /// Clears only the items in the cart, but PRESERVES the tipo/client info
  /// so the mesero doesn't have to re-enter the client name between orders.
  void clearItems() {
    cart = [];
    notifyListeners();
  }

  /// Full reset including tipo, client fields, and mesa selection.
  void clearCart() {
    cart = [];
    mesaSeleccionada = '';
    identificadorCliente = '';
    telefonoCliente = '';
    tipoAtencion = 'Mostrador';
    notifyListeners();
  }

  Future<bool> submitOrder(String negocioId) async {
    if (cart.isEmpty) return false;

    final String identificadorFinal = tipoAtencion == 'Mesa'
        ? mesaSeleccionada
        : identificadorCliente.trim();

    final String telefonoLimpio =
        telefonoCliente.replaceAll(RegExp(r'\D'), '');
    final String telefonoWa =
        telefonoLimpio.length == 10 ? '521$telefonoLimpio' : telefonoLimpio;

    isSubmitting = true;
    notifyListeners();

    try {
      final body = {
        'negocioId': int.tryParse(negocioId) ?? 0,
        'nombreCliente':
            identificadorFinal.isNotEmpty ? identificadorFinal : 'Sin nombre',
        'identificadorMesa': identificadorFinal,
        'tipoAtencion': tipoAtencion == 'Mesa' ? 'Mesas' : tipoAtencion,
        'telefonoCliente': telefonoWa,
        'total': cartTotal,
        'detalles': cart
            .map((i) => {
                  'servicioId': i.servicioId,
                  'cantidad': i.cantidad,
                  'subtotal': i.subtotal,
                  'notasOpcionales': i.notas,
                })
            .toList(),
      };

      final res = await _api.post('/Comandas', body, headers: {'X-Negocio-Id': negocioId});
      if (res.statusCode == 200 || res.statusCode == 201) {
        clearItems(); // Keep client info, just clear the product list
        await fetchComandasActivas(negocioId);
        isSubmitting = false;
        notifyListeners();
        return true;
      }
    } catch (e) {
      debugPrint('Submit order error: $e');
    }

    isSubmitting = false;
    notifyListeners();
    return false;
  }
}
