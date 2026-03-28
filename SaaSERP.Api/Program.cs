using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SaaSERP.Api.Data;
using SaaSERP.Api.Services;
using System.Text;
using Hangfire;

var builder = WebApplication.CreateBuilder(args);

// 1. AGREGAR SERVICIOS
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddScoped<INegocioService, NegocioService>();
builder.Services.AddScoped<ICitaService, CitaService>();
builder.Services.AddScoped<IChatMemoryService, ChatMemoryService>();
builder.Services.AddScoped<IEstadiaService, EstadiaService>();
builder.Services.AddScoped<IComandaService, ComandaService>();
builder.Services.AddScoped<IAdminService, AdminService>();

// IA NATIVA Y WHATSAPP OUTBOUND
builder.Services.AddHttpClient<IEvolutionService, EvolutionService>();
builder.Services.AddHttpClient<IAIService, AIService>();
builder.Services.AddHttpClient<WhatsAppService>(); // Servicio propio de notificaciones WA

// BACKGROUND WORKERS (DEMONIOS)
builder.Services.AddHostedService<RecordatoriosWorker>();
builder.Services.AddHostedService<TimeoutWorkerService>(); // Reactivación automática de chats en silencio

// MÓDULO TATTOO STUDIO
builder.Services.AddScoped<ILoyaltyService, LoyaltyService>();

// HANGFIRE (BACKGROUND JOBS)
builder.Services.AddHangfire(configuration => configuration
    .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
    .UseSimpleAssemblyNameTypeSerializer()
    .UseRecommendedSerializerSettings()
    .UseSqlServerStorage(builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services.AddHangfireServer();

// 2. SWAGGER LIMPIO Y CORS
builder.Services.AddSwaggerGen();
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});


// 3. BASE DE DATOS
builder.Services.AddDbContext<SaaSContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// 4. CONFIGURACIÓN DE SEGURIDAD (JWT)
var jwtKey = builder.Configuration["Jwt:Key"];
var keyBytes = Encoding.UTF8.GetBytes(jwtKey!);

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(keyBytes)
        };
    });

var app = builder.Build();

// Inicializar tablas automáticas (Ej. Memoria del Chat)
using (var scope = app.Services.CreateScope())
{
    var chatMemory = scope.ServiceProvider.GetRequiredService<IChatMemoryService>();
    chatMemory.InicializarTablaAsync().GetAwaiter().GetResult();
}

// PIPELINE HTTP
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    
    // Hangfire Dashboard (Solo Dev por defecto para seguridad)
    app.UseHangfireDashboard();
}

app.UseHttpsRedirection();

// EL ORDEN ES VITAL
// Habilitar CORS ANTES DE LA AUTORIZACIÓN
app.UseCors("AllowReactApp");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();