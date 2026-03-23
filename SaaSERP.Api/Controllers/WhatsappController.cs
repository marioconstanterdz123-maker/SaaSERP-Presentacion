using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SaaSERP.Api.Data;
using System.Text;
using System.Text.Json;
using SaaSERP.Api.Models;
using SaaSERP.Api.Services;
using Microsoft.Extensions.DependencyInjection;

namespace SaaSERP.Api.Controllers
{
    /// <summary>
    /// Gestión de Instancias de WhatsApp por Negocio (EvolutionAPI).
    /// Solo accesible para SuperAdmins.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "SuperAdmin")]
    public class WhatsAppController : ControllerBase
    {
        private readonly SaaSContext _context;
        private readonly IHttpClientFactory _httpFactory;
        private readonly string _baseUrl;
        private readonly string _apiKey;
        private readonly IServiceScopeFactory _scopeFactory;

        public WhatsAppController(SaaSContext context, IHttpClientFactory httpFactory, IConfiguration config, IServiceScopeFactory scopeFactory)
        {
            _context = context;
            _httpFactory = httpFactory;
            _baseUrl = config["EvolutionApi:BaseUrl"]!.TrimEnd('/');
            _apiKey = config["EvolutionApi:GlobalApiKey"]!;
            _scopeFactory = scopeFactory;
        }

        // ──────────────────────────────────────────
        // 1. CREAR INSTANCIA para un Negocio
        //    POST /api/WhatsApp/{negocioId}/crear
        // ──────────────────────────────────────────
        [HttpPost("{negocioId}/crear")]
        public async Task<IActionResult> CrearInstancia(int negocioId)
        {
            var negocio = await _context.Negocios.FindAsync(negocioId);
            if (negocio == null) return NotFound(new { error = "Negocio no encontrado." });

            string instancia = $"negocio_{negocioId}";

            // Llamar a EvolutionAPI para crear la instancia
            var client = _httpFactory.CreateClient();
            var payload = new { instanceName = instancia, integration = "WHATSAPP-BAILEYS", qrcode = true };
            var req = new HttpRequestMessage(HttpMethod.Post, $"{_baseUrl}/instance/create")
            {
                Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json")
            };
            req.Headers.Add("apikey", _apiKey);

            var res = await client.SendAsync(req);
            if (!res.IsSuccessStatusCode)
            {
                var err = await res.Content.ReadAsStringAsync();
                return BadRequest(new { error = "Error al crear instancia en EvolutionAPI.", detalle = err });
            }

            // NOTA: El Webhook se administra Vía Variables de Entorno Globales de EvolutionAPI (docker-compose)

            // Guardar el nombre de instancia en el negocio
            negocio.InstanciaWhatsApp = instancia;
            await _context.SaveChangesAsync();

            return Ok(new { instancia, mensaje = "Instancia creada. Solicita el QR para conectar el teléfono." });
        }

        // ──────────────────────────────────────────
        // 2. OBTENER QR CODE (Base64)
        //    GET /api/WhatsApp/{negocioId}/qr
        // ──────────────────────────────────────────
        [HttpGet("{negocioId}/qr")]
        public async Task<IActionResult> ObtenerQr(int negocioId)
        {
            var negocio = await _context.Negocios.FindAsync(negocioId);
            if (negocio == null || string.IsNullOrEmpty(negocio.InstanciaWhatsApp))
                return NotFound(new { error = "Este negocio no tiene instancia WhatsApp configurada. Primero crea la instancia." });

            var client = _httpFactory.CreateClient();
            var req = new HttpRequestMessage(HttpMethod.Get,
                $"{_baseUrl}/instance/connect/{negocio.InstanciaWhatsApp}");
            req.Headers.Add("apikey", _apiKey);

            var res = await client.SendAsync(req);
            var body = await res.Content.ReadAsStringAsync();

            if (!res.IsSuccessStatusCode)
                return BadRequest(new { error = "No se pudo obtener el QR.", detalle = body });

            // EvolutionAPI devuelve { base64: "data:image/png;base64,..." }
            return Content(body, "application/json");
        }

