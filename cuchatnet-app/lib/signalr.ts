import * as signalR from "@microsoft/signalr"

const API_URL = "https://localhost:7086"

let connection: signalR.HubConnection | null = null

export const connectToChat = async (
  chatId: string,
  onMessage: (msg: any) => void,
  onStatus: (data: any) => void
) => {
  connection = new signalR.HubConnectionBuilder()
    .withUrl(`${API_URL}/chathub`)
    .withAutomaticReconnect()
    .build()

  await connection.start()

  // Unirse al grupo correcto
  await connection.invoke("JoinChat", String(chatId))

  connection.on("ReceiveMessage", (message) => {
    onMessage(message)
  })

  connection.on("MessageStatusUpdated", (data) => {
    onStatus(data)
  })
}

export const sendTyping = async (chatId: string, userId: string) => {
  if (!connection) return
  await connection.invoke("Typing", String(chatId), userId)
}