'use client'

import { useApp } from '@/contexts/AppContext'
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react'

export function Toast() {
  const { toast, setToast } = useApp()

  if (!toast) return null

  const closeToast = () => setToast(null)

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-600" />,
    error: <AlertCircle className="w-5 h-5 text-red-600" />,
    info: <Info className="w-5 h-5 text-blue-600" />,
  }

  const bgColors = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200',
  }

  const textColors = {
    success: 'text-green-700',
    error: 'text-red-700',
    info: 'text-blue-700',
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${bgColors[toast.type]}`}>
        {icons[toast.type]}
        <p className={`text-sm font-medium ${textColors[toast.type]}`}>{toast.message}</p>
        <button onClick={closeToast} className="ml-2 opacity-50 hover:opacity-100 transition-opacity">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
