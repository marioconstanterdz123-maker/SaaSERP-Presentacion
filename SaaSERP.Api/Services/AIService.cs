using Microsoft.Extensions.Configuration;
using SaaSERP.Api.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.Json.Nodes;
using System.Threading.Tasks;

namespace SaaSERP.Api.Services
{
    public class AIService : IAIService
    {
        private readonly HttpClient _httpClient;
        private readonly ICitaService _citaService;
        private readonly IChatMemoryService _chatMemoryService;
        private readonly IEvolutionService _evolutionService;
        private readonly INegocioService _negocioService;
        private readonly IEstadiaService _estadiaService;
        private readonly IComandaService _comandaService;
        private readonly string _apiKey;
        private readonly string _endpoint;

        public AIService(
            HttpClient httpClient, 
            IConfiguration config, 
            ICitaService citaService, 
            IChatMemoryService chatMemoryService, 
            IEvolutionService evolutionService,
            INegocioService negocioService,
            IEstadiaService estadiaService,
            IComandaService comandaService)
        {
            _httpClient = httpClient;
            _citaService = citaService;
            _chatMemoryService = chatMemoryService;
            _evolutionService = evolutionService;
            _negocioService = negocioService;
            _estadiaService = estadiaService;
            _comandaService = comandaService;
            _apiKey = config["DeepSeek:ApiKey"] ?? string.Empty;
            _endpoint = config["DeepSeek:BaseUrl"] ?? "https://api.deepseek.com/chat/completions";

            if (!string.IsNullOrEmpty(_apiKey))
            {
                _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {_apiKey}");
            }
        }

        public async Task ProcesarMensajeEntranteAsync(string textoOriginal, Negocio negocio, string numeroCliente, string instancia)
        {
            // 1. Guardar mensaje del usuario
            await _chatMemoryService.GuardarMensajeAsync(numeroCliente, "user", textoOriginal);

            // 2. Recuperar historial
            var historial = await _chatMemoryService.ObtenerHistorialAsync(numeroCliente, 15);

            // 3. Armar System Prompt
            string systemPrompt = $@"
Actúa como la Asistente Virtual Inteligente para el negocio '{negocio.Nombre}'.
Tu tarea es atender a los clientes de manera amable, breve y profesional. Dependiendo del negocio, podrías agendar citas, tomar pedidos de comida/productos, o manejar entradas de vehículos. Usa emojis.
FECHA Y HORA ACTUAL DEL SISTEMA: {DateTime.Now:yyyy-MM-dd HH:mm:ss}
HORARIO DE ATENCIÓN: de {negocio.HoraApertura:hh\:mm} a {negocio.HoraCierre:hh\:mm} (Maneja formato 24 hrs en tus Tools).
DURACIÓN BASE POR DEFECTO DE CITAS: {negocio.DuracionMinutosCita} mins.

REGLAS DE ORO:
- Utiliza SIEMPRE 'consultar_catalogo' si el usuario pide precios, menú o quiere agendar/pedir algo. Así sabrás qué vende este negocio.
- Usa formato estricto ISO 8601 (YYYY-MM-DDTHH:mm:ss) para TODAS las fechas en las tools.
- NUNCA asumas la disponibilidad, SIEMPRE usa la herramienta 'consultar_disponibilidad' antes de agendar, pasando los IDs pertinentes.
- Si el cliente quiere cancelar o reprogramar, usa 'consultar_mis_citas' para obtener el ID de su cita activa.
- Si el cliente saluda manda un mensaje de bienvenida presentándote.
";

            var messages = new List<object>
            {
                new { role = "system", content = systemPrompt }
            };

            foreach (var h in historial)
            {
                // Solo insertamos mensajes validos del usuario o el asistente
                if (h.Rol == "user" || h.Rol == "assistant")
                {
                    messages.Add(new { role = h.Rol, content = h.Contenido });
                }
            }

            var tools = ObtenerDefinicionHerramientas();

            bool keepLooping = true;
            int maxLoops = 5; // Seguridad anti-bucles infinitos
            int loops = 0;

            while (keepLooping && loops < maxLoops)
            {
                loops++;
                
                var payload = new
                {
                    model = "deepseek-chat", // standard DeepSeek model
                    messages = messages,
                    tools = tools,
                    temperature = 0.2
                };

                var requestContent = new StringContent(JsonSerializer.Serialize(payload, new JsonSerializerOptions { DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull }), Encoding.UTF8, "application/json");
                var response = await _httpClient.PostAsync(_endpoint, requestContent);
                var jsonResponse = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    Console.WriteLine($"DeepSeek Error: {jsonResponse}");
                    await _evolutionService.EnviarMensajeTextoAsync(instancia, numeroCliente, "Disculpa, tengo un fallo temporal en el servidor. Intenta en breves momentos.");
                    return;
                }

                // Parse DeepSeek response using JsonNode to avoid lifecycle disposed object exceptions
                var rootNode = JsonNode.Parse(jsonResponse);
                var choice = rootNode["choices"][0]["message"];
                
                var responseRole = choice["role"]?.ToString();
                var responseContent = choice["content"]?.ToString() ?? string.Empty;

                var toolCallsNode = choice["tool_calls"];
                if (toolCallsNode != null && toolCallsNode is JsonArray toolCallsArray && toolCallsArray.Count > 0)
                {
                    // Es un llamado a Herramienta
                    messages.Add(new 
                    { 
                        role = "assistant", 
                        content = responseContent, // Podria ser nulo o vacio
                        tool_calls = toolCallsNode // Asignamos el JsonNode tal cual
                    });

                    // Ejecutar cada herramienta pedida
                    foreach (var toolCall in toolCallsArray)
                    {
                        var toolCallId = toolCall["id"]?.ToString();
                        var function = toolCall["function"];
                        var functionName = function["name"]?.ToString();
                        var arguments = function["arguments"]?.ToString();

                        Console.WriteLine($"[IA] Ejecutando Tool: {functionName} con args {arguments}");
                        string toolResult = await EjecutarHerramientaAsync(functionName, arguments, negocio.Id, numeroCliente, negocio.DuracionMinutosCita);
                        
                        messages.Add(new 
                        {
                            role = "tool",
                            tool_call_id = toolCallId,
                            name = functionName,
                            content = toolResult
                        });
                    }
                }
                else
                {
                    // Respuesta final al usuario
                    if (!string.IsNullOrWhiteSpace(responseContent))
                    {
                        await _evolutionService.EnviarMensajeTextoAsync(instancia, numeroCliente, responseContent);
                        await _chatMemoryService.GuardarMensajeAsync(numeroCliente, "assistant", responseContent);
                    }
                    keepLooping = false;
                }
            }
        }

