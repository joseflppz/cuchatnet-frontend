using Microsoft.AspNetCore.SignalR;

namespace CUChatNet.Api.Hubs
{
    // ✅ DTO CORRECTO
    public class TypingDto
    {
        public string ChatId { get; set; }
        public string UserName { get; set; }
    }

    // ✅ HUB CORRECTO
    public class ChatHub : Hub
    {
        public async Task JoinChat(string chatId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"chat-{chatId}");
        }

        public async Task LeaveChat(string chatId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"chat-{chatId}");
        }

        public async Task Typing(TypingDto data)
        {
            await Clients.Group($"chat-{data.ChatId}")
                .SendAsync("UserTyping", data.UserName);
        }

        public async Task SendMessage(object message)
        {
            await Clients.Group($"chat-{Context.ConnectionId}")
                .SendAsync("ReceiveMessage", message);
        }
    }
}