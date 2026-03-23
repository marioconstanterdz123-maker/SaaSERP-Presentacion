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
        // Helper: enviar recordatorio preventivo de cita (Worker)
        // ───────────────────────────────────────────────
        public async Task<bool> EnviarRecordatorioCitaAsync(
            string instanceName,
            string telefonoCliente,
            string nombreCliente,
            string nombreNegocio,
            DateTime fechaHoraInicio)
        {
            var msg = $"""
                🔔 *{nombreNegocio}* — Recordatorio de Cita

                ¡Hola *{nombreCliente}*! Te recordamos que tu cita está por comenzar a las *{fechaHoraInicio:h:mm tt}*.

                Por favor, intenta llegar unos minutos antes para brindarte el mejor servicio.
                ¡Te esperamos pronto! ⏰
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

        // ───────────────────────────────────────────────
        // OWNER ROUTING — RESTAURANTE
        // Sin Web: ticket inmediato. Con Web: resumen del turno.
        // ───────────────────────────────────────────────
        public async Task NotificarOwnerComandaAsync(
            string instanceName,
            string telefonoDueno,
            bool accesoWebActivo,
            int comandaId,
            string nombreCliente,
            string tipoAtencion,
            decimal total,
            string detalles,
            // Para modo resumen:
            int totalComandas = 0,
            decimal ventasDia = 0)
        {
            string msg;
            if (!accesoWebActivo)
            {
                // Modalidad 100% WhatsApp: cada ticket al instante
                msg = $"""
                    🛒 *Nuevo Pedido #{comandaId}* — {DateTime.Now:HH:mm}

                    Cliente: *{nombreCliente}*
                    Tipo: {tipoAtencion}

                    {detalles}

                    💰 *Total: ${total:F2} MXN*
                    """;
            }
            else
            {
                // Tiene panel Web: resumen ejecutivo del día
                msg = $"""
                    📊 *Resumen del Día* — {DateTime.Now:dd/MM/yyyy}

                    Comandas generadas: *{totalComandas}*
                    Ventas acumuladas: *${ventasDia:F2} MXN*

                    Consulta el detalle completo en tu panel web 💻
                    """;
            }
            await SendTextAsync(instanceName, telefonoDueno, msg);
        }

        // ───────────────────────────────────────────────
        // OWNER ROUTING — CITAS
        // Sin Web: cita registrada al instante. Con Web: resumen del día.
        // ───────────────────────────────────────────────
        public async Task NotificarOwnerCitaAsync(
            string instanceName,
            string telefonoDueno,
            bool accesoWebActivo,
            string nombreCliente,
            DateTime fechaHoraInicio,
            string servicioNombre,
            // Para modo resumen:
            int totalCitasHoy = 0)
        {
            string msg;
            if (!accesoWebActivo)
            {
                msg = $"""
                    📅 *Nueva Cita Registrada*

                    Cliente: *{nombreCliente}*
                    Servicio: {servicioNombre}
                    Horario: *{fechaHoraInicio:dddd dd/MM HH:mm}*

                    Revisa tu agenda cuando puedas. 💇
                    """;
            }
            else
            {
                msg = $"""
                    📊 *Agenda del Día — {DateTime.Now:dd/MM/yyyy}*

                    Total de citas programadas hoy: *{totalCitasHoy}*

                    Revisa los detalles en tu panel web 💻
                    """;
            }
            await SendTextAsync(instanceName, telefonoDueno, msg);
        }

        // ───────────────────────────────────────────────
        // OWNER ROUTING — PARQUEADERO
        // Sin Web: cada entrada/salida al instante. Con Web: resumen al cierre del día.
        // ───────────────────────────────────────────────
        public async Task NotificarOwnerParqueaderoAsync(
            string instanceName,
            string telefonoDueno,
            bool accesoWebActivo,
            string placa,
            string evento,         // "Entrada" o "Salida"
            decimal montoSalida = 0,
            // Para modo resumen:
            int totalVehiculos = 0,
            decimal ingresosDia = 0)
        {
            string msg;
            if (!accesoWebActivo)
            {
                msg = evento == "Salida"
                    ? $"🚗 *Vehículo Salió* — Placa: *{placa}*\n💰 Cobro: *${montoSalida:F2} MXN*"
                    : $"🚗 *Vehículo Entró* — Placa: *{placa}*\n⏰ {DateTime.Now:HH:mm}";
            }
            else
            {
                msg = $"""
                    🅿️ *Resumen Parqueadero — {DateTime.Now:dd/MM/yyyy}*

                    Vehículos atendidos: *{totalVehiculos}*
                    Ingresos totales: *${ingresosDia:F2} MXN*

                    Consulta el detalle en tu panel web 💻
                    """;
            }
            await SendTextAsync(instanceName, telefonoDueno, msg);
        }
    }
}
