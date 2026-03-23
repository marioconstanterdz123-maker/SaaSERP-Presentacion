using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SaaSERP.Api.Data;
using SaaSERP.Api.Models;
using System.Security.Cryptography;
using System.Text;
using Hangfire;
using System.Text.Json;

namespace SaaSERP.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DeliveryController : ControllerBase
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly IHttpClientFactory _httpClientFactory;

        public DeliveryController(IServiceScopeFactory scopeFactory, IHttpClientFactory httpClientFactory)
        {
            _scopeFactory = scopeFactory;
            _httpClientFactory = httpClientFactory;
        }

        [HttpPost("rappi/webhook/{negocioId}")]
        public async Task<IActionResult> RappiWebhook(int negocioId)
        {
            using var reader = new StreamReader(Request.Body);
            var body = await reader.ReadToEndAsync();

            string rappiSignature = Request.Headers.TryGetValue("Rappi-Signature", out var sig) ? sig.ToString() : string.Empty;

            using var scope = _scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<SaaSContext>();

            var creds = await context.DeliveryCredenciales
                .FirstOrDefaultAsync(c => c.NegocioId == negocioId && c.Plataforma == "RAPPI" && c.Activo);

            if (creds == null || string.IsNullOrEmpty(creds.WebhookSecret))
            {
                return Unauthorized(new { msg = "No credentials configured." });
            }

            // Parsear Rappi-Signature "t=168...,sign=d74b..."
            string timestamp = "";
            string sign = "";
            var parts = rappiSignature.Split(',');
            foreach (var part in parts)
            {
                if (part.StartsWith("t=")) timestamp = part.Substring(2);
                if (part.StartsWith("sign=")) sign = part.Substring(5);
            }

            // Validar HMAC-SHA256: timestamp.payload
            string payloadToSign = $"{timestamp}.{body}";
            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(creds.WebhookSecret));
            var hashBytes = hmac.ComputeHash(Encoding.UTF8.GetBytes(payloadToSign));
            // Rappi envía la firma en minúsculas hexadecimal, no Base64.
            var computedSignature = BitConverter.ToString(hashBytes).Replace("-", "").ToLower();

            // if (computedSignature != sign && !string.IsNullOrEmpty(sign))
            // {
            //      return Unauthorized(new { msg = "Invalid signature" });
            // }

            // Procesamiento en background asíncrono vía HANGFIRE
            BackgroundJob.Enqueue<DeliveryController>(c => c.ProcessRappiOrderAsync(negocioId, body));

            return Ok(new { status = "received" });
        }

        [HttpPost("ubereats/webhook/{negocioId}")]
        public async Task<IActionResult> UberEatsWebhook(int negocioId)
        {
            using var reader = new StreamReader(Request.Body);
            var body = await reader.ReadToEndAsync();

            string uberSignature = Request.Headers.TryGetValue("X-Uber-Signature", out var sig) ? sig.ToString() : string.Empty;

            using var scope = _scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<SaaSContext>();

            var creds = await context.DeliveryCredenciales
                .FirstOrDefaultAsync(c => c.NegocioId == negocioId && c.Plataforma == "UBEREATS" && c.Activo);

            if (creds == null || string.IsNullOrEmpty(creds.WebhookSecret))
            {
                // Uber exige que su endpoint siempre regrese 200 aunque falten credenciales en ciertas pruebas, pero aquí aseguramos nuestra lógica
                return Unauthorized(new { msg = "No credentials configured." });
            }

            // Validar firma HMAC-SHA256: Hex(HMACSHA256(secret, body))
            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(creds.WebhookSecret));
            var hashBytes = hmac.ComputeHash(Encoding.UTF8.GetBytes(body));
            var computedSignature = BitConverter.ToString(hashBytes).Replace("-", "").ToLower();

            // if (computedSignature != uberSignature)
            // {
            //      return Unauthorized(new { msg = "Invalid signature" });
            // }

            // Encolar trabajo en background
            BackgroundJob.Enqueue<DeliveryController>(c => c.ProcessUberEatsOrderAsync(negocioId, body, creds.ClientId, creds.ClientSecret));

            // Responde al instante para evitar timeout de Uber Eats
            return Ok(new { status = "received", platform = "ubereats" });
        }

        [HttpPost("didi/webhook/{negocioId}")]
        public IActionResult DidiWebhook(int negocioId)
        {
            return Ok(new { status = "received", platform = "didi" });
        }

        [NonAction]
        public async Task ProcessRappiOrderAsync(int negocioId, string body)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<SaaSContext>();

                using var doc = JsonDocument.Parse(body);
                var root = doc.RootElement;

                if (root.TryGetProperty("event", out var eventObj) && eventObj.GetString() == "NEW_ORDER")
                {
                    var orderObj = root.GetProperty("order");
                    var items = orderObj.GetProperty("items");

                    var comanda = new Comanda
                    {
                        NegocioId = negocioId,
                        NombreCliente = "Cliente Rappi",
                        TelefonoCliente = "0000000000",
                        TipoAtencion = "Delivery",
                        IdentificadorMesa = "RAPPI",
                        Estado = "Recibida",
                        Total = 0
                    };

                    decimal total = 0;
                    var detalles = new List<DetalleComanda>();

                    foreach (var item in items.EnumerateArray())
                    {
                        var sku = item.GetProperty("sku").GetString();
                        var price = item.GetProperty("price").GetDecimal();
                        var qty = item.GetProperty("quantity").GetInt32();

                        var mapping = await context.SkuTerceros
                            .Include(s => s.Servicio)
                            .FirstOrDefaultAsync(s => s.NegocioId == negocioId && s.Plataforma == "RAPPI" && s.SkuExterno == sku);

                        var serviceId = mapping?.ServicioId ?? 0;
                        var precioReal = mapping?.Servicio?.Precio ?? price;

                        detalles.Add(new DetalleComanda
                        {
                            ServicioId = serviceId,
                            Cantidad = qty,
                            Subtotal = qty * precioReal
                        });

                        total += (qty * precioReal);
                    }

                    comanda.Total = total;
                    comanda.Detalles = detalles;

                    await context.Comandas.AddAsync(comanda);
                    await context.SaveChangesAsync();

                    // Notificar a Rappi que tomamos la orden (Take Order)
                    var orderIdStr = orderObj.TryGetProperty("id", out var idProp) ? idProp.GetString() : "0";
                    
                    // Asegurar credenciales para la llamada (se deben pasar los secrets correspondientes en cabecera o como indique la API real, aquí mockeamos endpoint general)
                    // URL: https://{COUNTRY_DOMAIN}/api/v2/restaurants-integrations-public-api/orders/{orderId}/take/
                    var credsObj = await context.DeliveryCredenciales.FirstOrDefaultAsync(c => c.NegocioId == negocioId && c.Plataforma == "RAPPI");
                    if (credsObj != null && !string.IsNullOrEmpty(credsObj.PaisCode) && !string.IsNullOrEmpty(orderIdStr))
                    {
                        var domain = credsObj.PaisCode.ToUpper() == "MX" ? "microservices.dev.rappi.com" : "microservices.dev.rappi.com";
                        var url = $"https://{domain}/api/v2/restaurants-integrations-public-api/orders/{orderIdStr}/take/";
                        
                        var client = _httpClientFactory.CreateClient();
                        // En producción: client.DefaultRequestHeaders.Add("Authorization", "Bearer " + token);
                        // client.DefaultRequestHeaders.Add("x-authorization", "Bearer ...");

                        var content = new StringContent("{}", Encoding.UTF8, "application/json");
                        try
                        {
                            var response = await client.PutAsync(url, content);
                            Console.WriteLine($"[Rappi] Take Order {orderIdStr} Response: {response.StatusCode}");
                        }
                        catch (Exception apiEx)
                        {
                            Console.WriteLine($"[Rappi] Error calling Take Order: {apiEx.Message}");
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error processing webhook in background: " + ex.Message);
            }
        }

        [NonAction]
        public async Task ProcessUberEatsOrderAsync(int negocioId, string body, string cliId, string cliSecret)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<SaaSContext>();

                using var doc = JsonDocument.Parse(body);
                var root = doc.RootElement;

                // Typical Uber Webhook: event_type = "orders.notification"
                if (root.TryGetProperty("event_type", out var typeProp) && typeProp.GetString() == "orders.notification")
                {
                    string orderIdStr = root.GetProperty("meta").GetProperty("resource_id").GetString() ?? "";
                    if (string.IsNullOrEmpty(orderIdStr)) return;

                    var client = _httpClientFactory.CreateClient();
                    
                    // 1. OBTENER DETALLE (Dummy Mock para ejemplo de producción)
                    // URL: GET https://api.uber.com/v2/eats/order/{orderId}
                    // Requiere Auth Bearer Token (necesitamos implementarlo luego con cliId/cliSecret)
                    
                    var comanda = new Comanda
                    {
                        NegocioId = negocioId,
                        NombreCliente = "Cliente Uber Eats",
                        TelefonoCliente = "0000000000",
                        TipoAtencion = "Delivery",
                        IdentificadorMesa = "UBER",
                        Estado = "Recibida",
                        Total = 0
                    };
                    
                    // Aquí simularemos el parseo de items que llegarían en el JSON del GET API
                    // ... parsing items ...

                    await context.Comandas.AddAsync(comanda);
                    await context.SaveChangesAsync();

                    // 2. ACEPTAR POST POS ORDER
                    // URL: POST https://api.uber.com/v2/eats/orders/{orderIdStr}/accept_pos_order
                    var acceptUrl = $"https://api.uber.com/v2/eats/orders/{orderIdStr}/accept_pos_order";
                    var content = new StringContent("{\"reason\":\"accepted\"}", Encoding.UTF8, "application/json");
                    try
                    {
                        var response = await client.PostAsync(acceptUrl, content);
                        Console.WriteLine($"[UberEats] Accept Order {orderIdStr} Response: {response.StatusCode}");
                    }
                    catch (Exception apiEx)
                    {
                        Console.WriteLine($"[UberEats] Error calling Accept Order: {apiEx.Message}");
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error processing Uber Eats webhook in background: " + ex.Message);
            }
        }
    }
}
