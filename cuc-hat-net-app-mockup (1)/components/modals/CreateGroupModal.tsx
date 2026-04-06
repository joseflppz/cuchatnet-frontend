'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useApp, Contact } from '@/contexts/AppContext'
import { X, Check, Loader2, Plus } from 'lucide-react'
import { createGroupApi } from '@/lib/api' 

interface CreateGroupModalProps {
  isOpen: boolean
  onClose: () => void
  contacts: Contact[]
}

export function CreateGroupModal({ isOpen, onClose, contacts }: CreateGroupModalProps) {
  const { createGroupChat, showToast } = useApp()
  const [groupName, setGroupName] = useState('')
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [groupDescription, setGroupDescription] = useState('')
  const [groupPhoto, setGroupPhoto] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const handleToggleContact = (contactId: string) => {
    setSelectedContacts((prev) =>
      prev.includes(contactId) ? prev.filter((id) => id !== contactId) : [...prev, contactId]
    )
  }

  const handleCreateGroup = async () => {
    // Validaciones iniciales
    if (!groupName.trim()) {
      showToast('Escribe un nombre para el grupo', 'error')
      return
    }
    if (selectedContacts.length === 0) {
      showToast('Selecciona al menos un miembro', 'error')
      return
    }

    setIsCreating(true)
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      const currentUserId = user.usuarioId

      if (!currentUserId) {
        showToast('Error: Usuario no identificado', 'error')
        setIsCreating(false)
        return
      }

      // Estructura exacta solicitada para https://localhost:7086/api/chats
      const payload = {
        userId: Number(currentUserId),
        participantesIds: selectedContacts.map(id => Number(id)),
        esGrupo: true,
        nombreGrupo: groupName
      }

      // 1. Guardar en SQL a través de la API
      await createGroupApi(payload)

      // 2. Actualizar el estado local en el Contexto
      // Nota: Pasamos los datos que tu createGroupChat espera normalmente
      createGroupChat(
        groupName, 
        selectedContacts, 
        groupPhoto || '👥', 
        groupDescription
      )
      
      showToast(`Grupo "${groupName}" creado correctamente`, 'success')
      
      // Reset de estados y cerrar
      setGroupName('')
      setGroupDescription('')
      setSelectedContacts([])
      onClose()
    } catch (error) {
      console.error("Error al crear grupo:", error)
      showToast('No se pudo guardar el grupo en el servidor', 'error')
    } finally {
      setIsCreating(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-border">
        
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex flex-col">
            <h2 className="font-bold text-lg text-foreground">Crear Nuevo Grupo</h2>
            <p className="text-xs text-muted-foreground">Configura los detalles de tu grupo</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
            <X className="w-5 h-5 text-foreground/60" />
          </button>
        </div>

        <div className="p-5 space-y-6 overflow-y-auto custom-scrollbar">
          {/* Foto y Nombre */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full bg-primary/5 flex items-center justify-center border-2 border-dashed border-primary/20 overflow-hidden transition-all group-hover:border-primary/40">
                {groupPhoto ? (
                  <img src={groupPhoto} alt="group" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl">👥</span>
                )}
              </div>
              <label className="absolute bottom-1 right-1 bg-primary p-2 rounded-full cursor-pointer shadow-lg hover:scale-110 active:scale-95 transition-all">
                <input type="file" accept="image/*" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if(file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => setGroupPhoto(ev.target?.result as string);
                    reader.readAsDataURL(file);
                  }
                }} className="hidden" />
                <Plus className="w-4 h-4 text-white" />
              </label>
            </div>
            
            <div className="w-full space-y-1.5">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Nombre del grupo</label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Ej: Equipo de Desarrollo"
                className="w-full border border-border rounded-xl px-4 py-3 bg-muted/20 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all outline-none"
              />
            </div>
          </div>

          {/* Descripción */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Descripción (Opcional)</label>
            <textarea
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value)}
              placeholder="¿De qué trata este grupo?"
              rows={2}
              className="w-full border border-border rounded-xl px-4 py-3 bg-muted/20 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all outline-none resize-none"
            />
          </div>

          {/* Miembros */}
          <div className="space-y-3">
            <div className="flex items-center justify-between ml-1">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Añadir Miembros</label>
              <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                {selectedContacts.length} seleccionados
              </span>
            </div>
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-2 custom-scrollbar border border-border/50 rounded-xl p-2 bg-muted/5">
              {contacts.length > 0 ? (
                contacts.map((contact) => (
                  <div
                    key={contact.id}
                    onClick={() => handleToggleContact(contact.id)}
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${
                      selectedContacts.includes(contact.id)
                        ? 'bg-primary/10 border border-primary/20 shadow-sm'
                        : 'border border-transparent hover:bg-muted/50'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors border ${
                      selectedContacts.includes(contact.id) ? 'bg-primary border-primary' : 'border-muted-foreground/30 bg-white'
                    }`}>
                      {selectedContacts.includes(contact.id) && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-xs font-bold border border-primary/10">
                      {contact.photo}
                    </div>
                    <span className="text-sm font-medium text-foreground">{contact.name}</span>
                  </div>
                ))
              ) : (
                <p className="text-center text-xs text-muted-foreground py-4">No hay contactos disponibles</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted/10 flex gap-3">
          <Button 
            onClick={onClose} 
            variant="ghost" 
            className="flex-1 rounded-xl text-muted-foreground hover:text-foreground"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleCreateGroup}
            disabled={isCreating}
            className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg shadow-primary/20 transition-all font-semibold"
          >
            {isCreating ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creando...</span>
              </div>
            ) : (
              'Crear Grupo'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}