class CartItem {
  final int servicioId;
  final String nombre;
  final double precio;
  int cantidad;
  String notas;

  CartItem({
    required this.servicioId,
    required this.nombre,
    required this.precio,
    required this.cantidad,
    this.notas = '',
  });

  double get subtotal => precio * cantidad;
}

class Servicio {
  final int id;
  final String nombre;
  final double precio;
  final bool activo;
  final int duracionEstimadaMinutos;

  Servicio({
    required this.id,
    required this.nombre,
    required this.precio,
    required this.activo,
    required this.duracionEstimadaMinutos,
  });

  factory Servicio.fromJson(Map<String, dynamic> json) {
    return Servicio(
      id: json['id'] ?? 0,
      nombre: json['nombre'] ?? '',
      precio: (json['precio'] ?? 0).toDouble(),
      activo: json['activo'] ?? true,
      duracionEstimadaMinutos: json['duracionEstimadaMinutos'] ?? 0,
    );
  }
}

class ComandaActiva {
  final int id;
  final String nombreCliente;
  final String identificadorMesa;
  final String tipoAtencion;
  final double total;
  final String estado;
  final String fechaCreacion;
  final List<dynamic> detalles;

  ComandaActiva({
    required this.id,
    required this.nombreCliente,
    required this.identificadorMesa,
    required this.tipoAtencion,
    required this.total,
    required this.estado,
    required this.fechaCreacion,
    required this.detalles,
  });

  factory ComandaActiva.fromJson(Map<String, dynamic> json) {
    return ComandaActiva(
      id: json['id'] ?? 0,
      nombreCliente: json['nombreCliente'] ?? '',
      identificadorMesa: json['identificadorMesa'] ?? '',
      tipoAtencion: json['tipoAtencion'] ?? '',
      total: (json['total'] ?? 0).toDouble(),
      estado: json['estado'] ?? '',
      fechaCreacion: json['fechaCreacion'] ?? '',
      detalles: json['detalles'] ?? [],
    );
  }
}

class Mesa {
  final int id;
  final String nombre;
  final bool ocupada;

  Mesa({required this.id, required this.nombre, required this.ocupada});

  factory Mesa.fromJson(Map<String, dynamic> json) {
    return Mesa(
      id: json['id'] ?? 0,
      nombre: json['nombre'] ?? '',
      ocupada: json['ocupada'] ?? false,
    );
  }
}

class Vehiculo {
  final int id;
  final String placa;
  final String horaIngreso;
  final String tiempoTranscurrido;
  final double cobroPreliminar;
  final String? telefono;

  Vehiculo({
    required this.id,
    required this.placa,
    required this.horaIngreso,
    required this.tiempoTranscurrido,
    required this.cobroPreliminar,
    this.telefono,
  });

  factory Vehiculo.fromJson(Map<String, dynamic> json) {
    return Vehiculo(
      id: json['id'] ?? 0,
      placa: json['placa'] ?? '',
      horaIngreso: json['horaIngreso'] ?? '',
      tiempoTranscurrido: json['tiempoTranscurrido'] ?? '',
      cobroPreliminar: (json['cobroPreliminar'] ?? 0).toDouble(),
      telefono: json['telefono'],
    );
  }
}

class Cita {
  final int id;
  final String nombreCliente;
  final String telefonoCliente;
  final String fechaHoraInicio;
  final String estado;
  final String? nombreServicio;
  final String? nombreRecurso;
  final int duracionMinutos;

  Cita({
    required this.id,
    required this.nombreCliente,
    required this.telefonoCliente,
    required this.fechaHoraInicio,
    required this.estado,
    this.nombreServicio,
    this.nombreRecurso,
    required this.duracionMinutos,
  });

  factory Cita.fromJson(Map<String, dynamic> json) {
    return Cita(
      id: json['id'] ?? 0,
      nombreCliente: json['nombreCliente'] ?? '',
      telefonoCliente: json['telefonoCliente'] ?? '',
      fechaHoraInicio: json['fechaHoraInicio'] ?? '',
      estado: json['estado'] ?? '',
      nombreServicio: json['nombreServicio'],
      nombreRecurso: json['nombreRecurso'],
      duracionMinutos: json['duracionMinutos'] ?? 30,
    );
  }
}
