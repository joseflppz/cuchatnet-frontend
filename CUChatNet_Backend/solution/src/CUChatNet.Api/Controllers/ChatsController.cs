using CUChatNet.Api.Data;
using CUChatNet.Api.Dtos;
using CUChatNet.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CUChatNet.Api.Controllers;

[ApiController]
[Route("api")]
public class ChatsController : ControllerBase
{
    private readonly CUChatNetDbContext _db;

    public ChatsController(CUChatNetDbContext db)
    {
        _db = db;
    }

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
            FechaCreacion = DateTime.UtcNow,
            Activo = true
        };

        _db.Chats.Add(chat);
        await _db.SaveChangesAsync();

        _db.ChatParticipantes.AddRange(
            new ChatParticipante
            {
                ChatId = chat.ChatId,
                UsuarioId = request.CurrentUserId,
                Rol = "member",
                Activo = true,
                FechaUnion = DateTime.UtcNow
            },
            new ChatParticipante
            {
                ChatId = chat.ChatId,
                UsuarioId = request.ContactUserId,
                Rol = "member",
                Activo = true,
                FechaUnion = DateTime.UtcNow
            }
        );

        _db.BitacoraEventos.Add(new BitacoraEvento
        {
            Categoria = "message",
            UsuarioId = request.CurrentUserId,
            Accion = "Chat directo creado",
            Detalles = $"ChatID: {chat.ChatId}, ContactoID: {request.ContactUserId}",
            Severidad = "info",
            DireccionIp = HttpContext.Connection.RemoteIpAddress?.ToString(),
            FechaEvento = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();
        return Ok(new { chatId = chat.ChatId, message = "Chat directo creado." });
    }

    [HttpPost("chats/group")]
    public async Task<IActionResult> CreateGroup([FromBody] CreateGroupChatRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.GroupName))
            return BadRequest(new { error = "El nombre del grupo es obligatorio." });

        var chat = new Chat
        {
            TipoChat = "group",
            Nombre = request.GroupName.Trim(),
            FotoUrl = request.GroupPhoto,
            Descripcion = request.GroupDescription,
            Reglas = "",
            PermisoEnviarMensajes = "all",
            PermisoEditarInfo = "admins",
            CreadoPorUsuarioId = request.CurrentUserId,
            FechaCreacion = DateTime.UtcNow,
            Activo = true
        };

        _db.Chats.Add(chat);
        await _db.SaveChangesAsync();

        var allMembers = request.MemberIds.Distinct().ToList();
        if (!allMembers.Contains(request.CurrentUserId))
            allMembers.Insert(0, request.CurrentUserId);

        foreach (var memberId in allMembers)
        {
            _db.ChatParticipantes.Add(new ChatParticipante
            {
                ChatId = chat.ChatId,
                UsuarioId = memberId,
                Rol = memberId == request.CurrentUserId ? "admin" : "member",
                Activo = true,
                FechaUnion = DateTime.UtcNow
            });
        }

        _db.BitacoraEventos.Add(new BitacoraEvento
        {
            Categoria = "message",
            UsuarioId = request.CurrentUserId,
            Accion = "Grupo creado",
            Detalles = $"ChatID: {chat.ChatId}, Nombre: {chat.Nombre}",
            Severidad = "info",
            DireccionIp = HttpContext.Connection.RemoteIpAddress?.ToString(),
            FechaEvento = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();
        return Ok(new { chatId = chat.ChatId, message = "Grupo creado." });
    }

    [HttpGet("chats/{chatId:long}/group-detail")]
    public async Task<ActionResult<GroupDetailDto>> GetGroupDetail(long chatId)
    {
        var chat = await _db.Chats
            .Include(c => c.Participantes)
            .ThenInclude(p => p.Usuario)
            .FirstOrDefaultAsync(c => c.ChatId == chatId && c.TipoChat == "group");

        if (chat is null)
            return NotFound();

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

    [HttpPut("chats/{chatId:long}/group-detail")]
    public async Task<IActionResult> UpdateGroupDetail(long chatId, [FromBody] UpdateGroupRequest request)
    {
        var chat = await _db.Chats.FirstOrDefaultAsync(c => c.ChatId == chatId && c.TipoChat == "group");
        if (chat is null)
            return NotFound();

        chat.Nombre = request.Name.Trim();
        chat.FotoUrl = request.Photo;
        chat.Descripcion = request.Description;
        chat.Reglas = request.Rules;
        chat.PermisoEnviarMensajes = request.SendMessagesPermission;
        chat.PermisoEditarInfo = request.EditInfoPermission;

        _db.BitacoraEventos.Add(new BitacoraEvento
        {
            Categoria = "admin",
            UsuarioId = chat.CreadoPorUsuarioId,
            Accion = "Grupo actualizado",
            Detalles = $"ChatID: {chat.ChatId}",
            Severidad = "info",
            DireccionIp = HttpContext.Connection.RemoteIpAddress?.ToString(),
            FechaEvento = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();
        return Ok(new { success = true });
    }
}
