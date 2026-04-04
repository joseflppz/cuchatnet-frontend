'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useApp, Contact } from '@/contexts/AppContext'
import { X, Check } from 'lucide-react'

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

  const handleToggleContact = (contactId: string) => {
    setSelectedContacts((prev) =>
      prev.includes(contactId) ? prev.filter((id) => id !== contactId) : [...prev, contactId]
    )
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      setGroupPhoto(event.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleCreateGroup = () => {
    if (!groupName.trim()) {
      showToast('Escribe un nombre para el grupo', 'error')
      return
    }
    if (selectedContacts.length === 0) {
      showToast('Selecciona al menos un contacto', 'error')
      return
    }

    createGroupChat(groupName, selectedContacts, groupPhoto || '👥', groupDescription)
    showToast(`Grupo "${groupName}" creado`, 'success')
    
    setGroupName('')
    setGroupDescription('')
    setSelectedContacts([])
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-border p-4 flex items-center justify-between">
          <h2 className="font-bold text-lg text-foreground">Crear Grupo</h2>
          <button onClick={onClose} className="text-foreground/60 hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Foto del grupo (opcional)</label>
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border-2 border-dashed border-border">
                {groupPhoto ? (
                  <img src={groupPhoto} alt="group" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-2xl">👥</span>
                )}
              </div>
              <label className="text-xs">
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                <span className="text-blue-600 hover:text-blue-700 cursor-pointer">Cambiar foto</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Nombre del grupo</label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="ej. Proyecto Final"
              maxLength={50}
              className="w-full border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <p className="text-xs text-muted-foreground mt-1">{groupName.length}/50</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Descripción (opcional)</label>
            <textarea
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value.slice(0, 100))}
              placeholder="Describe el propósito del grupo..."
              maxLength={100}
              rows={2}
              className="w-full border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            />
            <p className="text-xs text-muted-foreground mt-1">{groupDescription.length}/100</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Miembros ({selectedContacts.length})</label>
            <div className="space-y-2 max-h-64 overflow-y-auto border border-border rounded-lg p-3">
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  onClick={() => handleToggleContact(contact.id)}
                  className={`p-2 rounded cursor-pointer transition ${
                    selectedContacts.includes(contact.id)
                      ? 'bg-primary/10 border border-primary/30'
                      : 'border border-border hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {selectedContacts.includes(contact.id) && (
                      <div className="w-5 h-5 rounded bg-primary flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                    {!selectedContacts.includes(contact.id) && (
                      <div className="w-5 h-5 rounded border-2 border-border" />
                    )}
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-semibold">
                      {contact.photo}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{contact.name}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={onClose} variant="outline" className="flex-1 border-border text-foreground hover:bg-muted">
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateGroup}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Crear Grupo
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