        // ──────────────────────────────────────────
        // 3. ESTADO DE LA CONEXIÓN
        //    GET /api/WhatsApp/{negocioId}/estado
        // ──────────────────────────────────────────
        [HttpGet("{negocioId}/estado")]
        public async Task<IActionResult> ObtenerEstado(int negocioId)
        {
            var negocio = await _context.Negocios.FindAsync(negocioId);
            if (negocio == null || string.IsNullOrEmpty(negocio.InstanciaWhatsApp))
                return Ok(new { estado = "SIN_INSTANCIA", conectado = false });

            var client = _httpFactory.CreateClient();
            var req = new HttpRequestMessage(HttpMethod.Get,
                $"{_baseUrl}/instance/connectionState/{negocio.InstanciaWhatsApp}");
            req.Headers.Add("apikey", _apiKey);

            var res = await client.SendAsync(req);
            if (!res.IsSuccessStatusCode)
                return Ok(new { estado = "ERROR", conectado = false, instancia = negocio.InstanciaWhatsApp });

            var body = await res.Content.ReadAsStringAsync();
            // EvolutionAPI devuelve { instance: { state: "open" } }
            using var doc = JsonDocument.Parse(body);
            var state = doc.RootElement
                .GetProperty("instance")
                .GetProperty("state")
                .GetString() ?? "DESCONOCIDO";

            return Ok(new
            {
                instancia = negocio.InstanciaWhatsApp,
                estado = state,
                conectado = state == "open"
            });
        }

        // ──────────────────────────────────────────
        // 4. DESCONECTAR / ELIMINAR INSTANCIA
        //    DELETE /api/WhatsApp/{negocioId}
        // ──────────────────────────────────────────
        [HttpDelete("{negocioId}")]
        public async Task<IActionResult> EliminarInstancia(int negocioId)
        {
            var negocio = await _context.Negocios.FindAsync(negocioId);
            if (negocio == null || string.IsNullOrEmpty(negocio.InstanciaWhatsApp))
                return NotFound(new { error = "No hay instancia configurada para este negocio." });

            var client = _httpFactory.CreateClient();
            var req = new HttpRequestMessage(HttpMethod.Delete,
                $"{_baseUrl}/instance/delete/{negocio.InstanciaWhatsApp}");
            req.Headers.Add("apikey", _apiKey);
            await client.SendAsync(req);

            negocio.InstanciaWhatsApp = null;
            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "Instancia de WhatsApp desconectada y eliminada." });
        }

        // ──────────────────────────────────────────
        // 5. RECEPCIÓN DE MENSAJES (WEBHOOK)
        //    POST /api/WhatsApp/recepcion
        // ──────────────────────────────────────────
        [HttpPost("recepcion")]
        [AllowAnonymous]
        public IActionResult WebhookRecepcion([FromBody] JsonElement rawPayload)
        {
            try
            {
                // Extraemos el evento genéricamente sin forzar tipado para evitar el HTTP 400
                string ev = rawPayload.TryGetProperty("event", out var evProp) ? evProp.GetString() ?? "" : "";
                
                // Si no es un upsert, no nos interesa para la IA. Evitamos casteos propensos a errores.
                if (ev != "messages.upsert")
                    return Ok(new { success = true });

                // Ahora sí, convertimos de manera segura
                var payload = JsonSerializer.Deserialize<EvolutionWebhookPayload>(rawPayload.GetRawText());
                if (payload == null) return Ok();

                if (payload.Data?.Key?.FromMe == false)
            {
                var texto = payload.Data?.Message?.Conversation;
                if (!string.IsNullOrEmpty(texto))
                {
                    Console.WriteLine($"[WhatsApp IA] Mensaje de {payload.Data?.Key?.RemoteJid} en {payload.Instance}: {texto}");
                    
                    var instancia = payload.Instance;
                    var numeroCliente = (payload.Data?.Key?.RemoteJid ?? "").Split('@')[0];

                    // Procesar la IA de manera asíncrona para liberar inmediatamente el Webhook y no dar Timeout
                    Task.Run(async () =>
                    {
                        try
                        {
                            using var scope = _scopeFactory.CreateScope();
                            var dbContext = scope.ServiceProvider.GetRequiredService<SaaSContext>();
                            var aiService = scope.ServiceProvider.GetRequiredService<IAIService>();

                            var negocio = await dbContext.Negocios.FirstOrDefaultAsync(n => n.InstanciaWhatsApp == instancia);
                            if (negocio != null)
                            {
                                await aiService.ProcesarMensajeEntranteAsync(texto, negocio, numeroCliente, instancia);
                            }
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"[WhatsApp IA] Error al procesar IA: {ex.Message}");
                        }
                    });
                }
            }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[WhatsApp Webhook] Parse Error: {ex.Message}");
            }

            return Ok(new { success = true });
        }
    }
}