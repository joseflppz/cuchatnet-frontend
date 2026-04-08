'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { X, Mic, Send, Trash2 } from 'lucide-react'

interface VoiceModalProps {
  isOpen: boolean
  onClose: () => void
  onSendVoice: (duration: number) => void
}

export function VoiceModal({ isOpen, onClose, onSendVoice }: VoiceModalProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [duration, setDuration] = useState(0)
  const [recordingComplete, setRecordingComplete] = useState(false)

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRecording) {
      interval = setInterval(() => {
        setDuration((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isRecording])

  const handleStartRecording = () => {
    setIsRecording(true)
    setDuration(0)
    setRecordingComplete(false)
  }

  const handleStopRecording = () => {
    setIsRecording(false)
    setRecordingComplete(true)
  }

  const handleSend = () => {
    onSendVoice(duration)
    handleReset()
    onClose()
  }

  const handleReset = () => {
    setDuration(0)
    setRecordingComplete(false)
    setIsRecording(false)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-sm w-full">
        <div className="border-b border-border p-4 flex items-center justify-between">
          <h2 className="font-bold text-lg text-foreground">Grabar nota de voz</h2>
          <button onClick={onClose} className="text-foreground/60 hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Recording Visualization */}
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-primary/10 border-4 border-primary flex items-center justify-center">
              <Mic className={`w-8 h-8 ${isRecording ? 'text-red-500 animate-pulse' : 'text-primary'}`} />
            </div>

            <div className="text-center">
              <p className="text-3xl font-bold text-foreground font-mono">{formatTime(duration)}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {isRecording ? 'Grabando...' : recordingComplete ? 'Grabación lista' : 'Presiona para grabar'}
              </p>
            </div>
          </div>

          {/* Recording Controls */}
          <div className="flex gap-3">
            {!recordingComplete && (
              <>
                {!isRecording ? (
                  <Button
                    onClick={handleStartRecording}
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                  >
                    <Mic className="w-4 h-4" />
                    Grabar
                  </Button>
                ) : (
                  <Button
                    onClick={handleStopRecording}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white gap-2"
                  >
                    Detener
                  </Button>
                )}
              </>
            )}

            {recordingComplete && (
              <>
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="flex-1 border-border text-foreground hover:bg-muted gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Descartar
                </Button>
                <Button
                  onClick={handleSend}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                >
                  <Send className="w-4 h-4" />
                  Enviar
                </Button>
              </>
            )}
          </div>

          {!isRecording && !recordingComplete && (
            <Button onClick={onClose} variant="outline" className="w-full border-border text-foreground hover:bg-muted">
              Cancelar
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
