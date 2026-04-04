'use client'

import { useApp } from '@/contexts/AppContext'
import { Search, Trash2, Users, Info } from 'lucide-react'
import { useState } from 'react'
import { GroupInfoModal } from '@/components/modals/GroupInfoModal'

export default function GroupsList() {
  const { groups, setGroups, setCurrentGroupId, currentGroupId, chats, setChats, showToast, setCurrentChatId, currentChatId } = useApp()
  const [searchTerm, setSearchTerm] = useState('')
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)

  const filteredGroups = groups.filter((group) => group.name.toLowerCase().includes(searchTerm.toLowerCase()))

  const handleDeleteGroup = (groupId: string) => {
    setGroups(groups.filter((g) => g.id !== groupId))
    setChats(chats.filter((c) => c.id !== groupId))
    if (currentGroupId === groupId) setCurrentGroupId(null)
    showToast('Grupo eliminado', 'success')
    setMenuOpen(null)
  }

  if (groups.length === 0) {
    return (
      <div className="text-center py-10 rounded-2xl bg-gradient-to-b from-[#0A2E6D]/70 to-[#031028]/80 shadow-md ring-1 ring-white/10">
        <div className="text-4xl mb-3">👥</div>
        <p className="font-semibold text-white mb-1">No hay grupos</p>
        <p className="text-sm text-white/70">Crea o únete a un grupo para comenzar</p>
      </div>
    )
  }

  return (
    <div className="space-y-3 rounded-2xl bg-gradient-to-b from-[#0A2E6D]/90 via-[#061a3d]/95 to-[#031028]/95 p-3 md:p-4 shadow-lg ring-1 ring-white/10">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar grupo..."
          className="w-full pl-9 pr-3 py-2.5 bg-white/5 text-white placeholder:text-white/50 rounded-xl border border-white/10 hover:border-white/20 shadow-md backdrop-blur-md outline-none transition-all duration-200 focus:ring-2 focus:ring-[#E21B23]/40 focus:border-[#E21B23]/50"
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
            className={`p-3 rounded-xl cursor-pointer transition-all duration-200 relative group border backdrop-blur-md ${currentChatId === group.id
                ? 'bg-white/10 border-[#E21B23]/40 shadow-lg shadow-black/20'
                : 'bg-white/5 border-white/10 shadow-md shadow-black/10 hover:bg-white/10 hover:border-white/20 hover:shadow-lg'
              }`}
          >
            <div className="flex gap-3 items-center">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#E21B23]/25 via-white/10 to-[#0A2E6D]/60 text-white flex items-center justify-center flex-shrink-0 text-lg font-semibold overflow-hidden shadow-md ring-1 ring-white/15">
                {group.photo?.startsWith('data:') ? (
                  <img src={group.photo} alt={group.name} className="w-full h-full object-cover" />
                ) : (
                  group.photo || '👥'
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-white truncate">{group.name}</p>
                <div className="flex items-center gap-1 text-xs text-white/70">
                  <Users className="w-3 h-3" />
                  {group.members.length} miembros
                </div>
              </div>
            </div>

            {/* Context Menu */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setMenuOpen(menuOpen === group.id ? null : group.id)
                }}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-all duration-200 text-white/80 hover:text-white shadow-sm"
              >
                ⋮
              </button>
              {menuOpen === group.id && (
                <div className="absolute right-0 top-full mt-2 bg-[#061a3d]/95 backdrop-blur-xl rounded-xl shadow-lg shadow-black/30 border border-white/10 z-20 min-w-max overflow-hidden">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedGroup(group.id)
                      setMenuOpen(null)
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-white/90 hover:bg-white/10 transition-all duration-200 border-0 border-b border-white/10"
                  >
                    <Info className="w-4 h-4" />
                    Ver información
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteGroup(group.id)
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-[#E21B23] hover:bg-[#E21B23]/10 rounded-lg transition-all duration-200 border-0"
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

      {/* Group Info Modal */}
      <GroupInfoModal
        isOpen={!!selectedGroup}
        onClose={() => setSelectedGroup(null)}
        group={groups.find((g) => g.id === selectedGroup) || null}
      />
    </div>
  )
}
