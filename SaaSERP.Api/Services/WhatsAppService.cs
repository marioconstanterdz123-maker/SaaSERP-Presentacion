using System.Text;
using System.Text.Json;

namespace SaaSERP.Api.Services
{
    /// <summary>
    /// Servicio para enviar mensajes de WhatsApp mediante EvolutionAPI.
    /// La instancia de WhatsApp de cada Negocio debe estar conectada previamente.
    /// </summary>
    public class WhatsAppService
    {
        private readonly HttpClient _http;
        private readonly string _baseUrl;
        private readonly string _apiKey;

        public WhatsAppService(IConfiguration config, HttpClient http)
        {
            _http = http;
            _baseUrl = config["EvolutionApi:BaseUrl"]!.TrimEnd('/');
            _apiKey  = config["EvolutionApi:GlobalApiKey"]!;
        }

        // ───────────────────────────────────────────────
        // Método base: enviar texto a un número dado
        // instanceName = nombre de la instancia en tu servidor de Evolution
        // number       = número destino E.164 sin '+' (ej. 528341234567)
        // ───────────────────────────────────────────────
        public async Task<bool> SendTextAsync(string instanceName, string number, string message)
        {
            try
            {
                var url = $"{_baseUrl}/message/sendText/{instanceName}";
                var payload = new
                {
                    number  = SanitizeNumber(number),
                    text    = message
                };

                var request = new HttpRequestMessage(HttpMethod.Post, url)
                {
                    Content = new StringContent(
                        JsonSerializer.Serialize(payload),
                        Encoding.UTF8,
                        "application/json")
                };
                request.Headers.Add("apikey", _apiKey);

                var response = await _http.SendAsync(request);
                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[WhatsApp] Error al enviar mensaje: {ex.Message}");
                return false;
            }
        }

        // ───────────────────────────────────────────────
        // Helper: confirmar una Cita al cliente
        // ───────────────────────────────────────────────
        public async Task<bool> EnviarConfirmacionCitaAsync(
            string instanceName,
            string telefonoCliente,
            string nombreCliente,
            string nombreNegocio,
            string nombreServicio,
            DateTime fechaHoraInicio)
        {
            var fechaStr = fechaHoraInicio.ToString("dddd dd 'de' MMMM 'a las' h:mm tt",
                           new System.Globalization.CultureInfo("es-MX"));

            var msg = $"""
                ✅ *{nombreNegocio}* — Confirmación de Cita

                Hola *{nombreCliente}*, tu cita ha sido agendada con éxito 🎉

                📋 *Servicio:* {nombreServicio}
                📅 *Fecha:* {fechaStr}

                Si necesitas cancelar o reagendar, responde este mensaje.
                ¡Te esperamos! 💼
                """;

            return await SendTextAsync(instanceName, telefonoCliente, msg);
        }

        // ───────────────────────────────────────────────
        // Helper: enviar recibo al salir del parqueadero
        // ───────────────────────────────────────────────
        public async Task<bool> EnviarReciboParkingAsync(
            string instanceName,
            string telefonoCliente,
            string placa,
            string nombreEstacionamiento,
            DateTime horaEntrada,
            DateTime horaSalida,
            decimal monto)
        {
            var duracion = horaSalida - horaEntrada;
            var msg = $"""
                🅿️ *{nombreEstacionamiento}* — Recibo de Parqueo

                Placa:       *{placa}*
                Entrada:     {horaEntrada:HH:mm}
                Salida:      {horaSalida:HH:mm}
                Tiempo:      {(int)duracion.TotalHours}h {duracion.Minutes}m
                💰 *Total cobrado: ${monto:F2} MXN*

                ¡Gracias por usar nuestro estacionamiento! 🚗
                """;

            return await SendTextAsync(instanceName, telefonoCliente, msg);
        }

        // ───────────────────────────────────────────────
        // Helper: limpiar el número de teléfono
        // ───────────────────────────────────────────────
        private static string SanitizeNumber(string raw)
        {
            var digits = new string(raw.Where(char.IsDigit).ToArray());
            // Si no tiene código de país México, añadirlo
            if (digits.Length == 10) digits = "52" + digits;
            return digits;
        }
    }
}
