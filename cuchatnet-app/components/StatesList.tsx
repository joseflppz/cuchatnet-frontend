'use client'

import { useApp, State } from '@/contexts/AppContext'
import { Plus, Trash2, Eye, MoreVertical, Volume2, Video } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { CreateStateModal } from '@/components/modals/CreateStateModal'
import { ConfirmModal } from '@/components/modals/ConfirmModal'
import { StateViewersModal } from '@/components/modals/StateViewersModal'
import { ViewStateModal } from '@/components/modals/ViewStateModal'
import { getStatesFeed, viewState, deleteState } from '@/lib/api'

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

  const currentUserId = currentUser?.id?.toString().trim();

  useEffect(() => {
    if (!currentUserId) return;

    const fetchFeed = async () => {
      try {
        const data = await getStatesFeed(currentUserId);
        const mappedStates = data.map((s: any) => ({
          id: s.id.toString(),
          userId: s.userId.toString().trim(),
          userName: s.userName,
          userPhoto: s.userPhoto || s.userName?.charAt(0).toUpperCase() || '?',
          content: s.content,
          type: s.type, 
          createdAt: s.createdAt,
          viewedBy: s.viewedBy || []
        }));
        setStates(mappedStates);
      } catch (error) {
        console.error("Error al cargar estados:", error);
      }
    };

    fetchFeed();
    const interval = setInterval(fetchFeed, 60000);
    return () => clearInterval(interval);
  }, [currentUserId, setStates]);

  const userStates = states.filter((s) => s.userId === currentUserId)
  const allOtherStates = states.filter((s) => s.userId !== currentUserId)

  const otherStates =
    filter === 'muted'
      ? allOtherStates.filter((s) => mutedContacts.includes(s.userId))
      : allOtherStates.filter((s) => !mutedContacts.includes(s.userId))

  const handleDeleteState = async () => {
    if (stateToDelete) {
      try {
        await deleteState(stateToDelete);
        setStates(states.filter((s) => s.id !== stateToDelete))
        showToast('Estado eliminado', 'success')
      } catch (error) {
        showToast('Error al eliminar en servidor', 'error')
      } finally {
        setStateToDelete(null)
        setShowDeleteConfirm(false)
      }
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

  const openState = async (state: State) => {
    setViewingState(state)
    setShowViewModal(true)
    setMenuOpen(null)

    if (currentUserId && state.userId !== currentUserId && !state.viewedBy.includes(currentUserId)) {
      try {
        await viewState(state.id, currentUserId);
        setStates((prev) => prev.map((s) => 
          s.id === state.id ? { ...s, viewedBy: [...s.viewedBy, currentUserId] } : s
        ))
      } catch (error) {
        console.error("No se pudo registrar la visualización");
      }
    }
  }

  return (
    <div className="space-y-4 rounded-2xl bg-gradient-to-b from-[#0A2E6D]/90 via-[#061a3d]/95 to-[#031028]/95 p-3 md:p-4 shadow-lg ring-1 ring-white/10">
      <Button
        onClick={() => setShowCreateModal(true)}
        className="w-full gap-2 bg-[#E21B23] hover:bg-[#E21B23]/90 text-white shadow-md shadow-[#E21B23]/20 rounded-xl transition-all duration-200"
      >
        <Plus className="w-4 h-4" />
        Crear estado
      </Button>

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
                    ) : state.type === 'video' ? (
                      <div className="relative h-16 w-full mt-2 rounded-xl overflow-hidden ring-1 ring-white/10 bg-black flex items-center justify-center">
                        <video src={state.content} className="h-full w-full object-cover opacity-60" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-white/20 p-1 rounded-full backdrop-blur-sm">
                            <Video className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <img src={state.content} alt="state" className="h-16 w-full object-cover rounded-xl mt-2 ring-1 ring-white/10" />
                    )}

                    <div className="flex items-center gap-3 mt-2 text-xs text-white/70">
                      <span>👁️ {state.viewedBy.length} visualizaciones</span>
                      <span>⏱️ Expira en 24h</span>
                    </div>
                  </div>

                  <div className="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedState(state)
                        setShowViewersModal(true)
                      }}
                      className="p-1.5 hover:bg-white/10 rounded-lg text-white/90 hover:text-white transition-all duration-200"
                    >
                      <Eye className="w-3 h-3" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setStateToDelete(state.id)
                        setShowDeleteConfirm(true)
                      }}
                      className="p-1.5 hover:bg-[#E21B23]/15 rounded-lg text-[#E21B23] transition-all duration-200"
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
                  
                  {/* AVATAR CORREGIDO CON NULL-CHECKS PARA TYPESCRIPT */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#E21B23]/25 via-white/10 to-[#0A2E6D]/60 text-white flex items-center justify-center flex-shrink-0 font-semibold shadow-md ring-1 ring-white/15 overflow-hidden">
                    {state.userPhoto && state.userPhoto.length > 2 ? (
                      <img 
                        src={state.userPhoto} 
                        alt={state.userName} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if(parent) parent.innerHTML = state.userName?.charAt(0).toUpperCase() || '?';
                        }}
                      />
                    ) : (
                      <span>{state.userPhoto || state.userName?.charAt(0).toUpperCase() || '?'}</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">{state.userName}</p>
                    {state.type === 'text' ? (
                      <p className="text-xs text-white/80 line-clamp-2">{state.content}</p>
                    ) : state.type === 'video' ? (
                      <div className="relative h-12 w-full mt-2 rounded-xl overflow-hidden ring-1 ring-white/10 bg-black flex items-center justify-center">
                        <video src={state.content} className="h-full w-full object-cover opacity-50" />
                        <Video className="absolute w-4 h-4 text-white/80" />
                      </div>
                    ) : (
                      <img src={state.content} alt="state" className="h-12 w-full object-cover rounded-xl mt-2 ring-1 ring-white/10" />
                    )}
                  </div>

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
                      <div className="absolute right-0 top-full mt-2 bg-[#061a3d]/95 backdrop-blur-xl rounded-xl shadow-lg border border-white/10 z-50 min-w-[160px] overflow-hidden">
                        {state.userId.toString().trim() === currentUserId ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setStateToDelete(state.id);
                              setShowDeleteConfirm(true);
                              setMenuOpen(null);
                            }}
                            className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-[#E21B23] hover:bg-white/10 transition-all duration-200"
                          >
                            <Trash2 className="w-4 h-4" />
                            Eliminar estado
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMuteContact(state.userId);
                            }}
                            className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-white/90 hover:bg-white/10 transition-all duration-200"
                          >
                            <Volume2 className="w-4 h-4" />
                            {mutedContacts.includes(state.userId) ? 'Reactivar' : 'Silenciar'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODALES */}
      <StateViewersModal
        isOpen={showViewersModal}
        onClose={() => { setShowViewersModal(false); setSelectedState(null); }}
        state={selectedState}
        contacts={contacts}
      />
      <ViewStateModal
        isOpen={showViewModal}
        onClose={() => { setShowViewModal(false); setViewingState(null); }}
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
        onCancel={() => { setShowDeleteConfirm(false); setStateToDelete(null); }}
      />
    </div>
  )
}