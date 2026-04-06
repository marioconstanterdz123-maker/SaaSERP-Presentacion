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
  // Client identification fields (for Llevar / Mostrador)
  String identificadorCliente = '';
  String telefonoCliente = '';
  bool isLoading = true;
  bool isSubmitting = false;
  String? successMsg;

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
      final res = await _api.get('/Comandas/activas');
      if (res.statusCode == 200) {
        final List data = jsonDecode(res.body);
        comandasActivas = data.map((c) => ComandaActiva.fromJson(c)).toList();
        notifyListeners();
      }
    } catch (e) {
      debugPrint('Error fetching comandas: $e');
    }
  }

  void addToCart(Servicio s) {
    final idx = cart.indexWhere((i) => i.servicioId == s.id);
    if (idx >= 0) {
      cart[idx].cantidad++;
    } else {
      cart.add(CartItem(
        servicioId: s.id,
        nombre: s.nombre,
        precio: s.precio,
        cantidad: 1,
      ));
    }
    notifyListeners();
  }

  void removeFromCart(int servicioId) {
    final idx = cart.indexWhere((i) => i.servicioId == servicioId);
    if (idx >= 0) {
      if (cart[idx].cantidad > 1) {
        cart[idx].cantidad--;
      } else {
        cart.removeAt(idx);
      }
    }
    notifyListeners();
  }

  void deleteFromCart(int servicioId) {
    cart.removeWhere((i) => i.servicioId == servicioId);
    notifyListeners();
  }

  void updateItemNotes(int servicioId, String notes) {
    final idx = cart.indexWhere((i) => i.servicioId == servicioId);
    if (idx >= 0) {
      cart[idx].notas = notes;
      // No notifyListeners here to avoid disrupting the TextField focus
    }
  }

  void clearCart() {
    cart = [];
    mesaSeleccionada = '';
    identificadorCliente = '';
    telefonoCliente = '';
    notifyListeners();
  }

  Future<bool> submitOrder(String negocioId) async {
    if (cart.isEmpty) return false;

    // Determine the final identifier: mesa name or client name
    final String identificadorFinal = tipoAtencion == 'Mesa'
        ? mesaSeleccionada
        : identificadorCliente.trim();

    // Normalize phone for WhatsApp (MX: +521 prefix for 10-digit numbers)
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

      final res = await _api.post('/Comandas', body);
      if (res.statusCode == 200 || res.statusCode == 201) {
        clearCart();
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
