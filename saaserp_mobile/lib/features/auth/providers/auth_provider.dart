import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../core/services/api_service.dart';
import '../../../models/user.dart';

class AuthProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();
  User? _user;
  String? _token;
  bool _isLoading = false;

  User? get user => _user;
  String? get token => _token;
  bool get isAuthenticated => _token != null && _user != null;
  bool get isLoading => _isLoading;

  Future<bool> checkAuthStatus() async {
    final prefs = await SharedPreferences.getInstance();
    if (!prefs.containsKey('auth_token')) return false;

    _token = prefs.getString('auth_token');
    
    // Si tenemos los datos del usuario cacheados
    if (prefs.containsKey('user_data')) {
      final userData = jsonDecode(prefs.getString('user_data')!);
      _user = User.fromJson(userData);
      notifyListeners();
      return true;
    }

    return false;
  }

  Map<String, dynamic>? _decodeJwt(String token) {
    try {
      final parts = token.split('.');
      if (parts.length != 3) return null;
      final payload = parts[1];
      var normalized = base64Url.normalize(payload);
      final resp = utf8.decode(base64Url.decode(normalized));
      return jsonDecode(resp);
    } catch (_) {
      return null;
    }
  }

  Future<bool> login(String email, String password) async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await _apiService.post('/Auth/login', {
        'correo': email,
        'password': password,
      });

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        _token = data['token'] ?? data['Token'];
        
        if (_token != null) {
          final decoded = _decodeJwt(_token!);
          if (decoded != null) {
            _user = User(
              id: decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ?? decoded['sub'] ?? '',
              nombre: decoded['name'] ?? decoded['email'] ?? '',
              email: decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] ?? decoded['email'] ?? '',
              rol: decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ?? decoded['role'] ?? 'Operativo',
              idRol: 0,
              negocioIdActivo: decoded['NegocioId'] != null ? int.tryParse(decoded['NegocioId'].toString()) : null,
            );

            final prefs = await SharedPreferences.getInstance();
            await prefs.setString('auth_token', _token!);
            await prefs.setString('user_data', jsonEncode(_user!.toJson()));

            _isLoading = false;
            notifyListeners();
            return true;
          }
        }
      }
    } catch (e) {
      print('Login error: $e');
    }

    _isLoading = false;
    notifyListeners();
    return false;
  }

  Future<void> logout() async {
    _token = null;
    _user = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    await prefs.remove('user_data');
    notifyListeners();
  }
}
