using CUChatNet.Api.Data;
using CUChatNet.Api.Dtos;
using CUChatNet.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;

namespace CUChatNet.Api.Controllers;

[ApiController]
[Route("api")]
public class ChatsController : ControllerBase
{
    private readonly CUChatNetDbContext _db;
    private readonly IHubContext<ChatHub> _hubContext; // 🔥 Para tiempo real

    public ChatsController(CUChatNetDbContext db, IHubContext<ChatHub> hubContext)
    {
        _db = db;
        _hubContext = hubContext;
    }

    // ===============================
    // 🔹 OBTENER CHATS DEL USUARIO
    // ===============================
    [HttpGet("users/{userId:long}/chats")]
    public async Task<ActionResult<IEnumerable<ChatListItemDto>>> GetChats(long userId)
    {
        var memberships = await _db.ChatParticipantes
            .Where(cp => cp.UsuarioId == userId && cp.Activo)
            .Include(cp => cp.Chat)
            .ThenInclude(c => c.Participantes)
            .ThenInclude(p => p.Usuario)
            .ToListAsync();

        var chatIds = memberships.Select(m => m.ChatId).ToList();

        var lastMessages = await _db.Mensajes
            .Where(m => chatIds.Contains(m.ChatId))
            .GroupBy(m => m.ChatId)
            .Select(g => g.OrderByDescending(m => m.FechaEnvio).FirstOrDefault())
            .ToListAsync();

        var lastMessageMap = lastMessages
            .Where(m => m is not null)
            .ToDictionary(m => m!.ChatId, m => m);

        var result = memberships
            .Select(cp =>
            {
                var chat = cp.Chat;
                lastMessageMap.TryGetValue(chat.ChatId, out var lastMessage);

                if (chat.TipoChat == "group")
                {
                    return new ChatListItemDto(
                        chat.ChatId,
                        chat.ChatId,
                        chat.Nombre ?? "Grupo",
                        chat.FotoUrl,
                        chat.Descripcion,
                        null,
                        lastMessage?.Contenido ?? "Grupo creado recientemente",
                        lastMessage?.FechaEnvio ?? chat.FechaCreacion,
                        0,
                        cp.Fijado,
                        cp.Archivado,
                        true,
                        cp.Silenciado
                    );
                }

                var otherParticipant = chat.Participantes.FirstOrDefault(p => p.UsuarioId != userId)?.Usuario;

                return new ChatListItemDto(
                    chat.ChatId,
                    otherParticipant?.UsuarioId ?? 0,
                    otherParticipant?.Nombre ?? "Chat",
                    otherParticipant?.FotoUrl,
                    otherParticipant?.Descripcion,
                    otherParticipant?.EstadoPerfil,
                    lastMessage?.Contenido ?? "Sin mensajes aún",
                    lastMessage?.FechaEnvio ?? chat.FechaCreacion,
                    0,
                    cp.Fijado,
                    cp.Archivado,
                    false,
                    cp.Silenciado
                );
            })
            .OrderByDescending(x => x.LastMessageTime)
            .ToList();

        return Ok(result);
    }

    // ===============================
    // 🔹 CREAR CHAT DIRECTO
    // ===============================
    [HttpPost("chats/direct")]
    public async Task<IActionResult> CreateDirect([FromBody] CreateDirectChatRequest request)
    {
        if (request.CurrentUserId == request.ContactUserId)
            return BadRequest(new { error = "No puedes crear un chat contigo mismo." });

        var currentUserChatIds = await _db.ChatParticipantes
            .Where(x => x.UsuarioId == request.CurrentUserId && x.Activo)
            .Select(x => x.ChatId)
            .ToListAsync();

        var existing = await _db.Chats
            .Where(c => c.TipoChat == "individual" && currentUserChatIds.Contains(c.ChatId))
            .Include(c => c.Participantes)
            .FirstOrDefaultAsync(c => c.Participantes.Count == 2
                                   && c.Participantes.Any(p => p.UsuarioId == request.CurrentUserId)
                                   && c.Participantes.Any(p => p.UsuarioId == request.ContactUserId));

        if (existing is not null)
            return Ok(new { chatId = existing.ChatId, message = "El chat ya existía." });

        var chat = new Chat
        {
            TipoChat = "individual",
            CodigoConversacion = $"DIR-{Guid.NewGuid().ToString().Substring(0, 8)}",
            FechaCreacion = DateTime.UtcNow,
            Activo = true
        };

        _db.Chats.Add(chat);
        await _db.SaveChangesAsync();

        _db.ChatParticipantes.AddRange(
            new ChatParticipante { ChatId = chat.ChatId, UsuarioId = request.CurrentUserId, Rol = "member", Activo = true, FechaUnion = DateTime.UtcNow },
            new ChatParticipante { ChatId = chat.ChatId, UsuarioId = request.ContactUserId, Rol = "member", Activo = true, FechaUnion = DateTime.UtcNow }
        );

        await _db.SaveChangesAsync();
        return Ok(new { chatId = chat.ChatId, message = "Chat directo creado." });
    }

