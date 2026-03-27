class Negocio {
  final int id;
  final String nombre;
  final String? direccion;
  final String? telefono;
  final String? sistemaAsignado;
  final bool activo;
  final bool usaMesas;

  Negocio({
    required this.id,
    required this.nombre,
    this.direccion,
    this.telefono,
    this.sistemaAsignado,
    required this.activo,
    required this.usaMesas,
  });

  factory Negocio.fromJson(Map<String, dynamic> json) {
    return Negocio(
      id: json['id'] ?? 0,
      nombre: json['nombre'] ?? '',
      direccion: json['direccion'],
      telefono: json['telefono'],
      sistemaAsignado: json['sistemaAsignado'],
      activo: json['activo'] ?? false,
      usaMesas: json['usaMesas'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'nombre': nombre,
      'direccion': direccion,
      'telefono': telefono,
      'sistemaAsignado': sistemaAsignado,
      'activo': activo,
      'usaMesas': usaMesas,
    };
  }
}
