'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { X, Image, Video, File, Upload } from 'lucide-react'
import { useApp } from '@/contexts/AppContext'

interface MediaModalProps {
  isOpen: boolean
  onClose: () => void
  onSendMedia: (media: { type: 'image' | 'video' | 'file'; file: File; preview?: string }) => void
}

export function MediaModal({ isOpen, onClose, onSendMedia }: MediaModalProps) {
  const { showToast } = useApp()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'file' | null>(null)
  const [uploading, setUploading] = useState(false)

  const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB
  const ALLOWED_TYPES = {
    image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    video: ['video/mp4', 'video/webm', 'video/quicktime'],
    file: ['application/pdf', 'application/msword', 'application/vnd.ms-excel'],
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video' | 'file') => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      showToast(`Archivo muy grande. Máximo 100MB`, 'error')
      return
    }

    // Validate file type
    const allowedTypes = ALLOWED_TYPES[type]
    if (!allowedTypes.includes(file.type) && !file.type.startsWith(type)) {
      showToast(`Formato no soportado. Usa ${type}`, 'error')
      return
    }

    setSelectedFile(file)
    setMediaType(type)

    // Create preview for images
    if (type === 'image') {
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setPreview(null)
    }
  }

  const handleSend = async () => {
    if (!selectedFile || !mediaType) {
      showToast('Selecciona un archivo', 'error')
      return
    }

    setUploading(true)
    // Simulate upload with progress
    await new Promise((resolve) => setTimeout(resolve, 1500))
    
    onSendMedia({
      type: mediaType,
      file: selectedFile,
      preview,
    })

    setUploading(false)
    setSelectedFile(null)
    setPreview(null)
    setMediaType(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="border-b border-border p-4 flex items-center justify-between">
          <h2 className="font-bold text-lg text-foreground">Compartir contenido</h2>
          <button onClick={onClose} className="text-foreground/60 hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {!selectedFile ? (
            <>
              <div className="grid grid-cols-3 gap-3">
                <label className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-border rounded-lg hover:border-primary hover:bg-primary/5 cursor-pointer transition">
                  <Image className="w-6 h-6 text-primary" />
                  <span className="text-xs text-center font-medium text-foreground">Imagen</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileSelect(e, 'image')}
                    className="hidden"
                  />
                </label>

                <label className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-border rounded-lg hover:border-primary hover:bg-primary/5 cursor-pointer transition">
                  <Video className="w-6 h-6 text-primary" />
                  <span className="text-xs text-center font-medium text-foreground">Video</span>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => handleFileSelect(e, 'video')}
                    className="hidden"
                  />
                </label>

                <label className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-border rounded-lg hover:border-primary hover:bg-primary/5 cursor-pointer transition">
                  <File className="w-6 h-6 text-primary" />
                  <span className="text-xs text-center font-medium text-foreground">Archivo</span>
                  <input
                    type="file"
                    onChange={(e) => handleFileSelect(e, 'file')}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="text-xs text-muted-foreground text-center">
                Máximo 100MB por archivo
              </div>
            </>
          ) : (
            <>
              <div className="border border-border rounded-lg p-4 bg-muted/50">
                {preview && mediaType === 'image' && (
                  <img src={preview} alt="preview" className="w-full rounded max-h-48 object-cover" />
                )}
                {!preview && (
                  <div className="flex items-center gap-3">
                    {mediaType === 'video' && <Video className="w-8 h-8 text-primary" />}
                    {mediaType === 'file' && <File className="w-8 h-8 text-primary" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  setSelectedFile(null)
                  setPreview(null)
                  setMediaType(null)
                }}
                className="text-sm text-primary hover:text-primary/80 font-medium"
              >
                Seleccionar otro archivo
              </button>

              <div className="flex gap-2">
                <Button onClick={onClose} variant="outline" className="flex-1 border-border text-foreground hover:bg-muted">
                  Cancelar
                </Button>
                <Button
                  onClick={handleSend}
                  disabled={uploading}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                >
                  {uploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Enviar
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
