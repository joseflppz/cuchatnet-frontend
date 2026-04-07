using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;
using System.Text.RegularExpressions;

public class ChatHub : Hub
{
    private static readonly ConcurrentDictionary<string, string> _onlineUsers = new();

    public override async Task OnConnectedAsync()
    {
        var userId = Context.GetHttpContext()?.Request.Query["userId"].ToString();
        if (!string.IsNullOrEmpty(userId))
        {
            _onlineUsers[userId] = Context.ConnectionId;
            await Clients.All.SendAsync("UserStatusChanged", userId, true);
        }
        await base.OnConnectedAsync();
    }

    // Cambiamos el nombre a JoinChat para que coincida con el Frontend
    // Y hacemos el userId opcional o lo quitamos si no lo usas aquí
    public async Task JoinChat(string chatId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, chatId);

        // Obtenemos el userId de la conexión para notificar
        var userId = _onlineUsers.FirstOrDefault(x => x.Value == Context.ConnectionId).Key;
        if (userId != null)
        {
            // Usamos "ChatReadByPeer" para que el frontend lo reconozca
            await Clients.Group(chatId).SendAsync("ChatReadByPeer", userId);
        }
    }

    public override async Task OnDisconnectedAsync(Exception? ex)
    {
        var userId = _onlineUsers.FirstOrDefault(x => x.Value == Context.ConnectionId).Key;
        if (userId != null)
        {
            _onlineUsers.TryRemove(userId, out _);
            await Clients.All.SendAsync("UserStatusChanged", userId, false);
        }
        await base.OnDisconnectedAsync(ex);
    }
}