    // ===============================
    // 🔹 CREAR GRUPO (CORREGIDO)
    [HttpPost("chats/group")]
    public async Task<IActionResult> CreateGroup([FromBody] CreateGroupChatRequest request)
    {
        // 1. Validaciones básicas
        if (request == null) return BadRequest(new { error = "Datos no recibidos." });
        if (string.IsNullOrWhiteSpace(request.GroupName))
            return BadRequest(new { error = "El nombre del grupo es obligatorio." });

        // 2. Forzar que el ID sea válido (si llega 0 es que el mapeo falló)
        if (request.CurrentUserId <= 0)
            return BadRequest(new { error = "Error: El ID del usuario creador es 0 o inválido." });

        try
        {
            // 3. Crear la entidad Chat
            var chat = new Chat
            {
                TipoChat = "group",
                CodigoConversacion = $"GRP-{Guid.NewGuid().ToString().Substring(0, 8)}",
                Nombre = request.GroupName.Trim(),
                FotoUrl = request.GroupPhoto ?? "",
                Descripcion = request.GroupDescription ?? "",
                CreadoPorUsuarioId = request.CurrentUserId,
                FechaCreacion = DateTime.UtcNow,
                Activo = true
            };

            _db.Chats.Add(chat);
            await _db.SaveChangesAsync(); // Guardamos para obtener el ChatId

            // 4. Gestionar participantes
            var participantesToAdd = new List<ChatParticipante>();

            // Asegurar que el creador esté incluido
            var todosLosMiembros = request.MemberIds ?? new List<long>();
            if (!todosLosMiembros.Contains(request.CurrentUserId))
            {
                todosLosMiembros.Add(request.CurrentUserId);
            }

            foreach (var memberId in todosLosMiembros)
            {
                // Solo agregamos si el usuario existe para evitar errores de FK
                var existe = await _db.Usuarios.AnyAsync(u => u.UsuarioId == memberId);
                if (existe)
                {
                    participantesToAdd.Add(new ChatParticipante
                    {
                        ChatId = chat.ChatId,
                        UsuarioId = memberId,
                        Rol = (memberId == request.CurrentUserId) ? "admin" : "member",
                        Activo = true,
                        FechaUnion = DateTime.UtcNow,
                        Fijado = false,
                        Archivado = false,
                        Silenciado = false
                    });
                }
            }

            if (participantesToAdd.Any())
            {
                _db.ChatParticipantes.AddRange(participantesToAdd);
                await _db.SaveChangesAsync();
            }

            return Ok(new
            {
                chatId = chat.ChatId,
                message = "¡Grupo creado con éxito!",
                nombre = chat.Nombre
            });
        }
        catch (Exception ex)
        {
            // Esto te dirá en la consola de Visual Studio qué falló exactamente
            Console.WriteLine($"ERROR AL CREAR GRUPO: {ex.Message}");
            return StatusCode(500, new { error = "Error interno al crear el grupo", detalle = ex.Message });
        }
    }
    // ===============================
    // 🔹 DETALLE DEL GRUPO
    // ===============================
    [HttpGet("chats/{chatId:long}/group-detail")]
    public async Task<ActionResult<GroupDetailDto>> GetGroupDetail(long chatId)
    {
        var chat = await _db.Chats
            .Include(c => c.Participantes)
            .ThenInclude(p => p.Usuario)
            .FirstOrDefaultAsync(c => c.ChatId == chatId && c.TipoChat == "group");

        if (chat is null) return NotFound();

        var dto = new GroupDetailDto(
            chat.ChatId,
            chat.Nombre ?? "Grupo",
            chat.FotoUrl,
            chat.Descripcion,
            chat.Reglas,
            chat.FechaCreacion,
            chat.CreadoPorUsuarioId ?? 0,
            chat.PermisoEnviarMensajes ?? "all",
            chat.PermisoEditarInfo ?? "admins",
            chat.Participantes
                .Where(p => p.Activo)
                .Select(p => new GroupMemberDto(p.UsuarioId, p.Usuario.Nombre, p.Rol))
                .ToList()
        );

        return Ok(dto);
    }
}