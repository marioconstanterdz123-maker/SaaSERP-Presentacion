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

  Future<http.Response> get(String endpoint, {Map<String, String>? headers}) async {
    final reqHeaders = await _getHeaders();
    if (headers != null) reqHeaders.addAll(headers);
    final url = Uri.parse('${ApiConfig.baseUrl}$endpoint');
    return await http.get(url, headers: reqHeaders).timeout(
      const Duration(seconds: ApiConfig.timeoutSeconds),
    );
  }

  Future<http.Response> post(String endpoint, dynamic body, {Map<String, String>? headers}) async {
    final reqHeaders = await _getHeaders();
    if (headers != null) reqHeaders.addAll(headers);
    final url = Uri.parse('${ApiConfig.baseUrl}$endpoint');
    return await http.post(
      url, 
      headers: reqHeaders, 
      body: jsonEncode(body)
    ).timeout(
      const Duration(seconds: ApiConfig.timeoutSeconds),
    );
  }

  Future<http.Response> put(String endpoint, dynamic body, {Map<String, String>? headers}) async {
    final reqHeaders = await _getHeaders();
    if (headers != null) reqHeaders.addAll(headers);
    final url = Uri.parse('${ApiConfig.baseUrl}$endpoint');
    return await http.put(
      url, 
      headers: reqHeaders, 
      body: jsonEncode(body)
    ).timeout(
      const Duration(seconds: ApiConfig.timeoutSeconds),
    );
  }

  Future<http.Response> delete(String endpoint, {Map<String, String>? headers}) async {
    final reqHeaders = await _getHeaders();
    if (headers != null) reqHeaders.addAll(headers);
    final url = Uri.parse('${ApiConfig.baseUrl}$endpoint');
    return await http.delete(url, headers: reqHeaders).timeout(
      const Duration(seconds: ApiConfig.timeoutSeconds),
    );
  }
}
