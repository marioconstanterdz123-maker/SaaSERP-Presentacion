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
      final response = await _apiService.get('/Negocios');
      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        
        // Filtramos negocios basados en el rol
        if (user.rol == 'SuperAdmin' || user.rol == 'AdminNegocio') {
          // El backend ya filtra y devuelve sólo sus negocios si es AdminNegocio.
          _negocios = data.map((json) => Negocio.fromJson(json)).toList();
        } else {
          _negocios = data
              .map((json) => Negocio.fromJson(json))
              .where((n) => n.id == user.negocioIdActivo)
              .toList();
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