        private async Task<string> EjecutarHerramientaAsync(string nombre, string argumentosJson, int negocioId, string telefono, int duracionCita)
        {
            try
            {
                using var doc = JsonDocument.Parse(argumentosJson);
                var args = doc.RootElement;

                if (nombre == "consultar_catalogo")
                {
                    var servicios = await _negocioService.ObtenerServiciosAsync(negocioId);
                    return JsonSerializer.Serialize(servicios);
                }
                else if (nombre == "consultar_recursos")
                {
                    var recursos = await _negocioService.ObtenerRecursosAsync(negocioId);
                    return JsonSerializer.Serialize(recursos);
                }
                else if (nombre == "consultar_disponibilidad")
                {
                    var fechaStr = args.GetProperty("fechaHoraInicio").GetString();
                    int? servId = args.TryGetProperty("servicioId", out var sProp) && sProp.ValueKind == JsonValueKind.Number ? sProp.GetInt32() : (int?)null;
                    int? recId = args.TryGetProperty("recursoId", out var rProp) && rProp.ValueKind == JsonValueKind.Number ? rProp.GetInt32() : (int?)null;
                    
                    var fechaIn = DateTime.Parse(fechaStr);
                    var fechaFi = fechaIn.AddMinutes(duracionCita);

                    if (servId.HasValue)
                    {
                        var ss = await _negocioService.ObtenerServiciosAsync(negocioId);
                        var targetService = ss.FirstOrDefault(x => x.Id == servId);
                        if (targetService != null) fechaFi = fechaIn.AddMinutes(targetService.DuracionMinutos);
                    }

                    bool disp = await _citaService.ValidarDisponibilidadAsync(negocioId, fechaIn, fechaFi, recId);
                    return disp ? $"Disponible (Terminaría a las {fechaFi:HH:mm})" : "Estrictamente Ocupado";
                }
                else if (nombre == "registrar_cita")
                {
                    var fechaStr = args.GetProperty("fechaHoraInicio").GetString();
                    var nombreCliente = args.GetProperty("nombreCliente").GetString();
                    
                    int? servId = args.TryGetProperty("servicioId", out var sProp) && sProp.ValueKind == JsonValueKind.Number ? sProp.GetInt32() : (int?)null;
                    int? recId = args.TryGetProperty("recursoId", out var rProp) && rProp.ValueKind == JsonValueKind.Number ? rProp.GetInt32() : (int?)null;

                    var fechaIn = DateTime.Parse(fechaStr);
                    var fechaFi = fechaIn.AddMinutes(duracionCita);
                    
                    if (servId.HasValue)
                    {
                        var ss = await _negocioService.ObtenerServiciosAsync(negocioId);
                        var targetService = ss.FirstOrDefault(x => x.Id == servId);
                        if (targetService != null) fechaFi = fechaIn.AddMinutes(targetService.DuracionMinutos);
                    }

                    var cita = new Cita { NegocioId = negocioId, TelefonoCliente = telefono, NombreCliente = nombreCliente, FechaHoraInicio = fechaIn, FechaHoraFin = fechaFi, Estado = "Pendiente", ServicioId = servId, RecursoId = recId };
                    int id = await _citaService.RegistrarCitaAsync(cita);
                    return $"Cita registrada exitosamente con ID {id}.";
                }
                else if (nombre == "consultar_mis_citas")
                {
                    var citas = await _citaService.ObtenerCitasPorTelefonoAsync(negocioId, telefono);
                    var citasList = citas.Select(c => $"ID: {c.Id}, FechaInicio: {c.FechaHoraInicio:yyyy-MM-dd HH:mm}").ToList();
                    return citasList.Count > 0 ? string.Join(" | ", citasList) : "El cliente no tiene citas activas registradas.";
                }
                else if (nombre == "cancelar_cita")
                {
                    int id = args.GetProperty("citaId").GetInt32();
                    bool success = await _citaService.CancelarCitaAsync(id);
                    return success ? "La cita fue cancelada exitosamente." : "No se encontró la cita, no se pudo cancelar.";
                }
                else if (nombre == "reprogramar_cita")
                {
                    int id = args.GetProperty("citaId").GetInt32();
                    var nuevaStr = args.GetProperty("nuevaFechaHoraInicio").GetString();
                    var fechaIn = DateTime.Parse(nuevaStr);
                    var fechaFi = fechaIn.AddMinutes(duracionCita);
                    
                    // Verificamos antes de mover
                    bool disp = await _citaService.ValidarDisponibilidadAsync(negocioId, fechaIn, fechaFi);
                    if (!disp) return "Ese nuevo horario esta Ocupado, rechazada.";

                    bool success = await _citaService.ReprogramarCitaAsync(id, fechaIn, fechaFi);
                    return success ? "Reprogramada exitosamente." : "Error: El ID no existe.";
                }
                else if (nombre == "registrar_entrada_vehiculo")
                {
                    var placa = args.GetProperty("placaOIdentificador").GetString()?.ToUpperInvariant() ?? "";
                    int resId = await _estadiaService.RegistrarEntradaAsync(negocioId, placa);
                    if (resId == -1) return $"Error: El vehiculo con placa {placa} ya esta registrado adentro.";
                    return $"Vehiculo {placa} registrado con exito entrando a esta hora.";
                }
                else if (nombre == "calcular_cobro_vehiculo")
                {
                    var placa = args.GetProperty("placaOIdentificador").GetString()?.ToUpperInvariant() ?? "";
                    bool cobrar = args.TryGetProperty("cobrarYDareSalida", out var prop) && prop.GetBoolean();
                    
                    var result = await _estadiaService.CalcularCobroAsync(negocioId, placa, !cobrar);
                    
                    if (result.EstadiaId == -1) return "No se encontro ningun vehiculo vivo con esa placa en el negocio.";
                    
                    if (cobrar) return $"Ticket PAGADO exitosamente. Total cobrado: ${result.MontoTotal} MXN por {result.MinutosTranscurridos} minutos.";
                    else return $"El costo ACTUAL a cobrar seria: ${result.MontoTotal} MXN acumulados por {result.MinutosTranscurridos} minutos transcurridos. Pregunta al empleado si quiere confirmar el cobro.";
                }
                else if (nombre == "tomar_pedido")
                {
                    var tipoAtencion = args.GetProperty("tipoAtencion").GetString() ?? "Mostrador";
                    var identificadorMesa = args.TryGetProperty("identificadorMesa", out var propMesa) ? propMesa.GetString() : "";
                    var nombreCli = args.GetProperty("nombreCliente").GetString() ?? "Cliente";
                    
                    var detallesJson = args.GetProperty("productos");
                    var listaDetalles = new List<DetalleComanda>();
                    foreach (var d in detallesJson.EnumerateArray())
                    {
                        var serId = d.GetProperty("servicioId").GetInt32();
                        var cant = d.GetProperty("cantidad").GetInt32();
                        var notas = d.TryGetProperty("notas", out var nprop) ? nprop.GetString() : "";
                        listaDetalles.Add(new DetalleComanda { ServicioId = serId, Cantidad = cant, NotasOpcionales = notas ?? "" });
                    }

                    var comanda = new Comanda { NegocioId = negocioId, TelefonoCliente = telefono, NombreCliente = nombreCli, TipoAtencion = tipoAtencion, IdentificadorMesa = identificadorMesa ?? "" };
                    var res = await _comandaService.CrearComandaAsync(comanda, listaDetalles);

                    if (res.ComandaId == -1) return "Error procesando el pedido.";
                    return $"Pedido/Comanda #{res.ComandaId} creada con éxito. El Total a cobrar exacto calculado por la Base de Datos es ${res.TotalCalculado} MXN. Confírmale al cliente este total y su número de pedido.";
                }
                else if (nombre == "consultar_estado_pedido")
                {
                    var estado = await _comandaService.ObtenerEstadoComandaAsync(negocioId, telefono);
                    if (estado == null) return "El cliente no tiene ningún pedido activo o ya fue pagado.";
                    return $"Pedido #{estado.Id} a nombre de {estado.NombreCliente} está actualmente: {estado.Estado}. Total: ${estado.Total}";
                }
            }
            catch (Exception ex)
            {
                return $"Error ejecutando la herramienta: el formato JSON o argumento era invalido ({ex.Message}).";
            }

            return "Error: Herramienta desconocida por el sistema central.";
        }

