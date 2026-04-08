'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useApp, Group, Contact } from '@/contexts/AppContext'
import { X, Plus, Trash2, Shield, AlertCircle } from 'lucide-react'

interface GroupInfoModalProps {
  isOpen: boolean
  onClose: () => void
  group: Group | null
}

export function GroupInfoModal({ isOpen, onClose, group }: GroupInfoModalProps) {
  const { setGroups, groups, showToast, contacts, setCurrentChatId, currentUser, chats, setChats } = useApp()
  const [editMode, setEditMode] = useState(false)
  const [editName, setEditName] = useState(group?.name || '')
  const [editDescription, setEditDescription] = useState(group?.description || '')
  const [editRules, setEditRules] = useState(group?.rules || '')
  const [editPhoto, setEditPhoto] = useState(group?.photo || '')
  const [showMemberPicker, setShowMemberPicker] = useState(false)
  const [selectedNewMembers, setSelectedNewMembers] = useState<string[]>([])
  const [showPermissions, setShowPermissions] = useState(false)
  const [permissions, setPermissions] = useState({
    sendMessages: group?.permissions?.sendMessages || 'all',
    editInfo: group?.permissions?.editInfo || 'admins',
  })

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target?.result as string
      setEditPhoto(base64)
      showToast('Foto actualizada', 'info')
    }
    reader.readAsDataURL(file)
  }

  if (!isOpen || !group) return null

  const handleSaveChanges = () => {
    const updatedGroup = {
      ...group,
      name: editName,
      description: editDescription,
      rules: editRules,
      photo: editPhoto,
      permissions,
    }
    setGroups(groups.map((g) => (g.id === group.id ? updatedGroup : g)))

    // Update corresponding chat with new photo and name
    setChats(
      chats.map((chat) =>
        chat.participantId === group.id
          ? {
              ...chat,
              participantName: editName,
              participantPhoto: editPhoto,
            }
          : chat
      )
    )

    showToast('Grupo actualizado', 'success')
    setEditMode(false)
  }

  const handleAddMembers = () => {
    if (selectedNewMembers.length === 0) {
      showToast('Selecciona al menos un contacto', 'error')
      return
    }

    const newMembers = selectedNewMembers
      .map((memberId) => {
        const contact = contacts.find((c) => c.id === memberId)
        return contact
          ? {
              id: memberId,
              name: contact.name,
              role: 'member' as const,
            }
          : null
      })
      .filter(Boolean) as typeof group.members

    const updatedGroup = {
      ...group,
      members: [...group.members, ...newMembers],
    }

    setGroups(groups.map((g) => (g.id === group.id ? updatedGroup : g)))
    showToast(`${selectedNewMembers.length} miembro(s) agregado(s)`, 'success')
    setSelectedNewMembers([])
    setShowMemberPicker(false)
  }

  const handleRemoveMember = (memberId: string) => {
    const updatedGroup = {
      ...group,
      members: group.members.filter((m) => m.id !== memberId),
    }
    setGroups(groups.map((g) => (g.id === group.id ? updatedGroup : g)))
    showToast('Miembro removido', 'success')
  }

  const handleToggleAdmin = (memberId: string) => {
    const updatedMembers = group.members.map((m) =>
      m.id === memberId
        ? { ...m, role: m.role === 'admin' ? 'member' : 'admin' }
        : m
    )
    const updatedGroup = {
      ...group,
      members: updatedMembers,
    }
    setGroups(groups.map((g) => (g.id === group.id ? updatedGroup : g)))
    const member = group.members.find((m) => m.id === memberId)
    const newRole = group.members.find((m) => m.id === memberId)?.role === 'admin' ? 'member' : 'admin'
    showToast(
      `${member?.name} ahora es ${newRole === 'admin' ? 'administrador' : 'miembro'}`,
      'success'
    )
  }

  const availableContacts = contacts.filter(
    (c) => !group.members.some((m) => m.id === c.id)
  )

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-border p-4 flex items-center justify-between">
          <h2 className="font-bold text-lg text-foreground">Información del Grupo</h2>
          <button onClick={onClose} className="text-foreground/60 hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Group Header */}
          <div className="text-center pb-4 border-b border-border">
            <div className="relative w-20 h-20 rounded-full bg-primary/20 text-primary flex items-center justify-center text-4xl mx-auto mb-3 overflow-hidden group">
              {editPhoto.startsWith('data:') ? (
                <img src={editPhoto} alt="group" className="w-full h-full object-cover" />
              ) : (
                editPhoto || group.photo
              )}
              {editMode && (
                <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  <span className="text-white text-xs font-medium">Cambiar</span>
                </label>
              )}
            </div>
            {!editMode ? (
              <div>
                <h3 className="text-2xl font-bold text-foreground">{group.name}</h3>
                {group.description && (
                  <p className="text-sm text-muted-foreground mt-1">{group.description}</p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Nombre del grupo"
                  maxLength={50}
                  className="w-full border border-border rounded-lg px-3 py-2 text-foreground text-lg font-bold text-center focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value.slice(0, 100))}
                  placeholder="Descripción (opcional)"
                  maxLength={100}
                  rows={2}
                  className="w-full border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                />
              </div>
            )}
          </div>

          {/* Members Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-foreground">Miembros ({group.members.length})</h3>
              {editMode && (
                <button
                  onClick={() => setShowMemberPicker(!showMemberPicker)}
                  className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Agregar
                </button>
              )}
            </div>

            {showMemberPicker && editMode && (
              <div className="border border-border rounded-lg p-3 mb-3 max-h-40 overflow-y-auto bg-muted/50">
                {availableContacts.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    Todos los contactos ya están en el grupo
                  </p>
                ) : (
                  <div className="space-y-2">
                    {availableContacts.map((contact) => (
                      <label
                        key={contact.id}
                        className="flex items-center gap-2 p-2 hover:bg-white rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedNewMembers.includes(contact.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedNewMembers([...selectedNewMembers, contact.id])
                            } else {
                              setSelectedNewMembers(
                                selectedNewMembers.filter((id) => id !== contact.id)
                              )
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm text-foreground">{contact.name}</span>
                      </label>
                    ))}
                  </div>
                )}
                {selectedNewMembers.length > 0 && (
                  <button
                    onClick={handleAddMembers}
                    className="w-full mt-2 p-2 bg-primary text-primary-foreground text-sm rounded font-medium hover:bg-primary/90"
                  >
                    Agregar {selectedNewMembers.length}
                  </button>
                )}
              </div>
            )}

            <div className="space-y-2">
              {group.members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-2 hover:bg-muted rounded transition">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-semibold flex-shrink-0 overflow-hidden">
                      {member.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{member.name}</p>
                      {member.role === 'admin' && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Shield className="w-2 h-2" /> Admin
                        </p>
                      )}
                    </div>
                  </div>
                  {editMode && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleToggleAdmin(member.id)}
                        className={`p-1 rounded transition ${
                          member.role === 'admin'
                            ? 'bg-primary/20 text-primary hover:bg-primary/30'
                            : 'hover:bg-muted-foreground/20 text-muted-foreground'
                        }`}
                        title={member.role === 'admin' ? 'Remover admin' : 'Asignar admin'}
                      >
                        <Shield className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="p-1 hover:bg-secondary/20 rounded text-secondary"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Permissions Section */}
          {editMode && (
            <div>
              <button
                onClick={() => setShowPermissions(!showPermissions)}
                className="flex items-center gap-2 font-semibold text-foreground hover:text-primary transition mb-3"
              >
                <Shield className="w-4 h-4" />
                Permisos del grupo
              </button>

              {showPermissions && (
                <div className="border border-border rounded-lg p-3 space-y-3 bg-muted/50">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.sendMessages === 'admins'}
                      onChange={(e) => {
                        setPermissions({
                          ...permissions,
                          sendMessages: e.target.checked ? 'admins' : 'all',
                        })
                      }}
                      className="mt-1 rounded"
                    />
                    <div>
                      <p className="text-sm font-medium text-foreground">Solo admins pueden enviar</p>
                      <p className="text-xs text-muted-foreground">Restringe mensajes solo a administradores</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.editInfo === 'admins'}
                      onChange={(e) => {
                        setPermissions({
                          ...permissions,
                          editInfo: e.target.checked ? 'admins' : 'all',
                        })
                      }}
                      className="mt-1 rounded"
                    />
                    <div>
                      <p className="text-sm font-medium text-foreground">Solo admins pueden editar</p>
                      <p className="text-xs text-muted-foreground">Restringe cambios de nombre e imagen</p>
                    </div>
                  </label>
                </div>
              )}
            </div>
          )}

          {/* Rules Section */}
          {editMode && (
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Reglas del grupo</label>
              <textarea
                value={editRules}
                onChange={(e) => setEditRules(e.target.value.slice(0, 200))}
                placeholder="Escribe las reglas del grupo..."
                maxLength={200}
                rows={3}
                className="w-full border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1">{editRules.length}/200</p>
            </div>
          )}

          {!editMode && editRules && (
            <div className="bg-muted/50 border border-border rounded-lg p-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Reglas</p>
              <p className="text-sm text-foreground whitespace-pre-wrap">{editRules}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t border-border">
            <Button onClick={onClose} variant="outline" className="flex-1 border-border text-foreground hover:bg-muted">
              Cerrar
            </Button>
            {!editMode ? (
              <Button
                onClick={() => setEditMode(true)}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Editar Información
              </Button>
            ) : (
              <>
                <Button
                  onClick={() => setEditMode(false)}
                  variant="outline"
                  className="flex-1 border-border text-foreground hover:bg-muted"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSaveChanges}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Guardar cambios
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
