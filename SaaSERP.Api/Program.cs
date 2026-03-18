using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SaaSERP.Api.Data;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// 1. AGREGAR SERVICIOS
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// 2. SWAGGER LIMPIO (Sin el candado visual que causa el error)
builder.Services.AddSwaggerGen();

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

// PIPELINE HTTP
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// EL ORDEN ES VITAL
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();