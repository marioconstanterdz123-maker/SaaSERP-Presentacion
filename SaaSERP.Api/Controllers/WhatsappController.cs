using Microsoft.AspNetCore.Mvc;
using SaaSERP.Api.Models;
using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace SaaSERP.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class WhatsappController : ControllerBase
    {
        [HttpPost("recepcion")]
        public async Task<IActionResult> RecibirMensaje([FromBody] JsonElement payload)
        {
            try
            {
                var data = payload.GetProperty("data");
                var key = data.GetProperty("key");

                if (key.GetProperty("fromMe").GetBoolean()) return Ok();

                // 1. Prioridad al número real (remoteJidAlt) que vimos en tus logs
                string jidFinal = "";
                if (key.TryGetProperty("remoteJidAlt", out var altJid))
                {
                    jidFinal = altJid.GetString();
                }
                else
                {
                    jidFinal = key.GetProperty("remoteJid").GetString();
                }

                string nombreCliente = data.TryGetProperty("pushName", out var name) ? name.GetString() : "Cliente";
                string textoRecibido = data.GetProperty("message").TryGetProperty("conversation", out var conv)
                                       ? conv.GetString() : "";

                // 2. Limpieza de número para México
                string numeroLimpio = jidFinal.Replace("@s.whatsapp.net", "").Replace("@lid", "");
                if (numeroLimpio.StartsWith("521") && numeroLimpio.Length == 13)
                {
                    numeroLimpio = "52" + numeroLimpio.Substring(3);
                }

                // 3. RESPUESTA CON FORMATO V2 (La clave del éxito)
                var bodyDict = new
                {
                    number = numeroLimpio,
                    text = $"¡Hola {nombreCliente}! 💈 Recibí tu '{textoRecibido}'. Ya estamos en la v2.3.7."
                };

                using (var httpClient = new HttpClient())
                {
                    httpClient.DefaultRequestHeaders.Add("apikey", "MiLlaveSaaS2026");
                    var content = new StringContent(JsonSerializer.Serialize(bodyDict), Encoding.UTF8, "application/json");

                    // Enviamos el POST
                    var response = await httpClient.PostAsync("http://127.0.0.1:8080/message/sendText/Barberia_2026", content);

                    if (!response.IsSuccessStatusCode)
                    {
                        var errorDetails = await response.Content.ReadAsStringAsync();
                        Console.WriteLine($"Error de Evolution: {errorDetails}");
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error en C#: {ex.Message}");
            }

            return Ok();
        }
    }
}