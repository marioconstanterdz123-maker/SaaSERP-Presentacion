using System;
using System.Text.Json.Serialization;

namespace SaaSERP.Api.Models // Cambia esto por el namespace real de tu proyecto
{
    public class EvolutionWebhookPayload
    {
        [JsonPropertyName("event")]
        public string Event { get; set; }

        [JsonPropertyName("instance")]
        public string Instance { get; set; }

        [JsonPropertyName("data")]
        public WebhookData Data { get; set; }

        [JsonPropertyName("destination")]
        public string Destination { get; set; }

        [JsonPropertyName("date_time")]
        public DateTime DateTime { get; set; }

        [JsonPropertyName("sender")]
        public string Sender { get; set; }

        [JsonPropertyName("server_url")]
        public string ServerUrl { get; set; }

        [JsonPropertyName("apikey")]
        public string ApiKey { get; set; }
    }

    public class WebhookData
    {
        [JsonPropertyName("key")]
        public MessageKey Key { get; set; }

        [JsonPropertyName("pushName")]
        public string PushName { get; set; }

        [JsonPropertyName("message")]
        public MessageContent Message { get; set; }

        [JsonPropertyName("messageType")]
        public string MessageType { get; set; }

        [JsonPropertyName("source")]
        public string Source { get; set; }
    }

    public class MessageKey
    {
        [JsonPropertyName("remoteJid")]
        public string RemoteJid { get; set; }

        [JsonPropertyName("fromMe")]
        public bool FromMe { get; set; }

        [JsonPropertyName("id")]
        public string Id { get; set; }
    }

    public class MessageContent
    {
        // Aquí viene el texto plano que escribe el usuario (ej. "Holu")
        [JsonPropertyName("conversation")]
        public string Conversation { get; set; }
    }
}