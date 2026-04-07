export const getMessages = async (chatId: string) => {
  try {
    const res = await fetch(`https://localhost:7086/api/messages/${chatId}`)

    if (!res.ok) {
      console.error("❌ ERROR BACKEND (GET):", await res.text())
      return []
    }

    return await res.json()
  } catch (err) {
    console.error("❌ ERROR GET:", err)
    return []
  }
}

export const sendMessage = async (
  chatId: string,
  body: {
    request: {
      senderId: number
      content: string
      type: 'text' | 'image' | 'video' | 'audio' | 'file'
      mediaUrl?: string
    }
  }
) => {
  try {
    const res = await fetch(`https://localhost:7086/api/messages/${chatId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    })

    if (!res.ok) {
      const error = await res.text()
      console.error("❌ ERROR BACKEND (SEND):", error)
      return null
    }

    return await res.json()
  } catch (err) {
    console.error("❌ ERROR SEND:", err)
    return null
  }
}