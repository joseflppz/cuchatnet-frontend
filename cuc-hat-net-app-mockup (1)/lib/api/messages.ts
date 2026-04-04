const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://localhost:7086"

// 🔹 Obtener mensajes de un chat
export async function getMessages(chatId: string) {
  try {
    const res = await fetch(`${API_URL}/api/chats/${chatId}/messages`)

    if (!res.ok) {
      throw new Error("Error al obtener mensajes")
    }

    return await res.json()
  } catch (error) {
    console.error("getMessages error:", error)
    return []
  }
}

// 🔹 Enviar mensaje
export async function sendMessage(chatId: string, data: {
  senderId: string
  content: string
  type: "text" | "image" | "video" | "audio" | "file"
  mediaUrl?: string
}) {
  try {
    const res = await fetch(`${API_URL}/api/chats/${chatId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    })

    if (!res.ok) {
      throw new Error("Error al enviar mensaje")
    }

    return await res.json()
  } catch (error) {
    console.error("sendMessage error:", error)
    return null
  }
}

// 🔹 Actualizar estado del mensaje (visto, recibido, etc.)
export async function updateMessageStatus(messageId: string, status: "received" | "seen") {
  try {
    const res = await fetch(`${API_URL}/api/messages/${messageId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        status
      })
    })

    if (!res.ok) {
      throw new Error("Error al actualizar estado")
    }

    return await res.json()
  } catch (error) {
    console.error("updateMessageStatus error:", error)
    return null
  }
}