'use client'

import { useApp } from '@/contexts/AppContext'
import * as signalR from '@microsoft/signalr'
import {
  Send,
  FileText,
  MoreVertical,
  Loader2,
  Paperclip,
  Mic,
  X,
  CheckCheck,
  Check,
  AlertCircle,
  Trash2,
  Ban,
} from 'lucide-react'
import { useEffect, useRef, useState, useCallback } from 'react'
import {
  getMessages,
  sendMessage,
  uploadFile,
  markChatAsRead,
  deleteMessage,
} from '@/lib/api'

export default function ChatWindow() {
  const { currentChatId, chats, currentUser, groups } = useApp()

  const [messageText, setMessageText] = useState('')
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [inlineError, setInlineError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isPartnerOnline, setIsPartnerOnline] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; msgId: any }>({
    isOpen: false,
    msgId: null,
  })

  const connectionRef = useRef<signalR.HubConnection | null>(null)
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)

  const API_BASE_URL = 'https://localhost:7086'

  const currentChat = (
    chats?.find((c: any) => String(c.id) === String(currentChatId)) ||
    groups?.find((g: any) => String(g.id) === String(currentChatId))
  ) as any

  const setError = (message: string) => {
    setInlineError(message)
  }

  const getMessageId = (m: any) => m?.id || m?.mensajeId

  const getMessageContent = (m: any) => m?.content || m?.contenido || ''

  const getMessageType = (m: any) => String(m?.type || m?.tipoMensaje || 'text').toLowerCase()

  const isMyMessage = (m: any) =>
    String(m?.senderId || m?.remitenteUsuarioId) === String(currentUser?.id)

  const normalizeStatus = (value: any): 'sent' | 'received' | 'seen' => {
    if (value === 3 || value === '3' || value === 'seen' || value === 'read') return 'seen'
    if (value === 2 || value === '2' || value === 'received' || value === 'delivered') return 'received'
    return 'sent'
  }

  const getFileUrl = (url: string) => {
    if (!url) return ''
    if (url.startsWith('http')) return url
    return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`
  }

  const renderStatus = (m: any) => {
    if (!isMyMessage(m)) return null

    const status = normalizeStatus(m?.status || m?.estado)

    if (status === 'seen') {
      return <CheckCheck size={14} className="text-blue-500" />
    }

    if (status === 'received') {
      return <CheckCheck size={14} className="text-gray-400" />
    }

    return <Check size={14} className="text-gray-400" />
  }

  const loadData = useCallback(async () => {
    if (!currentChatId || currentChatId === '0' || !currentUser?.id) return

    try {
      setLoadingHistory(true)
      setInlineError(null)

      const data = await getMessages(currentChatId, currentUser.id)
      setChatMessages(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error al cargar mensajes:', err)
      setError('Error al cargar historial')
    } finally {
      setLoadingHistory(false)
    }
  }, [currentChatId, currentUser?.id])

  useEffect(() => {
    loadData()
  }, [loadData])

  const markMessageAsRead = useCallback(
    async (messageId: number) => {
      setChatMessages((prev) =>
        prev.map((m) =>
          getMessageId(m) === messageId
            ? { ...m, status: 3, estado: 3 }
            : m
        )
      )

      if (connectionRef.current?.state === signalR.HubConnectionState.Connected) {
        try {
          await connectionRef.current.invoke('MarkMessageAsRead', messageId)
        } catch (err) {
          console.error('Error al marcar mensaje como leído:', err)
        }
      }
    },
    []
  )

  const messageRef = useCallback(
    (node: HTMLDivElement | null, msg: any) => {
      if (!node) return
      if (isMyMessage(msg)) return
      if (normalizeStatus(msg?.status || msg?.estado) === 'seen') return

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            markMessageAsRead(getMessageId(msg))
            observer.disconnect()
          }
        },
        { threshold: 0.5 }
      )

      observer.observe(node)
    },
    [markMessageAsRead, currentUser?.id]
  )

  useEffect(() => {
    if (!currentChatId || !currentUser?.id || currentChatId === '0') return

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_BASE_URL}/chathub?userId=${currentUser.id}`)
      .withAutomaticReconnect()
      .build()

    const startConnection = async () => {
      try {
        await connection.start()

        try {
          await connection.invoke('JoinChat', String(currentChatId))
        } catch {
          try {
            await connection.invoke('joinChat', String(currentChatId))
          } catch (err) {
            console.error('Error al unirse al chat:', err)
          }
        }

        try {
          await markChatAsRead(currentChatId, currentUser.id)
        } catch (err) {
          console.error('Error marcando chat como leído:', err)
        }
      } catch (err) {
        console.error('Error SignalR:', err)
        setTimeout(startConnection, 5000)
      }
    }

    connection.on('ReceiveMessage', async (msg: any) => {
      const msgChatId = String(msg?.chatId || msg?.chatIdRecipiente || '')
      if (msgChatId !== String(currentChatId)) return

      const senderId = String(msg?.senderId || msg?.remitenteUsuarioId || '')
      const mine = senderId === String(currentUser.id)

      setChatMessages((prev) => {
        const incomingId = getMessageId(msg)

        if (prev.some((m) => getMessageId(m) === incomingId)) {
          return prev
        }

        return [...prev, { ...msg, isMe: mine }]
      })

      if (!mine) {
        try {
          await markChatAsRead(currentChatId, currentUser.id)
        } catch {}

        try {
          await connection.invoke('ConfirmDelivery', getMessageId(msg))
        } catch {}
      }
    })

    connection.on('UpdateMessageStatus', (messageId: number, newStatus: any) => {
      setChatMessages((prev) =>
        prev.map((m) =>
          getMessageId(m) === messageId
            ? { ...m, status: newStatus, estado: newStatus }
            : m
        )
      )
    })

    connection.on('ChatReadByPeer', (peerId: any) => {
      if (String(peerId) === String(currentUser.id)) return

      setChatMessages((prev) =>
        prev.map((m) =>
          isMyMessage(m) ? { ...m, status: 3, estado: 3 } : m
        )
      )
    })

    connection.on('MessageDeleted', (messageId: number) => {
      setChatMessages((prev) =>
        prev.map((m) =>
          getMessageId(m) === messageId
            ? {
                ...m,
                isDeleted: true,
                content: isMyMessage(m)
                  ? 'Eliminaste este mensaje'
                  : 'Este mensaje fue eliminado',
              }
            : m
        )
      )
    })

    connection.on('UserStatusChanged', (userId: any, isOnline: boolean) => {
      if (!currentChat) return

      const participantId = currentChat?.participantId || currentChat?.usuarioId
      if (String(userId) === String(participantId)) {
        setIsPartnerOnline(isOnline)
      }
    })

    connectionRef.current = connection
    startConnection()

    return () => {
      connection.stop()
    }
  }, [currentChatId, currentUser?.id, currentChat?.participantId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const handleSendMessage = async (content?: string, type: string = 'text') => {
    if (!currentUser?.id || !currentChatId) return

    const finalContent = typeof content === 'string' ? content : messageText.trim()
    if (!finalContent) return

    setInlineError(null)

    if (type === 'text') {
      setMessageText('')
    }

    const tempId = Date.now()

    const optimisticMessage = {
      id: tempId,
      mensajeId: tempId,
      senderId: Number(currentUser.id),
      remitenteUsuarioId: Number(currentUser.id),
      content: finalContent,
      contenido: finalContent,
      type,
      tipoMensaje: type,
      status: 1,
      estado: 1,
      timestamp: new Date().toISOString(),
      fechaEnvio: new Date().toISOString(),
      isMe: true,
    }

    setChatMessages((prev) => [...prev, optimisticMessage])

    try {
      const response = await sendMessage(currentChatId, {
        senderId: Number(currentUser.id),
        content: finalContent,
        type,
        status: 1,
      })

      if (response && (response.id || response.mensajeId)) {
        setChatMessages((prev) =>
          prev.map((m) =>
            getMessageId(m) === tempId
              ? {
                  ...response,
                  isMe: true,
                  status: response.status ?? 1,
                  estado: response.estado ?? response.status ?? 1,
                }
              : m
          )
        )
      }
    } catch (error) {
      console.error('Error al enviar mensaje:', error)
      setError('Error al enviar')
      setChatMessages((prev) => prev.filter((m) => getMessageId(m) !== tempId))
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !currentChatId) return

    setIsUploading(true)
    setInlineError(null)

    try {
      const response = await uploadFile(currentChatId, file)
      const fileUrl = response?.url || response?.fileUrl

      let type = 'file'
      if (file.type.startsWith('image/')) type = 'image'
      else if (file.type.startsWith('video/')) type = 'video'
      else if (file.type.startsWith('audio/')) type = 'audio'

      if (fileUrl) {
        await handleSendMessage(fileUrl, type)
      }
    } catch (error) {
      console.error('Error al subir archivo:', error)
      setError('Error al subir archivo')
    } finally {
      setIsUploading(false)
      if (e.target) e.target.value = ''
    }
  }

  const deleteForEveryone = async () => {
    if (!deleteModal.msgId) return

    try {
      await deleteMessage(deleteModal.msgId)

      setChatMessages((prev) =>
        prev.map((m) =>
          getMessageId(m) === deleteModal.msgId
            ? {
                ...m,
                isDeleted: true,
                content: 'Eliminaste este mensaje',
                contenido: 'Eliminaste este mensaje',
              }
            : m
        )
      )

      setDeleteModal({ isOpen: false, msgId: null })
    } catch (error) {
      console.error('Error al eliminar:', error)
      setError('Error al eliminar')
    }
  }

  const deleteForMe = () => {
    setChatMessages((prev) =>
      prev.filter((m) => getMessageId(m) !== deleteModal.msgId)
    )
    setDeleteModal({ isOpen: false, msgId: null })
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)

      mediaRecorderRef.current = recorder

      const chunks: BlobPart[] = []

      recorder.ondataavailable = (e) => chunks.push(e.data)

      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/ogg; codecs=opus' })
        const file = new File([blob], 'voice_memo.ogg', { type: 'audio/ogg' })

        setIsUploading(true)

        try {
          const res = await uploadFile(currentChatId!, file)
          if (res?.url || res?.fileUrl) {
            await handleSendMessage(res.url || res.fileUrl, 'audio')
          }
        } catch (error) {
          console.error('Error al subir audio:', error)
          setError('Error al subir audio')
        } finally {
          setIsUploading(false)
        }
      }

      recorder.start()
      setIsRecording(true)
    } catch (err) {
      console.error('Error micrófono:', err)
      setError('Permiso de micrófono denegado')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)

      const stream = mediaRecorderRef.current.stream
      stream.getTracks().forEach((track) => track.stop())
    }
  }

  if (!currentChat || !currentUser) {
    return (
      <div className="h-full flex items-center justify-center bg-[#efeae2] text-gray-500">
        Selecciona un chat o grupo
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-[#efeae2] relative overflow-hidden border-l border-gray-300">
      {selectedImage && (
        <div
          className="absolute inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 text-white bg-white/10 hover:bg-white/20 rounded-full p-2"
          >
            <X size={20} />
          </button>
          <img
            src={getFileUrl(selectedImage)}
            className="max-w-full max-h-full rounded shadow-2xl"
            alt="Preview"
          />
        </div>
      )}

      {inlineError && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[100] bg-red-600 text-white px-4 py-2 rounded-full text-xs font-bold shadow-xl flex items-center gap-2 animate-bounce">
          <AlertCircle size={14} />
          {inlineError}
          <button onClick={() => setInlineError(null)} className="ml-2 hover:text-black">
            ×
          </button>
        </div>
      )}

      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-xs w-full">
            <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">
              ¿Eliminar mensaje?
            </h3>

            <div className="space-y-2">
              <button
                onClick={deleteForEveryone}
                className="w-full py-2.5 bg-[#E21B23] text-white font-bold rounded-xl"
              >
                Eliminar para todos
              </button>

              <button
                onClick={deleteForMe}
                className="w-full py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-xl"
              >
                Eliminar para mí
              </button>

              <button
                onClick={() => setDeleteModal({ isOpen: false, msgId: null })}
                className="w-full py-2.5 text-gray-400 font-medium"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="p-3 bg-[#f0f2f5] flex items-center justify-between border-b border-gray-300 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#E21B23] to-[#0A2E6D] rounded-full overflow-hidden flex items-center justify-center border border-gray-300 shadow-sm">
            {currentChat.participantPhoto || currentChat.photo ? (
              <img
                src={getFileUrl(currentChat.participantPhoto || currentChat.photo)}
                className="w-full h-full object-cover"
                alt=""
              />
            ) : (
              <span className="text-white font-bold">
                {currentChat.participantName?.charAt(0) || currentChat.name?.charAt(0) || 'U'}
              </span>
            )}
          </div>

          <div>
            <h2 className="font-bold text-gray-800 text-sm">
              {currentChat.participantName || currentChat.name || 'Usuario'}
            </h2>
            <p className={`text-[10px] ${isPartnerOnline ? 'text-green-600 font-bold' : 'text-gray-500'}`}>
              {currentChat.isGroup ? 'Grupo activo' : isPartnerOnline ? '● en línea' : 'desconectado'}
            </p>
          </div>
        </div>

        <MoreVertical className="text-gray-500 cursor-pointer" size={20} />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat">
        {loadingHistory && (
          <div className="flex justify-center">
            <Loader2 className="animate-spin text-[#E21B23]" />
          </div>
        )}

        {chatMessages.map((m: any) => {
          const isMe = isMyMessage(m)
          const type = getMessageType(m)
          const rawContent = getMessageContent(m)
          const url = getFileUrl(rawContent)
          const msgId = getMessageId(m)
          const isDeleted =
            m?.isDeleted ||
            rawContent === 'Este mensaje fue eliminado' ||
            rawContent === 'Eliminaste este mensaje'

          const rawDate = m?.timestamp || m?.fechaEnvio || new Date().toISOString()
          const dateValue =
            typeof rawDate === 'string' && rawDate.includes('Z')
              ? new Date(rawDate)
              : new Date(rawDate)

          return (
            <div
              key={msgId || Math.random()}
              ref={(node) => messageRef(node, m)}
              className={`group flex ${isMe ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-1 duration-300`}
            >
              <div
                className={`relative p-2 rounded-lg shadow-sm max-w-[80%] ${
                  isMe ? 'bg-[#dcf8c6] rounded-tr-none' : 'bg-white rounded-tl-none'
                }`}
              >
                {isMe && !isDeleted && (
                  <button
                    onClick={() => setDeleteModal({ isOpen: true, msgId })}
                    className="absolute -left-8 top-1 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 p-1 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                )}

                {!isMe && currentChat.isGroup && !isDeleted && (
                  <p className="text-[10px] font-bold text-[#0A2E6D] mb-1">
                    {m.senderName || 'Usuario'}
                  </p>
                )}

                {isDeleted ? (
                  <div className="flex items-center gap-2 text-gray-400 italic text-[13.5px]">
                    <Ban size={14} />
                    {rawContent}
                  </div>
                ) : (
                  <>
                    {type === 'text' && (
                      <p className="text-[13.5px] text-gray-800 pr-4 break-words">
                        {rawContent}
                      </p>
                    )}

                    {type === 'image' && (
                      <img
                        src={url}
                        onClick={() => setSelectedImage(rawContent)}
                        className="rounded-md max-h-64 object-cover cursor-pointer"
                        alt=""
                      />
                    )}

                    {type === 'video' && (
                      <video src={url} controls className="rounded-md max-h-64 w-full" />
                    )}

                    {type === 'audio' && (
                      <audio src={url} controls className="w-52 h-10 mt-1" />
                    )}

                    {type === 'file' && (
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-3 p-2 bg-black/5 rounded-md text-blue-700 text-xs font-semibold"
                      >
                        <FileText size={20} />
                        <span className="truncate max-w-[120px]">Archivo</span>
                      </a>
                    )}
                  </>
                )}

                <div className="flex justify-end items-center gap-1 mt-1 opacity-70">
                  <span className="text-[9px] text-gray-500">
                    {dateValue.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {!isDeleted && renderStatus(m)}
                </div>
              </div>
            </div>
          )
        })}

        {isUploading && (
          <div className="flex justify-end">
            <div className="bg-[#dcf8c6] p-2 rounded-lg flex items-center gap-2 text-xs text-gray-600 shadow-sm">
              <Loader2 className="animate-spin" size={14} />
              Subiendo...
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="p-2 bg-[#f0f2f5] flex items-center gap-2 border-t border-gray-300">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 text-gray-600 hover:bg-gray-200 rounded-full"
        >
          {isUploading ? (
            <Loader2 className="animate-spin text-[#E21B23]" size={22} />
          ) : (
            <Paperclip size={22} className="rotate-45" />
          )}
        </button>

        <input
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder={isRecording ? 'Grabando audio...' : 'Escribe un mensaje'}
          className="flex-1 p-2.5 px-4 rounded-full outline-none text-sm bg-white"
        />

        {!messageText.trim() ? (
          <button
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            className={`p-2 rounded-full ${
              isRecording ? 'bg-red-500 text-white animate-pulse' : 'text-gray-600'
            }`}
          >
            <Mic size={22} />
          </button>
        ) : (
          <button
            onClick={() => handleSendMessage()}
            className="p-2 bg-[#00a884] text-white rounded-full"
          >
            <Send size={22} />
          </button>
        )}
      </div>
    </div>
  )
}