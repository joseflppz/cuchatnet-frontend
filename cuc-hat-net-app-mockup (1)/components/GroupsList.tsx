'use client'

import { useEffect, useState, useCallback } from 'react'
import { useApp } from '@/contexts/AppContext'
import { Search, Trash2, Users, Info, Loader2, AlertTriangle } from 'lucide-react'
import { GroupInfoModal } from '@/components/modals/GroupInfoModal'
import { getMyGroups } from '@/lib/api'

export default function GroupsList() {
  const { 
    groups, 
    setGroups, 
    setCurrentGroupId, 
    chats, 
    setChats, 
    showToast, 
    setCurrentChatId, 
    currentChatId,
    currentUser
  } = useApp()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null) // Para ver el error en pantalla

  const loadGroups = useCallback(async () => {
    const userStorage = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {}
    const rawId = currentUser?.id || userStorage.id || userStorage.usuarioId;
    const userId = Number(rawId);

    if (!userId || isNaN(userId)) {
      setErrorMessage("No se encontró un ID de usuario válido en la sesión.");
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setErrorMessage(null) // Limpiar errores previos
      const data = await getMyGroups(userId)

      if (data && Array.isArray(data)) {
        const userGroups = data
          .filter((chat: any) => chat.isGroup === true)
          .map((g: any) => ({
            id: (g.chatId || g.id).toString(),
            name: g.name || 'Grupo sin nombre', 
            photo: g.photoUrl || '',
            description: g.description || 'Sin descripción',
            members: g.participantes || [],
            createdAt: g.lastMessageTime || new Date().toISOString(),
            creatorId: (g.creatorId || '').toString(),
            permissions: {
              sendMessages: 'all' as const,
              editInfo: 'admins' as const
            }
          }))

        setGroups(userGroups)
      }
    } catch (error: any) {
      // --- AQUÍ ESTÁ EL TRUCO PARA VER EL ERROR REAL ---
      const serverError = error.response?.data?.error || error.message || "Error desconocido";
      setErrorMessage(`Error del servidor: ${serverError}`);
      console.error("Detalle del error:", error);
      showToast(`Error: ${serverError}`, "error");
    } finally {
      setLoading(false)
    }
  }, [currentUser?.id, setGroups, showToast])

  useEffect(() => {
    loadGroups()
  }, [loadGroups])

  // ... (resto de funciones de filtrado y eliminar se mantienen igual)

  const filteredGroups = groups.filter((group) => 
    (group?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  // SI HAY ERROR, MOSTRAR ESTE MENSAJE EN PANTALLA
  if (errorMessage) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
        <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <p className="text-red-500 text-sm font-mono">{errorMessage}</p>
        <button 
          onClick={loadGroups}
          className="mt-3 text-xs bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition-colors"
        >
          Reintentar
        </button>
      </div>
    )
  }

  if (loading && groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-white/70 bg-white/5 rounded-2xl border border-white/10">
        <Loader2 className="w-10 h-10 animate-spin mb-4 text-[#E21B23]" />
        <p className="text-sm font-medium animate-pulse">Sincronizando grupos...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Input de búsqueda */}
      <div className="relative group p-1">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-[#E21B23]" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar grupos..."
          className="w-full pl-10 pr-4 py-2.5 bg-white/5 text-white rounded-xl border border-white/10 outline-none focus:ring-2 focus:ring-[#E21B23]/30 transition-all"
        />
      </div>

      {/* Lista de grupos */}
      <div className="space-y-2 max-h-[60vh] overflow-y-auto custom-scrollbar pr-1">
        {filteredGroups.length === 0 && !loading ? (
           <p className="text-center text-white/30 text-sm py-10">No perteneces a ningún grupo aún.</p>
        ) : (
          filteredGroups.map((group) => (
            <div
              key={group.id}
              onClick={() => {
                setCurrentChatId(group.id)
                setCurrentGroupId(group.id)
              }}
              className={`p-3 rounded-xl cursor-pointer transition-all border ${
                currentChatId === group.id
                  ? 'bg-gradient-to-r from-[#E21B23]/20 to-transparent border-[#E21B23]/40 translate-x-1'
                  : 'bg-white/5 border-transparent hover:bg-white/10'
              }`}
            >
              {/* Contenido del grupo igual que antes... */}
              <div className="flex gap-3 items-center">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#E21B23] to-[#0A2E6D] flex items-center justify-center text-white font-bold border-2 border-white/10 overflow-hidden shrink-0">
                  {group.photo ? <img src={group.photo} alt="" className="w-full h-full object-cover" /> : group.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-white truncate">{group.name}</p>
                  <p className="text-[11px] text-white/50 truncate">{group.description}</p>
                </div>
                {/* Botón de menú ⋮ */}
              </div>
            </div>
          ))
        )}
      </div>

      <GroupInfoModal 
        isOpen={!!selectedGroup} 
        onClose={() => setSelectedGroup(null)} 
        group={groups.find(g => g.id === selectedGroup) || null} 
      />
    </div>
  )
}