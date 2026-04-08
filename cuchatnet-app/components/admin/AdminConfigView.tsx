'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Save, RotateCcw, CheckCircle2, AlertTriangle } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://localhost:7086"

function getToken() {
  if (typeof window === "undefined") return null
  return localStorage.getItem("admin_token")
}

async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = getToken()
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  })
  if (!res.ok) throw new Error(`Error ${res.status}`)
  return res.json()
}

interface Config {
  appName: string
  maxGroupSize: number
  messageTimeout: number
  maxFileSize: number
  smtpServer: string | null
  smtpPort: number | null
  smsProvider: string | null
  apiEndpoint: string | null
  maintenanceMode: boolean
  e2ERequired: boolean
  autoArchiveInactivity: number
}

function Banner({ variant, title, text }: { variant: 'success' | 'warning'; title: string; text: string }) {
  const styles = variant === 'success'
    ? 'bg-green-50 border-green-200 text-green-800'
    : 'bg-amber-50 border-amber-200 text-amber-800'
  const Icon = variant === 'success' ? CheckCircle2 : AlertTriangle
  return (
    <div className={`border rounded-lg p-4 flex gap-3 items-start ${styles}`}>
      <Icon className="w-5 h-5 mt-0.5" />
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-sm">{text}</p>
      </div>
    </div>
  )
}

export default function AdminConfigView() {
  const [config, setConfig] = useState<Config | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiFetch<Config>('/api/admin/config')
      .then(setConfig)
      .catch(() => setError('Error al cargar configuración'))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    if (!config) return
    setSaving(true)
    try {
      await apiFetch('/api/admin/config', {
        method: 'PUT',
        body: JSON.stringify(config),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch {
      setError('Error al guardar configuración')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="p-6 flex items-center justify-center h-40">
      <p className="text-muted-foreground">Cargando configuración...</p>
    </div>
  )

  if (error) return (
    <div className="p-6 flex items-center justify-center h-40">
      <p className="text-red-500">{error}</p>
    </div>
  )

  if (!config) return null

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {saved && <Banner variant="success" title="Configuración guardada" text="Los cambios fueron guardados correctamente." />}

      <Card className="p-6 border border-border">
        <h3 className="text-lg font-bold text-foreground mb-4">Configuración General</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Nombre de la Aplicación</label>
            <input
              type="text"
              value={config.appName}
              onChange={(e) => setConfig({ ...config, appName: e.target.value })}
              className="w-full border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Tamaño máximo de grupo</label>
              <input
                type="number"
                value={config.maxGroupSize}
                onChange={(e) => setConfig({ ...config, maxGroupSize: Number(e.target.value) })}
                className="w-full border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Timeout mensajes (min)</label>
              <input
                type="number"
                value={config.messageTimeout}
                onChange={(e) => setConfig({ ...config, messageTimeout: Number(e.target.value) })}
                className="w-full border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Tamaño máximo archivo (MB)</label>
              <input
                type="number"
                value={config.maxFileSize}
                onChange={(e) => setConfig({ ...config, maxFileSize: Number(e.target.value) })}
                className="w-full border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Auto-archivar inactividad (días)</label>
            <input
              type="number"
              value={config.autoArchiveInactivity}
              onChange={(e) => setConfig({ ...config, autoArchiveInactivity: Number(e.target.value) })}
              className="w-full border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.maintenanceMode}
                onChange={(e) => setConfig({ ...config, maintenanceMode: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium text-foreground">Modo mantenimiento</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.e2ERequired}
                onChange={(e) => setConfig({ ...config, e2ERequired: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium text-foreground">Requerir cifrado E2E</span>
            </label>
          </div>
        </div>
      </Card>

      <Card className="p-6 border border-border">
        <h3 className="text-lg font-bold text-foreground mb-4">Configuración SMTP</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Servidor SMTP</label>
            <input
              type="text"
              value={config.smtpServer ?? ''}
              onChange={(e) => setConfig({ ...config, smtpServer: e.target.value || null })}
              className="w-full border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Puerto SMTP</label>
            <input
              type="number"
              value={config.smtpPort ?? ''}
              onChange={(e) => setConfig({ ...config, smtpPort: e.target.value ? Number(e.target.value) : null })}
              className="w-full border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </Card>

      <Card className="p-6 border border-border">
        <h3 className="text-lg font-bold text-foreground mb-4">SMS y API</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Proveedor SMS</label>
            <input
              type="text"
              value={config.smsProvider ?? ''}
              onChange={(e) => setConfig({ ...config, smsProvider: e.target.value || null })}
              placeholder="Ej: Twilio"
              className="w-full border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">API Endpoint</label>
            <input
              type="url"
              value={config.apiEndpoint ?? ''}
              onChange={(e) => setConfig({ ...config, apiEndpoint: e.target.value || null })}
              placeholder="https://api.ejemplo.com"
              className="w-full border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </Card>

      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => {
            setLoading(true)
            apiFetch<Config>('/api/admin/config')
              .then(setConfig)
              .finally(() => setLoading(false))
          }}
          className="gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Recargar
        </Button>
        <Button onClick={handleSave} disabled={saving} className="gap-2 bg-primary hover:bg-primary/90">
          <Save className="w-4 h-4" />
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </div>
    </div>
  )
}