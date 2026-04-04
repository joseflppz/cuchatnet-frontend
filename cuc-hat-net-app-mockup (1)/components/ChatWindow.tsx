'use client'

import { useApp } from '@/contexts/AppContext'
import {
  Send,
  Lock,
  Smile,
  Paperclip,
  Mic,
  Play,
  Pause,
  Info,
  AlertTriangle,
  Check,
  CheckCheck,
  Clock,
  FileText,
  Image as ImageIcon,
  Video as VideoIcon,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { MediaModal } from '@/components/modals/MediaModal'
import { VoiceModal } from '@/components/modals/VoiceModal'
import { GroupInfoModal } from '@/components/modals/GroupInfoModal'
import { getMessages, sendMessage } from "@/lib/api/messages"

type MessageType = 'text' | 'image' | 'video' | 'audio' | 'file'
type MessageStatus = 'sending' | 'sent' | 'received' | 'seen'

const MAX_FILE_MB = 100
const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024

const ALLOWED_IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const ALLOWED_VIDEO_MIME = ['video/mp4', 'video/webm', 'video/quicktime']
const ALLOWED_FILE_MIME = [
  'application/pdf',
  'application/zip',
  'application/x-zip-compressed',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
]

function formatBytes(bytes: number) {
  if (!bytes && bytes !== 0) return ''
  const mb = bytes / (1024 * 1024)
  if (mb >= 1) return `${mb.toFixed(1)} MB`
  const kb = bytes / 1024
  return `${kb.toFixed(0)} KB`
}

export default function ChatWindow() {
  const { currentChatId, chats, setChats, currentUser, messages, setMessages, showToast, groups } = useApp()

  const [messageText, setMessageText] = useState('')
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [showMediaModal, setShowMediaModal] = useState(false)
  const [showVoiceModal, setShowVoiceModal] = useState(false)
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null)
  const [showGroupInfo, setShowGroupInfo] = useState(false)

  // ✅ REQ-6.g: errores/limitaciones visibles
  const [inlineError, setInlineError] = useState<string | null>(null)

  // Estados “extra” sin tocar el tipo Message global
  const [failedById, setFailedById] = useState<Record<string, string>>({})
  const [progressById, setProgressById] = useState<Record<string, number>>({})

  const bottomRef = useRef<HTMLDivElement | null>(null)

  const currentChat = chats.find((c) => c.id === currentChatId)

  const [chatMessages, setChatMessages] = useState<any[]>([])

  const currentChatMessages = useMemo(() => {
    if (!currentChatId) return []
    return messages.filter((msg) => msg.chatId === currentChatId)
  }, [currentChatId, messages])

  useEffect(() => {
  if (!currentChatId) return

  const loadMessages = async () => {
    setLoadingMessages(true)

    const data = await getMessages(currentChatId)

    setChatMessages(data || [])

    setLoadingMessages(false)
  }

  loadMessages()
}, [currentChatId])

  useEffect(() => {
    // auto-scroll al final
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentChatId, currentChatMessages.length, loadingMessages])

  const toastLabelByType: Record<MessageType, string> = {
    text: 'Mensaje enviado',
    image: 'Imagen enviada',
    video: 'Video enviado',
    audio: 'Nota de voz enviada',
    file: 'Archivo enviado',
  }

  const statusIcon = (status: MessageStatus) => {
    if (status === 'sending') return <Clock className="w-3.5 h-3.5" />
    if (status === 'sent') return <Check className="w-3.5 h-3.5" />
    return <CheckCheck className="w-3.5 h-3.5" />
  }

  const clearInlineErrorSoon = () => {
    setTimeout(() => setInlineError(null), 4500)
  }

  const setErrorUI = (msg: string) => {
    setInlineError(msg)
    showToast(msg, 'error')
    clearInlineErrorSoon()
  }

  const updateChatPreview = (type: MessageType, contentText: string) => {
    if (!currentChatId) return
    const now = new Date()
    const preview =
      type === 'text'
        ? contentText || 'Mensaje'
        : type === 'image'
          ? '🖼️ Imagen'
          : type === 'video'
            ? '📹 Video'
            : type === 'audio'
              ? '🎤 Nota de voz'
              : '📎 Archivo'

    setChats((prev) =>
      prev.map((c) => (c.id === currentChatId ? { ...c, lastMessage: preview, lastMessageTime: now.toISOString(), unread: 0 } : c)),
    )
  }

  const startLifecycle = (messageId: string, type: MessageType) => {
    // progreso (solo para multimedia)
    if (type !== 'text') {
      setProgressById((p) => ({ ...p, [messageId]: 10 }))
      const steps = [25, 45, 65, 80, 92, 100]
      steps.forEach((val, i) => {
        setTimeout(() => {
          setProgressById((p) => {
            // si falló, no seguimos
            if (failedById[messageId]) return p
            return { ...p, [messageId]: val }
          })
        }, 220 * (i + 1))
      })
    }

    // checks
    setTimeout(() => {
      setMessages((msgs) => msgs.map((m: any) => (m.id === messageId ? { ...m, status: 'sent' } : m)))
    }, 280)

    setTimeout(() => {
      setMessages((msgs) => msgs.map((m: any) => (m.id === messageId ? { ...m, status: 'received' } : m)))
    }, 560)

    setTimeout(() => {
      setMessages((msgs) => msgs.map((m: any) => (m.id === messageId ? { ...m, status: 'seen' } : m)))
    }, 900)
  }

  const markFailed = (messageId: string, reason: string) => {
    setFailedById((prev) => ({ ...prev, [messageId]: reason }))
    setProgressById((prev) => ({ ...prev, [messageId]: 0 }))
    setErrorUI(reason)
  }

  const handleSendMessage = async (type: MessageType = 'text', content?: string, mediaUrl?: string) => {
  if (!currentChatId || !currentUser) {
    setErrorUI('Selecciona un chat primero')
    return
  }

  if (type === 'text' && !messageText.trim()) return

  const contentText = type === 'text' ? messageText.trim() : content || ''

  const newMessage = {
    senderId: currentUser.id,
    content: contentText,
    type,
    mediaUrl
  }

  const response = await sendMessage(currentChatId, newMessage)

  if (response) {
    const data = await getMessages(currentChatId)
    setChatMessages(data || [])

    updateChatPreview(type, contentText)
    showToast(toastLabelByType[type], 'success')
  } else {
    setErrorUI('Error al enviar mensaje')
  }

  if (type === 'text') setMessageText('')
}

const validateMedia = (media: { type: 'image' | 'video' | 'file'; file: File }) => {
  const { type, file } = media

    // tamaño
    if (file.size > MAX_FILE_BYTES) {
      return `Error: El archivo supera el tamaño máximo permitido (${MAX_FILE_MB}MB).`
    }

    const mime = file.type || ''

    // formato
    if (type === 'image' && mime && !ALLOWED_IMAGE_MIME.includes(mime)) {
      return 'Error: Formato de imagen no soportado. Usa JPG/PNG/WebP/GIF.'
    }
    if (type === 'video' && mime && !ALLOWED_VIDEO_MIME.includes(mime)) {
      return 'Error: Formato de video no soportado. Usa MP4/WebM.'
    }
    if (type === 'file' && mime && !ALLOWED_FILE_MIME.includes(mime)) {
      return 'Error: Formato de archivo no soportado.'
    }

    return null
  }

  const handleSendMedia = (media: { type: 'image' | 'video' | 'file'; file: File; preview?: string }) => {
    const validationError = validateMedia({ type: media.type, file: media.file })
    if (validationError) {
      setErrorUI(validationError)
      return
    }

    // mockup: preview si viene, si no url local
    const url = media.preview || `file://${media.file.name}`
    // content: incluimos nombre y peso para que se vea “procesado”
    const label = `${media.file.name} • ${formatBytes(media.file.size)}`
    handleSendMessage(media.type, label, url)
  }

  const handleSendVoice = (duration: number) => {
    const mm = Math.floor(duration / 60)
    const ss = String(duration % 60).padStart(2, '0')
    handleSendMessage('audio', `Nota de voz (${mm}:${ss})`)
  }

  const retrySend = (message: any) => {
    // quitar fallo y reenviar
    setFailedById((prev) => {
      const copy = { ...prev }
      delete copy[message.id]
      return copy
    })
    setProgressById((prev) => ({ ...prev, [message.id]: 10 }))

    // reiniciar checks
    setMessages((msgs) => msgs.map((m: any) => (m.id === message.id ? { ...m, status: 'sending' } : m)))
    startLifecycle(message.id, message.type)
    showToast('Reintentando envío...', 'info')
  }

  // Mock play/pause de nota de voz
  useEffect(() => {
    if (!playingVoiceId) return
    const t = setTimeout(() => setPlayingVoiceId(null), 2200)
    return () => clearTimeout(t)
  }, [playingVoiceId])

  if (!currentChatId || !currentChat) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-background">
        <div className="text-center">
          <div className="text-6xl mb-4">💬</div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Selecciona un chat</h2>
          <p className="text-muted-foreground">Elige una conversación para ver los mensajes</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="h-16 bg-card/95 backdrop-blur border-b border-border flex items-center px-4 justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-lg overflow-hidden shadow-sm">
            {currentChat.participantPhoto?.startsWith('data:') ? (
              <img
                src={currentChat.participantPhoto}
                alt={currentChat.participantName}
                className="w-full h-full object-cover"
              />
            ) : (
              currentChat.participantPhoto || '👤'
            )}
          </div>

          <div className="min-w-0">
            <p className="font-semibold text-foreground truncate">
              {currentChat.participantName}
            </p>

            {currentChat.isGroup ? (
              <p className="text-xs text-muted-foreground">Grupo</p>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">
                  {currentChat.participantStatus === 'available' && 'Disponible'}
                  {currentChat.participantStatus === 'busy' && 'Ocupado'}
                  {currentChat.participantStatus === 'away' && 'Ausente'}
                </p>

                {currentChat.participantDescription && (
                  <p className="text-xs text-muted-foreground italic truncate">
                    {currentChat.participantDescription}
                  </p>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            {currentChat.isGroup && (
              <button
                onClick={() => setShowGroupInfo(true)}
                className="p-2 hover:bg-muted rounded-lg transition text-foreground"
                aria-label="Info del grupo"
                type="button"
              >
                <Info className="w-5 h-5" />
              </button>
            )}

            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <Lock className="w-4 h-4" />
              Cifrado E2E
            </div>
          </div>
        </div>
      </div> {/* ← ESTE era el cierre que faltaba */}

      {/* Body empieza aquí */}


      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-primary/5 via-background to-background">
        {loadingMessages ? (
          <div className="text-center py-10">
            <div className="inline-flex items-center gap-2 text-primary">
              <span className="inline-block animate-spin text-xl">⌛</span>
              <span className="font-medium">Cargando mensajes...</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">Sincronizando conversación</p>
          </div>
        ) : currentChatMessages.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-4xl mb-2">📭</div>
            <p className="text-muted-foreground">No hay mensajes aún</p>
            <p className="text-xs text-muted-foreground mt-1">Envía un texto, imagen, video, archivo o nota de voz</p>
          </div>
        ) : (
          chatMessages.map((message: any) => {
            const isOwn = message.senderId === currentUser?.id || message.senderId === 'user-1'
            const failedReason = failedById[message.id]
            const progress = progressById[message.id] ?? 0

            return (
              <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={[
                    'max-w-[22rem] rounded-2xl shadow-sm border',
                    isOwn
                      ? 'bg-primary text-primary-foreground border-primary/30 rounded-br-md'
                      : 'bg-card text-foreground border-border rounded-bl-md',
                  ].join(' ')}
                >
                  {/* contenido */}
                  <div className="px-4 py-3">
                    {message.type === 'text' && <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>}

                    {message.type === 'image' && (
                      <div className="space-y-2">
                        <div className="rounded-xl overflow-hidden border border-border/60 bg-gradient-to-br from-primary/15 to-secondary/15 h-44 flex items-center justify-center">
                          <ImageIcon className="w-10 h-10 opacity-70" />
                        </div>
                        <p className="text-xs opacity-90">{message.content}</p>
                      </div>
                    )}

                    {message.type === 'video' && (
                      <div className="space-y-2">
                        <div className="rounded-xl overflow-hidden border border-border/60 bg-gradient-to-br from-blue-500/15 to-blue-700/15 h-44 flex items-center justify-center">
                          <VideoIcon className="w-10 h-10 opacity-70" />
                        </div>
                        <p className="text-xs opacity-90">{message.content}</p>
                      </div>
                    )}

                    {message.type === 'file' && (
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center border border-border/70">
                          <FileText className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{message.content}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Archivo adjunto</p>
                        </div>
                      </div>
                    )}

                    {message.type === 'audio' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setPlayingVoiceId(playingVoiceId === message.id ? null : message.id)}
                          className="w-9 h-9 rounded-full bg-black/10 hover:bg-black/15 transition flex items-center justify-center"
                          type="button"
                          aria-label="Reproducir/pausar nota de voz"
                        >
                          {playingVoiceId === message.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </button>

                        <div className="flex-1">
                          <p className="text-sm">{message.content}</p>
                          <div className="h-1.5 mt-1 rounded-full bg-black/10 overflow-hidden">
                            <div
                              className="h-full bg-black/30 transition-all"
                              style={{ width: playingVoiceId === message.id ? '70%' : '25%' }}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* progreso multimedia */}
                    {message.type !== 'text' && !failedReason && progress > 0 && progress < 100 && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-[11px] opacity-80">
                          <span>Procesando / enviando…</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="h-1.5 mt-1 rounded-full bg-black/10 overflow-hidden">
                          <div className="h-full bg-black/30 transition-all" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                    )}

                    {/* error visible (REQ-6.g) */}
                    {failedReason && (
                      <div className="mt-3 rounded-xl border border-red-300/40 bg-red-500/10 p-3">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-xs font-medium text-red-700">Envío fallido</p>
                            <p className="text-xs text-red-700/90 mt-0.5">{failedReason}</p>
                            <div className="mt-2 flex gap-2">
                              <button
                                type="button"
                                onClick={() => retrySend(message)}
                                className="text-xs font-semibold text-red-700 underline underline-offset-2 hover:opacity-80"
                              >
                                Reintentar
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setFailedById((prev) => {
                                    const copy = { ...prev }
                                    delete copy[message.id]
                                    return copy
                                  })
                                }
                                className="text-xs text-red-700/90 hover:opacity-80"
                              >
                                Ocultar
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* footer */}
                  <div className="px-4 pb-2 flex items-center justify-end gap-2 text-xs opacity-70">
                    <span>{message.timestamp}</span>
                    {isOwn && !failedReason && <span className="inline-flex items-center">{statusIcon(message.status)}</span>}
                  </div>
                </div>
              </div>
            )
          })
        )}

        <div ref={bottomRef} />
      </div>

      {/* Inline error banner (REQ-6.g visual) */}
      {inlineError && (
        <div className="px-4 pb-0">
          <div className="mt-2 mb-0 rounded-xl border border-red-300/50 bg-red-500/10 px-3 py-2 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />
            <p className="text-xs text-red-700 flex-1">{inlineError}</p>
            <button
              type="button"
              onClick={() => setInlineError(null)}
              className="p-1 rounded-md hover:bg-red-500/10"
              aria-label="Cerrar"
            >
              <X className="w-4 h-4 text-red-700" />
            </button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="bg-card border-t border-border p-4">
        <div className="flex gap-2 items-end">
          <div className="flex-1 bg-muted/70 rounded-2xl border border-border/70 flex items-center px-3 py-2 gap-2 shadow-sm">
            <button className="hover:text-primary transition-colors" type="button" aria-label="Emojis">
              <Smile className="w-5 h-5 text-muted-foreground" />
            </button>

            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onFocus={() => setInlineError(null)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage('text')
                }
              }}
              placeholder="Escribe un mensaje..."
              className="flex-1 bg-transparent focus:outline-none text-foreground placeholder:text-muted-foreground"
            />

            <button onClick={() => setShowMediaModal(true)} className="hover:text-primary transition-colors" type="button" aria-label="Adjuntar">
              <Paperclip className="w-5 h-5 text-muted-foreground" />
            </button>

            <button onClick={() => setShowVoiceModal(true)} className="hover:text-primary transition-colors" type="button" aria-label="Nota de voz">
              <Mic className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          <Button
            onClick={() => handleSendMessage('text')}
            size="icon"
            className="bg-primary hover:bg-primary/90 rounded-2xl h-11 w-11 flex items-center justify-center shadow-sm"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>

        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Lock className="w-3.5 h-3.5" />
            Mensajes con cifrado de extremo a extremo
          </span>
          <span>Límite multimedia: {MAX_FILE_MB}MB</span>
        </div>
      </div>

      {/* Modals */}
      <MediaModal isOpen={showMediaModal} onClose={() => setShowMediaModal(false)} onSendMedia={handleSendMedia} />

      <VoiceModal isOpen={showVoiceModal} onClose={() => setShowVoiceModal(false)} onSendVoice={handleSendVoice} />

      {currentChat.isGroup && (
        <GroupInfoModal
          isOpen={showGroupInfo}
          onClose={() => setShowGroupInfo(false)}
          group={groups.find((g) => g.id === currentChatId) || null}
        />
      )}
    </div>
  )
}