        private object[] ObtenerDefinicionHerramientas()
        {
            return new object[]
            {
                new 
                {
                    type = "function",
                    function = new { name = "consultar_catalogo", description = "Pide al sistema la lista de servicios con sus IDs, duraciones y precios.", parameters = new { type = "object", properties = new object() } }
                },
                new 
                {
                    type = "function",
                    function = new 
                    {
                        name = "registrar_entrada_vehiculo",
                        description = "Obligatorio para Parqueaderos. Llama a esta tool cuando te dicen que entro un carro, dando su placa.",
                        parameters = new 
                        {
                            type = "object",
                            properties = new { placaOIdentificador = new { type = "string", description = "Placas del vehiculo (Ej: XYZ-123)" } },
                            required = new[] { "placaOIdentificador" }
                        }
                    }
                },
                new 
                {
                    type = "function",
                    function = new 
                    {
                        name = "calcular_cobro_vehiculo",
                        description = "Para Parqueaderos. Llama aqui para calcular cuanto debe pagar la placa antes de irse. Si ya te confirmo que quiere cobrar, mandas cobrarYDareSalida=true.",
                        parameters = new 
                        {
                            type = "object",
                            properties = new 
                            { 
                                placaOIdentificador = new { type = "string", description = "Placas" },
                                cobrarYDareSalida = new { type = "boolean", description = "True = cobra, False = solo dice cuanto es" }
                            },
                            required = new[] { "placaOIdentificador", "cobrarYDareSalida" }
                        }
                    }
                },
                new 
                {
                    type = "function",
                    function = new 
                    {
                        name = "tomar_pedido",
                        description = "Crea un pedido/comanda para restaurantes, tiendas o taquerías. Requiere que le envíes en el array los IDs de los servicios obtenidos del catalogo y la cantidad de cada uno.",
                        parameters = new 
                        {
                            type = "object",
                            properties = new 
                            { 
                                tipoAtencion = new { type = "string", description = "Mostrador, Mesa, o Llevar" },
                                identificadorMesa = new { type = "string", description = "Si eligio Mesa, escribe el numero. Si no, vacio." },
                                nombreCliente = new { type = "string", description = "Nombre o apodo del cliente" },
                                productos = new 
                                {
                                    type = "array",
                                    items = new 
                                    {
                                        type = "object",
                                        properties = new 
                                        {
                                            servicioId = new { type = "integer", description = "ID del producto/servicio extraido de consultar_catalogo" },
                                            cantidad = new { type = "integer", description = "Piezas pedidas" },
                                            notas = new { type = "string", description = "Ej: Sin cebolla, con hielo" }
                                        },
                                        required = new[] { "servicioId", "cantidad" }
                                    }
                                }
                            },
                            required = new[] { "tipoAtencion", "nombreCliente", "productos" }
                        }
                    }
                },
                new 
                {
                    type = "function",
                    function = new { name = "consultar_estado_pedido", description = "Revisa como va la comida o el pedido del cliente que te esta hablando.", parameters = new { type = "object", properties = new object() } }
                },
                new 
                {
                    type = "function",
                    function = new { name = "consultar_recursos", description = "Lista los recursos (canchas, doctores, barberos, habitaciones) disponibles en este negocio con sus IDs.", parameters = new { type = "object", properties = new object() } }
                },
                new 
                {
                    type = "function",
                    function = new 
                    {
                        name = "consultar_disponibilidad",
                        description = "Revisa si hay lugar en la agenda para una fecha y hora específica. Si piden recurso o servicio, envíalos para mayor precisión.",
                        parameters = new 
                        {
                            type = "object",
                            properties = new 
                            {
                                fechaHoraInicio = new { type = "string", description = "Formato estricto ISO 8601: YYYY-MM-DDTHH:mm:ss" },
                                servicioId = new { type = "integer", description = "Opcional. Si el cliente escogió un servicio." },
                                recursoId = new { type = "integer", description = "Opcional. Si el cliente escogió un recurso/persona específica." }
                            },
                            required = new[] { "fechaHoraInicio" }
                        }
                    }
                },
                new 
                {
                    type = "function",
                    function = new 
                    {
                        name = "registrar_cita",
                        description = "Registra y asegura la cita en el sistema. Solo usarlo si consultar_disponibilidad regresó 'Disponible'.",
                        parameters = new 
                        {
                            type = "object",
                            properties = new 
                            {
                                fechaHoraInicio = new { type = "string", description = "Formato estricto ISO 8601: YYYY-MM-DDTHH:mm:ss" },
                                nombreCliente = new { type = "string", description = "Nombre del cliente para la cabecera de la cita" },
                                servicioId = new { type = "integer", description = "Opcional." },
                                recursoId = new { type = "integer", description = "Opcional." }
                            },
                            required = new[] { "fechaHoraInicio", "nombreCliente" }
                        }
                    }
                },
                new 
                {
                    type = "function",
                    function = new 
                    {
                        name = "consultar_mis_citas",
                        description = "Úsala ANTES de cancelar o reprogramar. Trae la lista de las citas del cliente que está hablando contigo.",
                        parameters = new { type = "object", properties = new object() }
                    }
                },
                new 
                {
                    type = "function",
                    function = new 
                    {
                        name = "cancelar_cita",
                        description = "Cancela la cita en la base de datos requiriendo su ID obtenido de consultar_mis_citas.",
                        parameters = new 
                        {
                            type = "object",
                            properties = new 
                            {
                                citaId = new { type = "integer", description = "El ID de la cita que el usuario te pidió cancelar" }
                            },
                            required = new[] { "citaId" }
                        }
                    }
                },
                new 
                {
                    type = "function",
                    function = new 
                    {
                        name = "reprogramar_cita",
                        description = "Reserva un nuevo horario para una cita vieja. Requiere que pases su ID.",
                        parameters = new 
                        {
                            type = "object",
                            properties = new 
                            {
                                citaId = new { type = "integer", description = "EL ID de la cita que cambiará de fecha" },
                                nuevaFechaHoraInicio = new { type = "string", description = "Formato estricto ISO 8601: YYYY-MM-DDTHH:mm:ss" }
                            },
                            required = new[] { "citaId", "nuevaFechaHoraInicio" }
                        }
                    }
                }
            };
        }
    }
}
