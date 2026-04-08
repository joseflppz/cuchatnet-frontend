'use client'

import React, { useState } from 'react'
import { useApp } from '@/contexts/AppContext'
import { Search, Archive, Pin, Trash2, PinOff } from 'lucide-react'

export default function ChatList() {
  const { chats, setChats, setCurrentChatId, currentChatId, showToast } = useApp()
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<'all' | 'pinned' | 'archived'>('all')
  const [menuOpen, setMenuOpen] = useState<string | null>(null)

  const filteredChats = chats.filter((chat) => {
    const matchesSearch = chat.participantName.toLowerCase().includes(searchTerm.toLowerCase())

    if (filter === 'pinned') return matchesSearch && chat.pinned && !chat.archived
    if (filter === 'archived') return matchesSearch && chat.archived

    return matchesSearch && !chat.archived
  })

  const handlePin = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation()
    const updatedChats = chats.map((c) =>
      c.id === chatId ? { ...c, pinned: !c.pinned } : c
    )
    setChats(updatedChats)

    const chat = chats.find((c) => c.id === chatId)
    showToast(chat?.pinned ? 'Chat desfijado' : 'Chat fijado', 'success')
    setMenuOpen(null)
  }

  const handleArchive = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation()
    const updatedChats = chats.map((c) =>
      c.id === chatId ? { ...c, archived: !c.archived } : c
    )
    setChats(updatedChats)

    const chat = chats.find((c) => c.id === chatId)
    showToast(chat?.archived ? 'Chat restaurado' : 'Chat archivado', 'success')
    setMenuOpen(null)
  }

  const handleDelete = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation()
    setChats(chats.filter((c) => c.id !== chatId))

    if (currentChatId === chatId) {
      setCurrentChatId(null)
    }

    showToast('Chat eliminado', 'success')
    setMenuOpen(null)
  }

  const getLastMessagePreview = (lastMessage?: string) => {
    if (!lastMessage) return 'Sin mensajes'

    if (lastMessage.startsWith('data:image')) return '🖼️ Imagen'
    if (lastMessage.startsWith('data:audio')) return '🎤 Audio'
    if (lastMessage.startsWith('data:')) return '📎 Archivo'

    return lastMessage
  }

  if (chats.length === 0 || filteredChats.length === 0) {
    return (
      <div className="text-center py-10 rounded-xl bg-gradient-to-b from-[#0A2E6D]/70 to-[#031028]/80 shadow-md ring-1 ring-white/10">
        <p className="text-sm text-white/70">
          {filter === 'archived' ? 'No hay chats archivados' : 'No hay chats'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3 rounded-2xl bg-gradient-to-b from-[#0A2E6D]/90 via-[#061a3d]/95 to-[#031028]/95 p-3 md:p-4 shadow-lg ring-1 ring-white/10">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar chat..."
          className="w-full pl-9 pr-3 py-2.5 bg-white/5 text-white placeholder:text-white/50 rounded-xl border border-white/10 hover:border-white/20 shadow-md backdrop-blur-md outline-none transition-all duration-200 focus:ring-2 focus:ring-[#E21B23]/40 focus:border-[#E21B23]/50"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`text-xs px-3 py-1.5 rounded-full font-semibold tracking-wide transition-all duration-200 ring-1 ${
            filter === 'all'
              ? 'bg-[#E21B23] text-white shadow-md shadow-[#E21B23]/20 ring-[#E21B23]/30'
              : 'bg-white/5 text-white/80 hover:bg-white/10 hover:text-white shadow-sm ring-white/10'
          }`}
        >
          Todos
        </button>

        <button
          onClick={() => setFilter('pinned')}
          className={`text-xs px-3 py-1.5 rounded-full font-semibold tracking-wide transition-all duration-200 ring-1 ${
            filter === 'pinned'
              ? 'bg-[#E21B23] text-white shadow-md shadow-[#E21B23]/20 ring-[#E21B23]/30'
              : 'bg-white/5 text-white/80 hover:bg-white/10 hover:text-white shadow-sm ring-white/10'
          }`}
        >
          Fijados
        </button>

        <button
          onClick={() => setFilter('archived')}
          className={`text-xs px-3 py-1.5 rounded-full font-semibold tracking-wide transition-all duration-200 ring-1 ${
            filter === 'archived'
              ? 'bg-[#E21B23] text-white shadow-md shadow-[#E21B23]/20 ring-[#E21B23]/30'
              : 'bg-white/5 text-white/80 hover:bg-white/10 hover:text-white shadow-sm ring-white/10'
          }`}
        >
          Archivados
        </button>
      </div>

      {/* Chat List */}
      <div className="space-y-2">
        {filteredChats.map((chat) => (
          <div
            key={chat.id}
            onClick={() => setCurrentChatId(chat.id)}
            className={`p-3 rounded-xl cursor-pointer transition-all duration-200 relative group border backdrop-blur-md ${
              currentChatId === chat.id
                ? 'bg-white/10 border-[#E21B23]/40 shadow-lg shadow-black/20'
                : 'bg-white/5 border-white/10 shadow-md shadow-black/10 hover:bg-white/10 hover:border-white/20 hover:shadow-lg'
            }`}
          >
            <div className="flex items-center gap-3 pr-10">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#E21B23]/25 via-white/10 to-[#0A2E6D]/60 text-white flex items-center justify-center flex-shrink-0 text-lg font-semibold shadow-md ring-1 ring-white/15 overflow-hidden">
                {chat.participantPhoto &&
                (chat.participantPhoto.startsWith('http') ||
                  chat.participantPhoto.startsWith('data:image') ||
                  chat.participantPhoto.startsWith('/')) ? (
                  <img
                    src={chat.participantPhoto}
                    alt={chat.participantName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="truncate">
                    {chat.participantPhoto?.length === 1
                      ? chat.participantPhoto
                      : chat.participantName?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {chat.participantName}
                </p>
                <p className="text-xs text-white/80 truncate">
                  {getLastMessagePreview(chat.lastMessage)}
                </p>
              </div>

              {chat.unread > 0 && (
                <div className="w-5 h-5 rounded-full bg-[#E21B23] text-white flex items-center justify-center text-[11px] font-bold flex-shrink-0 shadow-md shadow-[#E21B23]/20 ring-1 ring-white/10">
                  {chat.unread}
                </div>
              )}
            </div>

            {/* Context Menu */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setMenuOpen(menuOpen === chat.id ? null : chat.id)
                }}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-all duration-200 text-white/80 hover:text-white shadow-sm"
              >
                ⋮
              </button>

              {menuOpen === chat.id && (
                <div className="absolute right-0 top-full mt-2 bg-[#061a3d]/95 backdrop-blur-xl rounded-xl shadow-lg shadow-black/30 border border-white/10 z-20 min-w-max overflow-hidden">
                  <button
                    onClick={(e) => handlePin(e, chat.id)}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-white/90 hover:bg-white/10 transition-all duration-200"
                  >
                    {chat.pinned ? (
                      <>
                        <PinOff className="w-4 h-4" />
                        Desfijar
                      </>
                    ) : (
                      <>
                        <Pin className="w-4 h-4" />
                        Fijar
                      </>
                    )}
                  </button>

                  <button
                    onClick={(e) => handleArchive(e, chat.id)}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-white/90 hover:bg-white/10 transition-all duration-200 border-t border-white/10"
                  >
                    <Archive className="w-4 h-4" />
                    {chat.archived ? 'Restaurar' : 'Archivar'}
                  </button>

                  <button
                    onClick={(e) => handleDelete(e, chat.id)}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-[#E21B23] hover:bg-[#E21B23]/10 transition-all duration-200 border-t border-white/10"
                  >
                    <Trash2 className="w-4 h-4" />
                    Eliminar
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}