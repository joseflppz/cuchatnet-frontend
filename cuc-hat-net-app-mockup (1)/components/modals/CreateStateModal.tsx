'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useApp } from '@/contexts/AppContext'
import { X, Image as ImageIcon, Video } from 'lucide-react'
import { createState } from '@/lib/api'

interface CreateStateModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateStateModal({ isOpen, onClose }: CreateStateModalProps) {
  const { setStates, states, currentUser, showToast } = useApp()

  const [stateText, setStateText] = useState('')
  const [stateType, setStateType] = useState<'text' | 'image' | 'video'>('text')
  const [mediaPreview, setMediaPreview] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      showToast('El archivo es demasiado grande (máx 10MB)', 'error')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target?.result as string
      setMediaPreview(base64)
    }
    reader.readAsDataURL(file)
  }

  const handleCreateState = async () => {
    if (!currentUser || !currentUser.id) {
      showToast('Sesión no válida. Por favor, reintenta iniciar sesión.', 'error')
      return
    }

    setIsSubmitting(true)

    const payload = {
      UserId: Number(currentUser.id),
      Type: stateType,
      Content: stateType === 'text' ? stateText : "",
      MediaUrl: stateType !== 'text' ? mediaPreview || "" : ""
    }

    try {
      const result = await createState(currentUser.id, payload)

      const localNewState = {
        id: result.id?.toString() || Date.now().toString(),
        userId: currentUser.id,
        userName: currentUser.nombre || currentUser.name,
        userPhoto: currentUser.photo || null,
        content: stateType === 'text' ? stateText : mediaPreview,
        type: stateType,
        createdAt: new Date().toISOString(),
        viewedBy: []
      }

      setStates([localNewState as any, ...states])
      showToast('¡Estado publicado!', 'success')
      
      // Limpiar y cerrar
      setStateText('')
      setMediaPreview(null)
      setShowPreview(false)
      onClose()
    } catch (error) {
      console.error("❌ Error al publicar:", error)
      showToast('Error al conectar con el servidor', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  // --- VISTA DE PREVIA ---
  if (showPreview) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
          <div className="border-b border-border p-4 flex items-center justify-between">
            <h2 className="font-bold text-lg text-slate-900">Vista Previa</h2>
            <button onClick={() => setShowPreview(false)} className="text-slate-500 hover:text-slate-900">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-4 space-y-4">
            {/* Contenedor de Vista Previa Actualizado */}
            <div className="rounded-lg border border-border overflow-hidden bg-slate-50 flex items-center justify-center min-h-[200px]">
              {stateType === 'text' ? (
                <div className="p-6 text-center w-full">
                  <p className="text-xl text-slate-900 break-words font-medium italic">"{stateText}"</p>
                </div>
              ) : stateType === 'image' ? (
                mediaPreview && <img src={mediaPreview} alt="preview" className="w-full h-auto max-h-80 object-contain" />
              ) : (
                <video 
                  src={mediaPreview || ""} 
                  controls 
                  className="w-full max-h-80 bg-black"
                />
              )}
            </div>

            <div className="flex gap-2">
              <Button onClick={() => setShowPreview(false)} variant="outline" className="flex-1" disabled={isSubmitting}>
                Editar
              </Button>
              <Button onClick={handleCreateState} disabled={isSubmitting} className="flex-1 bg-[#E21B23] hover:bg-[#E21B23]/90 text-white font-bold">
                {isSubmitting ? 'Publicando...' : 'Confirmar y Publicar'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // --- VISTA DE CONFIGURACIÓN ---
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="border-b border-border p-4 flex items-center justify-between">
          <h2 className="font-bold text-lg text-slate-900">Crear Estado</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Selector de Tipo */}
          <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
            <button 
              onClick={() => { setStateType('text'); setMediaPreview(null); }} 
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${stateType === 'text' ? 'bg-white shadow-sm text-[#E21B23]' : 'text-slate-500'}`}
            >
              Texto
            </button>
            <button 
              onClick={() => setStateType('image')} 
              className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${stateType === 'image' ? 'bg-white shadow-sm text-[#E21B23]' : 'text-slate-500'}`}
            >
              <ImageIcon className="w-4 h-4" /> Imagen
            </button>
            <button 
              onClick={() => setStateType('video')} 
              className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${stateType === 'video' ? 'bg-white shadow-sm text-[#E21B23]' : 'text-slate-500'}`}
            >
              <Video className="w-4 h-4" /> Video
            </button>
          </div>

          {/* Área de Entrada de Texto con el estilo solicitado */}
          {stateType === 'text' ? (
            <textarea
              value={stateText}
              onChange={(e) => setStateText(e.target.value.slice(0, 200))}
              placeholder="¿Qué estás pensando?"
              className="w-full border border-border rounded-lg p-3 h-32 resize-none focus:ring-2 focus:ring-[#E21B23] outline-none transition-all text-slate-900 bg-white placeholder:text-slate-400"
            />
          ) : (
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center space-y-4 bg-slate-50/50">
              {mediaPreview ? (
                <div className="relative inline-block">
                  {stateType === 'image' ? (
                    <img src={mediaPreview} className="max-h-40 mx-auto rounded-lg shadow-md" alt="Preview" />
                  ) : (
                    <div className="p-4 bg-white border rounded-lg shadow-sm flex items-center gap-2">
                      <Video className="text-[#E21B23]" />
                      <span className="text-xs font-medium text-slate-900">Video seleccionado</span>
                    </div>
                  )}
                  <button 
                    onClick={() => setMediaPreview(null)} 
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="py-4">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                    {stateType === 'image' ? <ImageIcon className="w-6 h-6 text-slate-400" /> : <Video className="w-6 h-6 text-slate-400" />}
                  </div>
                  <p className="text-xs text-slate-500 mb-4 font-medium">Archivos hasta 10MB</p>
                  <Button asChild variant="outline" className="cursor-pointer w-full bg-white">
                    <label>
                      Seleccionar {stateType === 'image' ? 'Imagen' : 'Video'}
                      <input 
                        type="file" 
                        className="hidden" 
                        accept={stateType === 'image' ? "image/*" : "video/*"} 
                        onChange={handleFileSelect} 
                      />
                    </label>
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button onClick={onClose} variant="ghost" className="flex-1">Cancelar</Button>
            <Button 
              onClick={() => setShowPreview(true)} 
              disabled={stateType === 'text' ? !stateText.trim() : !mediaPreview} 
              className="flex-1 bg-[#E21B23] hover:bg-[#E21B23]/90 text-white font-bold"
            >
              Siguiente
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}