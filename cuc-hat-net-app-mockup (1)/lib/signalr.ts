import * as signalR from "@microsoft/signalr"

const API_URL = "https://localhost:7086"

let connection: signalR.HubConnection | null = null

export const connectToChat = async (chatId: string, onMessage: (msg: any) => void, onStatus: (data: any) => void) => {
  connection = new signalR.HubConnectionBuilder()
    .withUrl(`${API_URL}/chathub`)
    .withAutomaticReconnect()
    .build()

  await connection.start()

  // 🔥 Unirse al grupo del chat
  await connection.invoke("JoinChat", `chat-${chatId}`)

  // 🔥 Recibir mensajes en tiempo real
  connection.on("ReceiveMessage", (message) => {
    onMessage(message)
  })

  // 🔥 Estado ✔✔
  connection.on("MessageStatusUpdated", (data) => {
    onStatus(data)
  })
}

export const sendTyping = async (chatId: string, userId: string) => {
  if (!connection) return
  await connection.invoke("Typing", `chat-${chatId}`, userId)
}