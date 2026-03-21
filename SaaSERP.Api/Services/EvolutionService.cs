using Microsoft.Extensions.Configuration;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace SaaSERP.Api.Services
{
    public class EvolutionService : IEvolutionService
    {
        private readonly HttpClient _httpClient;
        private readonly string _baseUrl;
        private readonly string _globalApiKey;

        public EvolutionService(HttpClient httpClient, IConfiguration config)
        {
            _httpClient = httpClient;
            _baseUrl = config["EvolutionApi:BaseUrl"] ?? "http://localhost:8080";
            _globalApiKey = config["EvolutionApi:GlobalApiKey"] ?? "";

            if (!string.IsNullOrEmpty(_globalApiKey))
            {
                _httpClient.DefaultRequestHeaders.Add("apikey", _globalApiKey);
            }
        }

        public async Task EnviarMensajeTextoAsync(string instancia, string numeroDestino, string texto)
        {
            var payload = new
            {
                number = numeroDestino,
                text = texto
            };

            var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync($"{_baseUrl}/message/sendText/{instancia}", content);
            
            // Si falla, lanza excepción que será atrapada en el log
            response.EnsureSuccessStatusCode(); 
        }
    }
}
