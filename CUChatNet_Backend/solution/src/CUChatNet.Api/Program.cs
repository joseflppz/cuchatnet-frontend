using CUChatNet.Api;
using CUChatNet.Api.Data; // Asegúrate de crear la carpeta Hubs
using CUChatNet.Api.Services;
using CUChatNet.Api.Servicios;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddScoped<ICorreoRecuperacionAdminServicio, CorreoRecuperacionAdminServicio>();
builder.Services.AddScoped<IContactosServicio, ContactosServicio>();    

// 1. AGREGAR SIGNALR PARA CHAT EN VIVO
builder.Services.AddSignalR();


builder.Services.AddSingleton<EncryptionService>();

builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "CUChatNet API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Ingresa el token JWT"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

if (string.IsNullOrEmpty(connectionString) || connectionString.Contains("SQLEXPRESS") || connectionString.Contains("LocalDB"))
{
    Console.WriteLine("⚠️ Redirigiendo conexión a Base de Datos en PLESK (CUC)...");
    connectionString = "Server=tcp:tiusr25pl.cuc-carrera-ti.ac.cr,1433;Initial Catalog=tiusr25pl_CUChatNetDB;User ID=CUChatNetDB;Password=CUChatNetDB;Encrypt=True;TrustServerCertificate=True;Connect Timeout=60;MultipleActiveResultSets=True;";
}

builder.Services.AddDbContext<CUChatNetDbContext>(options =>
    options.UseSqlServer(connectionString, sqlOptions =>
    {
        sqlOptions.EnableRetryOnFailure(
            maxRetryCount: 10,
            maxRetryDelay: TimeSpan.FromSeconds(5),
            errorNumbersToAdd: null);
    })
);

// 2. CONFIGURAR CORS PARA SIGNALR (Permitir credenciales y Next.js)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:3000") // URL de tu frontend
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials(); // Obligatorio para que no falle la negociación
    });
});

var jwtKey = builder.Configuration["Jwt:Key"] ?? "ClaveSuperSecretaDePrueba1234567890";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "CUChatNet";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "CUChatNetUsers";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy =>
        policy.RequireClaim("http://schemas.microsoft.com/ws/2008/06/identity/claims/role", "admin"));
});

var app = builder.Build();

// 3. ARCHIVOS ESTÁTICOS (Para ver fotos, videos y documentos)
app.UseStaticFiles(); // Carpeta wwwroot
// Si usas una carpeta externa llamada "Uploads":
var uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "Uploads");
if (!Directory.Exists(uploadsPath)) Directory.CreateDirectory(uploadsPath);

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(uploadsPath),
    RequestPath = "/uploads"
});

app.UseSwagger();
app.UseSwaggerUI(c => {
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "CUChatNet API v1");
    c.RoutePrefix = "swagger";
});

app.UseHttpsRedirection();
app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// 4. MAPEAR EL HUB DE SIGNALR
app.MapHub<ChatHub>("/chathub");

app.Run();