import 'dart:convert';
import 'package:flutter/material.dart';
import '../../../core/services/api_service.dart';
import '../../../models/negocio.dart';
import '../../../models/user.dart';

class BusinessProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();
  ApiService get api => _apiService;
  List<Negocio> _negocios = [];
  Negocio? _negocioActivo;
  bool _isLoading = false;

  List<Negocio> get negocios => _negocios;
  Negocio? get negocioActivo => _negocioActivo;
  bool get isLoading => _isLoading;

  Future<void> fetchNegocios(User? user) async {
    if (user == null) return;
    
    _isLoading = true;
    notifyListeners();

    try {
      // El endpoint /mis-negocios filtra según el rol del usuario en el backend:
      // - SuperAdmin: ve todos
      // - AdminNegocio: ve los que tiene asignados en UsuarioNegocios
      // - Otros: solo su negocio primario
      final response = await _apiService.get('/Negocios/mis-negocios');
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data is List) {
          _negocios = data.map((json) => Negocio.fromJson(json)).toList();
        } else if (data is Map) {
          // Si devuelve un solo objeto (para roles operativos)
          _negocios = [Negocio.fromJson(data as Map<String, dynamic>)];
        }
      }
    } catch (e) {
      print('Error fetching negocios: $e');
    }

    _isLoading = false;
    notifyListeners();
  }

  void seleccionarNegocio(Negocio negocio) {
    _negocioActivo = negocio;
    notifyListeners();
  }

  void deseleccionarNegocio() {
    _negocioActivo = null;
    notifyListeners();
  }
}
