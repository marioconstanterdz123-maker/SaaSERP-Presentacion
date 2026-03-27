import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';

class ApiService {
  Future<Map<String, String>> _getHeaders() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('auth_token');
    
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  Future<http.Response> get(String endpoint) async {
    final headers = await _getHeaders();
    final url = Uri.parse('${ApiConfig.baseUrl}$endpoint');
    return await http.get(url, headers: headers).timeout(
      const Duration(seconds: ApiConfig.timeoutSeconds),
    );
  }

  Future<http.Response> post(String endpoint, Map<String, dynamic> body) async {
    final headers = await _getHeaders();
    final url = Uri.parse('${ApiConfig.baseUrl}$endpoint');
    return await http.post(
      url, 
      headers: headers, 
      body: jsonEncode(body)
    ).timeout(
      const Duration(seconds: ApiConfig.timeoutSeconds),
    );
  }

  Future<http.Response> put(String endpoint, Map<String, dynamic> body) async {
    final headers = await _getHeaders();
    final url = Uri.parse('${ApiConfig.baseUrl}$endpoint');
    return await http.put(
      url, 
      headers: headers, 
      body: jsonEncode(body)
    ).timeout(
      const Duration(seconds: ApiConfig.timeoutSeconds),
    );
  }

  Future<http.Response> delete(String endpoint) async {
    final headers = await _getHeaders();
    final url = Uri.parse('${ApiConfig.baseUrl}$endpoint');
    return await http.delete(url, headers: headers).timeout(
      const Duration(seconds: ApiConfig.timeoutSeconds),
    );
  }
}
