class User {
  final String id;
  final String email;
  final String nombre;
  final String rol;
  final int idRol;
  final int? negocioIdActivo;

  User({
    required this.id,
    required this.email,
    required this.nombre,
    required this.rol,
    this.idRol = 0,
    this.negocioIdActivo,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] ?? '',
      email: json['email'] ?? '',
      nombre: json['nombre'] ?? '',
      rol: json['rol'] ?? '',
      idRol: json['idRol'] ?? 0,
      negocioIdActivo: json['negocioIdActivo'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'nombre': nombre,
      'rol': rol,
      'idRol': idRol,
      'negocioIdActivo': negocioIdActivo,
    };
  }
}
