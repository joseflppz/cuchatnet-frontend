'use client'

import { useEffect, useState, useRef } from 'react'
import { useApp } from '@/contexts/AppContext'
import { Search, Trash2, Users, Info, Loader2 } from 'lucide-react'
import { GroupInfoModal } from '@/components/modals/GroupInfoModal'
import { getMyGroups } from '@/lib/api'

export default function GroupsList() {
  const { 
    groups, 
    setGroups, 
    setCurrentGroupId, 
    currentGroupId, 
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
  
  // Usamos una referencia para evitar llamadas duplicadas innecesarias
  const isFetched = useRef(false)

  useEffect(() => {
    // 1. Obtenemos el ID del usuario
    const userStorage = JSON.parse(localStorage.getItem('user') || '{}')
    const userId = currentUser?.id || userStorage.usuarioId || userStorage.id

    if (!userId) {
      setLoading(false)
      return
    }

    async function loadGroups() {
      try {
        setLoading(true)
        console.log("Solicitando grupos para el usuario:", userId)
        
        const data = await getMyGroups(Number(userId))
        console.log("Respuesta del servidor:", data)

        if (data && Array.isArray(data)) {
          const userGroups = data
            .filter((chat: any) => 
              chat.esGrupo === true || 
              chat.EsGrupo === true || 
              chat.esGrupo === 1 || 
              chat.EsGrupo === 1
            )
            .map((g: any) => ({
              // Mapeo flexible para ChatId o id
              id: (g.chatId || g.ChatId || g.id).toString(),
              name: g.nombreGrupo || g.Nombre || g.nombre || 'Grupo sin nombre', 
              photo: g.fotoUrl || '👥',
              description: g.descripcion || '',
              members: g.participantesIds || [],
              createdAt: g.fechaCreacion || new Date().toISOString(),
              creatorId: (g.creadorId || g.userId || '').toString(),
              permissions: {
                sendMessages: 'all' as const,
                editInfo: 'admins' as const
              }
            }))

          setGroups(userGroups)
        }
      } catch (error) {
        console.error("Error cargando grupos:", error)
        showToast("Error al conectar con el servidor", "error")
      } finally {
        setLoading(false)
      }
    }

    loadGroups()

    // IMPORTANTE: Quitamos 'setGroups' y 'showToast' de las dependencias 
    // para que no se dispare el bucle infinito que viste en la consola.
  }, [currentUser?.id]) 

  const filteredGroups = groups.filter((group) => {
    const safeName = group?.name || ''
    return safeName.toLowerCase().includes(searchTerm.toLowerCase())
  })

  const handleDeleteGroup = (groupId: string) => {
    setGroups(groups.filter((g) => g.id !== groupId))
    setChats(chats.filter((c) => c.id !== groupId))
    if (currentGroupId === groupId) setCurrentGroupId(null)
    showToast('Grupo eliminado', 'success')
    setMenuOpen(null)
  }

  if (loading && groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-white/70">
        <Loader2 className="w-8 h-8 animate-spin mb-2 text-[#E21B23]" />
        <p className="text-sm">Sincronizando grupos...</p>
      </div>
    )
  }

  if (groups.length === 0) {
    return (
      <div className="text-center py-10 rounded-2xl bg-[#0A2E6D]/20 border border-white/5 shadow-inner">
        <div className="text-4xl mb-3">👥</div>
        <p className="font-semibold text-white mb-1">No se encontraron grupos</p>
        <p className="text-sm text-white/50 px-4 text-balance">
          Asegúrate de que el usuario tenga grupos asignados en la base de datos.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3 rounded-2xl bg-white/5 p-4 shadow-lg ring-1 ring-white/10">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar grupo..."
          className="w-full pl-9 pr-3 py-2 bg-white/5 text-white placeholder:text-white/40 rounded-xl border border-white/10 outline-none focus:ring-2 focus:ring-[#E21B23]/40"
        />
      </div>

      <div className="space-y-2">
        {filteredGroups.map((group) => (
          <div
            key={group.id}
            onClick={() => {
              setCurrentGroupId(group.id)
              setCurrentChatId(group.id)
            }}
            className={`p-3 rounded-xl cursor-pointer transition-all duration-200 relative group border ${
              currentChatId === group.id
                ? 'bg-white/15 border-[#E21B23]/40 shadow-lg'
                : 'bg-white/5 border-white/5 hover:bg-white/10'
            }`}
          >
            <div className="flex gap-3 items-center">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#E21B23]/20 to-[#0A2E6D]/40 flex items-center justify-center text-white font-bold border border-white/10 overflow-hidden shadow-sm">
                {group.photo && group.photo.length > 2 ? (
                  <img src={group.photo} alt={group.name} className="w-full h-full object-cover" />
                ) : (
                  <span>{group.photo || '👥'}</span>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-white truncate">{group.name}</p>
                <div className="flex items-center gap-1 text-xs text-white/60">
                  <Users className="w-3 h-3" />
                  {group.members?.length || 0} miembros
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setMenuOpen(menuOpen === group.id ? null : group.id)
                }}
                className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-white/10 rounded-lg transition-all text-white/80"
              >
                ⋮
              </button>
            </div>

            {menuOpen === group.id && (
              <div className="absolute right-2 top-12 bg-[#061a3d] rounded-xl shadow-2xl border border-white/10 z-50 min-w-[140px] overflow-hidden">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedGroup(group.id)
                    setMenuOpen(null)
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-xs text-white/90 hover:bg-white/10 border-b border-white/5"
                >
                  <Info className="w-3.5 h-3.5 text-blue-400" />
                  Información
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteGroup(group.id)
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-xs text-[#E21B23] hover:bg-[#E21B23]/10"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Eliminar
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <GroupInfoModal
        isOpen={!!selectedGroup}
        onClose={() => setSelectedGroup(null)}
        group={groups.find((g) => g.id === selectedGroup) || null}
      />
    </div>
  )
}