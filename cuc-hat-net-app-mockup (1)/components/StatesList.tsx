'use client'

import { useApp, State } from '@/contexts/AppContext'
import { Plus, Trash2, Eye, MoreVertical, Volume2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CreateStateModal } from '@/components/modals/CreateStateModal'
import { ConfirmModal } from '@/components/modals/ConfirmModal'
import { StateViewersModal } from '@/components/modals/StateViewersModal'
import { ViewStateModal } from '@/components/modals/ViewStateModal'

type StateFilter = 'all' | 'muted'

export default function StatesList() {
  const { states, setStates, currentUser, mutedContacts, setMutedContacts, showToast, contacts } = useApp()

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedState, setSelectedState] = useState<State | null>(null)
  const [showViewersModal, setShowViewersModal] = useState(false)

  const [showViewModal, setShowViewModal] = useState(false)
  const [viewingState, setViewingState] = useState<State | null>(null)

  const [filter, setFilter] = useState<StateFilter>('all')
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const [stateToDelete, setStateToDelete] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const userStates = states.filter((s) => s.userId === currentUser?.id)
  const allOtherStates = states.filter((s) => s.userId !== currentUser?.id)

  const otherStates =
    filter === 'muted'
      ? allOtherStates.filter((s) => mutedContacts.includes(s.userId))
      : allOtherStates.filter((s) => !mutedContacts.includes(s.userId))

  const handleDeleteState = () => {
    if (stateToDelete) {
      setStates(states.filter((s) => s.id !== stateToDelete))
      showToast('Estado eliminado', 'success')
      setStateToDelete(null)
      setShowDeleteConfirm(false)
    }
  }

  const handleMuteContact = (contactId: string) => {
    if (mutedContacts.includes(contactId)) {
      setMutedContacts(mutedContacts.filter((id) => id !== contactId))
      showToast('Estados reactivados', 'success')
    } else {
      setMutedContacts([...mutedContacts, contactId])
      showToast('Estados silenciados', 'success')
    }
    setMenuOpen(null)
  }

  // Abre estado (tuyo u otro). Si es de otro, marca "visto" (demo).
  const openState = (state: State) => {
    let nextState = state

    if (currentUser?.id && state.userId !== currentUser.id && !state.viewedBy.includes(currentUser.id)) {
      nextState = { ...state, viewedBy: [...state.viewedBy, currentUser.id] }
      setStates((prev) => prev.map((s) => (s.id === state.id ? (nextState as any) : s)))
    }

    setViewingState(nextState)
    setShowViewModal(true)
    setMenuOpen(null)
  }

  return (
    <div className="space-y-4 rounded-2xl bg-gradient-to-b from-[#0A2E6D]/90 via-[#061a3d]/95 to-[#031028]/95 p-3 md:p-4 shadow-lg ring-1 ring-white/10">
      {/* Create State Button */}
      <Button
        onClick={() => setShowCreateModal(true)}
        className="w-full gap-2 bg-[#E21B23] hover:bg-[#E21B23]/90 text-white shadow-md shadow-[#E21B23]/20 rounded-xl transition-all duration-200"
      >
        <Plus className="w-4 h-4" />
        Crear estado
      </Button>

      {/* Filter tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`flex-1 px-3 py-1.5 rounded-full text-sm font-semibold tracking-wide transition-all duration-200 ring-1 ${filter === 'all'
              ? 'bg-[#E21B23] text-white shadow-md shadow-[#E21B23]/20 ring-[#E21B23]/30'
              : 'bg-white/5 text-white/80 hover:bg-white/10 hover:text-white shadow-sm ring-white/10'
            }`}
        >
          Todos
        </button>
        <button
          onClick={() => setFilter('muted')}
          className={`flex-1 px-3 py-1.5 rounded-full text-sm font-semibold tracking-wide transition-all duration-200 ring-1 ${filter === 'muted'
              ? 'bg-[#E21B23] text-white shadow-md shadow-[#E21B23]/20 ring-[#E21B23]/30'
              : 'bg-white/5 text-white/80 hover:bg-white/10 hover:text-white shadow-sm ring-white/10'
            }`}
        >
          Silenciados ({mutedContacts.length})
        </button>
      </div>

      {/* Your States */}
      {userStates.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-white/60 uppercase mb-2 tracking-wider">Tus estados</p>
          <div className="space-y-2">
            {userStates.map((state) => (
              <div
                key={state.id}
                onClick={() => openState(state)}
                className="p-3 bg-white/5 border border-white/10 rounded-xl group hover:bg-white/10 transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg backdrop-blur-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {state.type === 'text' ? (
                      <p className="text-sm text-white break-words font-semibold">{state.content}</p>
                    ) : typeof state.content === 'string' && state.content.startsWith('data:image') ? (
                      <img src={state.content} alt="state" className="h-16 w-full object-cover rounded-xl mt-2 ring-1 ring-white/10" />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-white/10 via-[#0A2E6D]/40 to-[#E21B23]/20 flex items-center justify-center text-2xl shadow-md ring-1 ring-white/10 mt-1">
                        🖼️
                      </div>
                    )}

                    <div className="flex items-center gap-3 mt-2 text-xs text-white/70">
                      <span>👁️ {state.viewedBy.length} visualizaciones</span>
                      <span>⏱️ Expira en 23h</span>
                    </div>
                  </div>

                  <div className="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {/* SOLO tus estados -> ver vistas */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedState(state)
                        setShowViewersModal(true)
                      }}
                      className="p-1.5 hover:bg-white/10 rounded-lg text-white/90 hover:text-white transition-all duration-200 shadow-sm"
                    >
                      <Eye className="w-3 h-3" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setStateToDelete(state.id)
                        setShowDeleteConfirm(true)
                        setMenuOpen(null)
                      }}
                      className="p-1.5 hover:bg-[#E21B23]/15 rounded-lg text-[#E21B23] transition-all duration-200 shadow-sm"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Other States */}
      {otherStates.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-white/60 uppercase mb-2 tracking-wider">
            {filter === 'muted' ? 'Estados silenciados' : 'Estados de contactos'}
          </p>
          <div className="space-y-2">
            {otherStates.map((state) => (
              <div
                key={state.id}
                onClick={() => openState(state)}
                className="p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-200 cursor-pointer group relative shadow-md hover:shadow-lg backdrop-blur-md"
              >
                <div className="flex gap-3 items-start">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#E21B23]/25 via-white/10 to-[#0A2E6D]/60 text-white flex items-center justify-center flex-shrink-0 font-semibold shadow-md ring-1 ring-white/15">
                    {state.userPhoto}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">{state.userName}</p>
                    {state.type === 'text' ? (
                      <p className="text-xs text-white/80 line-clamp-2">{state.content}</p>
                    ) : typeof state.content === 'string' && state.content.startsWith('data:image') ? (
                      <img src={state.content} alt="state" className="h-12 w-full object-cover rounded-xl mt-2 ring-1 ring-white/10" />
                    ) : (
                      <p className="text-xs text-white/70">📷 Imagen</p>
                    )}
                  </div>

                  {/* Menu button */}
                  <div className="relative opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setMenuOpen(menuOpen === state.id ? null : state.id)
                      }}
                      className="p-1.5 hover:bg-white/10 rounded-lg transition-all duration-200"
                    >
                      <MoreVertical className="w-4 h-4 text-white/70" />
                    </button>

                    {menuOpen === state.id && (
                      <div className="absolute right-0 top-full mt-2 bg-[#061a3d]/95 backdrop-blur-xl rounded-xl shadow-lg shadow-black/30 border border-white/10 z-10 min-w-max overflow-hidden">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleMuteContact(state.userId)
                          }}
                          className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-white/90 hover:bg-white/10 transition-all duration-200"
                        >
                          <Volume2 className="w-4 h-4" />
                          {mutedContacts.includes(state.userId) ? 'Reactivar' : 'Silenciar'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No States */}
      {states.length === 0 && (
        <div className="text-center py-10 rounded-2xl bg-white/5 shadow-md ring-1 ring-white/10">
          <div className="text-4xl mb-3">👁️</div>
          <p className="font-semibold text-white mb-1">No hay estados</p>
          <p className="text-sm text-white/70">Comparte un estado para que tus contactos te vean</p>
        </div>
      )}

      {/* Viewers Modal (solo para tus estados, desde el botón 👁️) */}
      <StateViewersModal
        isOpen={showViewersModal}
        onClose={() => {
          setShowViewersModal(false)
          setSelectedState(null)
        }}
        state={selectedState}
        contacts={contacts}
      />

      {/* View State Modal (para ver estado) */}
      <ViewStateModal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false)
          setViewingState(null)
        }}
        state={viewingState}
      />

      <CreateStateModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Eliminar estado"
        message="¿Estás seguro de que deseas eliminar este estado? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        isDangerous={true}
        onConfirm={handleDeleteState}
        onCancel={() => {
          setShowDeleteConfirm(false)
          setStateToDelete(null)
        }}
      />
    </div>
  )
}
