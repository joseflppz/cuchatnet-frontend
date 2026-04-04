'use client'

import { useState, useId, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { useApp } from '@/contexts/AppContext'
import { X, Image as ImageIcon } from 'lucide-react'

interface CreateStateModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateStateModal({ isOpen, onClose }: CreateStateModalProps) {
  const { setStates, states, currentUser, showToast, contacts } = useApp()


  const [stateText, setStateText] = useState('')
  const [stateType, setStateType] = useState<'text' | 'image'>('text')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  const inputId = useId()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target?.result as string
      setImagePreview(base64)
      setStateText(base64)
      showToast('Imagen seleccionada', 'success')
    }
    reader.readAsDataURL(file)
  }

  const handleCreateState = () => {
    if (!stateText.trim()) {
      showToast('Selecciona una imagen o escribe algo', 'error')
      return
    }

    const now = new Date()
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()

    const newState = {
      id: `state-${Date.now()}`,
      userId: currentUser?.id || '',
      userName: currentUser?.name || '',
      userPhoto: currentUser?.photo || currentUser?.name?.charAt(0).toUpperCase() || '👤',
      content: stateType === 'image' && imagePreview ? imagePreview : stateText,
      type: stateType,
      createdAt: now.toISOString(),
      expiresAt,
      viewedBy: contacts.slice(0, 2).map(c => c.id),

    }

    setStates([...states, newState as any])
    showToast('Estado publicado exitosamente', 'success')
    setStateText('')
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    onClose()
  }

  if (!isOpen) return null

  // Preview screen
  if (showPreview) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-md w-full">
          <div className="border-b border-border p-4 flex items-center justify-between">
            <h2 className="font-bold text-lg text-foreground">Vista Previa</h2>
            <button onClick={() => setShowPreview(false)} className="text-foreground/60 hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* State preview */}
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="bg-muted p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold overflow-hidden">
                    {currentUser?.photo ? (
                      <img src={currentUser.photo} alt={currentUser.name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      currentUser?.name?.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{currentUser?.name}</p>
                    <p className="text-xs text-muted-foreground">Ahora</p>
                  </div>
                </div>

                {stateType === 'text' ? (
                  <p className="text-sm text-foreground break-words">{stateText}</p>
                ) : (
                  imagePreview && <img src={imagePreview} alt="preview" className="w-full rounded-lg max-h-48 object-cover" />
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => setShowPreview(false)}
                variant="outline"
                className="flex-1 border-border text-foreground hover:bg-muted"
              >
                Editar
              </Button>

              <Button
                onClick={() => {
                  handleCreateState()
                  setShowPreview(false)
                }}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Confirmar Publicación
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="border-b border-border p-4 flex items-center justify-between">
          <h2 className="font-bold text-lg text-foreground">Crear Estado</h2>
          <button onClick={onClose} className="text-foreground/60 hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex gap-2">
            <button
              onClick={() => setStateType('text')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${stateType === 'text' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground hover:bg-muted/80'
                }`}
            >
              Texto
            </button>

            <button
              onClick={() => {
                setStateType('image')
                // opcional: limpiar texto cuando cambias a imagen
                // setStateText('')
              }}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition flex items-center justify-center gap-2 ${stateType === 'image' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground hover:bg-muted/80'
                }`}
            >
              <ImageIcon className="w-4 h-4" />
              Imagen
            </button>
          </div>

          {stateType === 'text' ? (
            <div>
              <textarea
                value={stateText}
                onChange={(e) => setStateText(e.target.value.slice(0, 200))}
                placeholder="¿Qué está pasando?"
                maxLength={200}
                rows={5}
                className="w-full border border-border rounded-lg px-4 py-2 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              />
              <p className="text-xs text-muted-foreground mt-2">{stateText.length}/200</p>
            </div>
          ) : (
            <div className="space-y-3">
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} alt="preview" className="w-full rounded-lg max-h-48 object-cover" />
                  <button
                    onClick={() => {
                      setImagePreview(null)
                      setStateText('')
                      if (fileInputRef.current) fileInputRef.current.value = ''
                    }}
                    className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center space-y-2">
                  <ImageIcon className="w-10 h-10 text-muted-foreground mx-auto" />
                  <p className="text-sm font-medium text-foreground">Selecciona una imagen</p>
                  <p className="text-xs text-muted-foreground">PNG, JPG o GIF</p>

                  <input
                    ref={fileInputRef}
                    id={inputId}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />

                  <Button asChild variant="outline" className="border-border text-foreground hover:bg-muted w-full">
                    <label htmlFor={inputId} className="cursor-pointer w-full">
                      Cargar Imagen
                    </label>
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={onClose} variant="outline" className="flex-1 border-border text-foreground hover:bg-muted">
              Cancelar
            </Button>

            <Button
              onClick={() => setShowPreview(true)}
              disabled={!stateText.trim()}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50"
            >
              Vista Previa
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
