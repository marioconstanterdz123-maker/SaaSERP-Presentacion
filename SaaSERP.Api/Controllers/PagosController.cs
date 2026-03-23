using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SaaSERP.Api.Data;
using SaaSERP.Api.Models;
using MercadoPago.Client.Preference;
using MercadoPago.Config;
using MercadoPago.Resource.Preference;
using System.Text.Json;
using System.Security.Claims;

namespace SaaSERP.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PagosController : ControllerBase
    {
        private readonly SaaSContext _context;

        public PagosController(SaaSContext context)
        {
            _context = context;
        }

        // ==========================================
        // 1. CREAR UNA PREFERENCIA DE PAGO (Checkout Pro)
        // ==========================================
        [Authorize]
        [HttpPost("crear-preferencia")]
        public async Task<IActionResult> CrearPreferencia([FromBody] PagoRequestDto request)
        {
            var userNegocioIdStr = User.Claims.FirstOrDefault(c => c.Type == "NegocioId")?.Value;
            if (string.IsNullOrEmpty(userNegocioIdStr) || !int.TryParse(userNegocioIdStr, out var userNegocioId))
                return Unauthorized(new { error = "Negocio no identificado." });

            var negocio = await _context.Negocios.FindAsync(userNegocioId);
            if (negocio == null || string.IsNullOrEmpty(negocio.MercadoPagoAccessToken))
                return BadRequest(new { error = "El negocio no tiene configurado MercadoPago." });

            try
            {
                // Setear token para esta solicitud
                MercadoPagoConfig.AccessToken = negocio.MercadoPagoAccessToken;

                var client = new PreferenceClient();
                
                // NOTA: Request.Scheme y Request.Host nos dará la URL de backend. 
                // Lo ideal para Back URLs es que redija al FRONTEND de la aplicación Capacitor / Web.
                // Como Capacitor usa http://localhost (en Android), usaremos una URL del backend que a su vez haga redirect profundo (deeplink) 
                // o simplemente usar webhooks para validar.
                var domain = $"{Request.Scheme}://{Request.Host}";

                var prefRequest = new PreferenceRequest
                {
                    Items = new List<PreferenceItemRequest>
                    {
                        new PreferenceItemRequest
                        {
                            Title = request.Titulo,
                            Quantity = 1,
                            CurrencyId = "MXN", // o el que aplique
                            UnitPrice = request.Monto,
                        }
                    },
                    ExternalReference = request.Referencia,
                    // TODO: Cambiar por la URL real de tu backend cuando esté publicado
                    NotificationUrl = $"{domain}/api/pagos/webhook", 
                    BackUrls = new PreferenceBackUrlsRequest
                    {
                        Success = $"{domain}/api/pagos/success",
                        Failure = $"{domain}/api/pagos/failure",
                        Pending = $"{domain}/api/pagos/pending"
                    },
                    AutoReturn = "approved"
                };

                var preference = await client.CreateAsync(prefRequest);

                return Ok(new
                {
                    id = preference.Id,
                    initPoint = preference.InitPoint, // URL para redirigir al checkout
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Error al crear la preferencia en MercadoPago.", detalle = ex.Message });
            }
        }

        // ==========================================
        // 2. RECIBIR WEBHOOKS DE MERCADOPAGO (IPN)
        // ==========================================
        [HttpPost("webhook")]
        public async Task<IActionResult> Webhook()
        {
            try
            {
                using var reader = new StreamReader(Request.Body);
                var body = await reader.ReadToEndAsync();
                
                // Parse the query string to get action and data.id
                var action = Request.Query["action"].ToString();
                var dataId = Request.Query["data.id"].ToString();
                var type = Request.Query["type"].ToString();

                // Check if it's a payment notification
                if (type == "payment" || action == "payment.created")
                {
                    Console.WriteLine($"Webhook recibido. Pago ID: {dataId}");

                    // Aquí necesitaríamos buscar en qué negocio cayó este pago (difícil sin token, a menos que guardemos la RefExterna en BD antes).
                    // Para simplificar, MercadoPago envía el external_reference dentro del objeto payment si lo consultamos:
                    // var paymentClient = new PaymentClient();
                    // var payment = await paymentClient.GetAsync(long.Parse(dataId));
                    // var ref = payment.ExternalReference;
                    
                    // Supongamos ref tiene formato: "COMANDA_123" o "TICKET_456"
                    // var parts = ref.Split('_');
                    // if(parts[0] == "COMANDA") {
                    //    var comanda = await _context.Comandas.FindAsync(int.Parse(parts[1]));
                    //    comanda.Estado = "Cobrada";
                    //    await _context.SaveChangesAsync();
                    // }

                    // Como esto depende de las credenciales del negocio, en una arquitectura SaaS real 
                    // se incluye el NegocioId en la notification_url: /api/pagos/webhook/{negocioId}
                    // Implementación futura robusta recomendada.
                }

                return Ok();
            }
            catch(Exception e)
            {
                Console.WriteLine($"Error en Webhook MP: {e.Message}");
                return StatusCode(500);
            }
        }
        
        [HttpGet("success")]
        public IActionResult WebhookSuccess([FromQuery] string payment_id, [FromQuery] string status, [FromQuery] string external_reference)
        {
            // Este endpoint es llamado por el navegador del cliente al terminar el pago con éxito.
            // Para la demo, podemos devolver un HTML simple o redirigir a un deeplink scheme://
            var htmlResponse = @"
            <html>
                <head>
                    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
                    <style>
                        body { font-family: sans-serif; text-align: center; padding: 40px; background-color: #f0fdf4; color: #166534; }
                        .btn { display: inline-block; padding: 12px 24px; background: #16a34a; color: white; text-decoration: none; border-radius: 8px; margin-top: 20px; font-weight: bold;}
                    </style>
                </head>
                <body>
                    <h1>¡Pago Exitoso! ✅</h1>
                    <p>Tu pago ha sido procesado correctamente.</p>
                    <p>Puedes cerrar esta ventana y volver a la app.</p>
                </body>
            </html>
            ";
            return Content(htmlResponse, "text/html");
        }
    }

    public class PagoRequestDto
    {
        public string Titulo { get; set; } = "Pago de Consumo";
        public decimal Monto { get; set; }
        public string Referencia { get; set; } = string.Empty; // Ej. "COMANDA_123"
    }
}
