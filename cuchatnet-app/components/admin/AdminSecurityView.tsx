'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Shield, AlertTriangle, RefreshCw, CheckCircle2, Search, RotateCcw } from 'lucide-react'

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

interface Policy {
  blockAfterFailedAttempts: number
  blockDuration: number
  keyRotationDays: number
  enableDeviceDetection: boolean
  enableIdentityVerification: boolean
  requireE2EEncryption: boolean
  suspiciousLoginTimeout: number
  maxDevicesPerUser: number
}

interface Log {
  id: number
  timestamp: string
  action: string
  user: string
  details: string | null
  severity: string
}

type Tab = 'policies' | 'logs'

export default function AdminSecurityView() {
  const [tab, setTab] = useState<Tab>('policies')

  // Policies
  const [policy, setPolicy] = useState<Policy | null>(null)
  const [loadingPolicy, setLoadingPolicy] = useState(true)
  const [savingPolicy, setSavingPolicy] = useState(false)
  const [savedPolicy, setSavedPolicy] = useState(false)
  const [errorPolicy, setErrorPolicy] = useState<string | null>(null)

  // Logs
  const [logs, setLogs] = useState<Log[]>([])
  const [loadingLogs, setLoadingLogs] = useState(true)
  const [search, setSearch] = useState('')
  const [levelFilter, setLevelFilter] = useState<'all' | string>('all')

  useEffect(() => {
    apiFetch<Policy>('/api/admin/security/policy')
      .then(setPolicy)
      .catch(() => setErrorPolicy('Error al cargar política'))
      .finally(() => setLoadingPolicy(false))
  }, [])

  useEffect(() => {
    if (tab === 'logs') {
      setLoadingLogs(true)
      apiFetch<Log[]>('/api/admin/security/logs')
        .then(setLogs)
        .catch(() => setLogs([]))
        .finally(() => setLoadingLogs(false))
    }
  }, [tab])

  const handleSavePolicy = async () => {
    if (!policy) return
    setSavingPolicy(true)
    try {
      await apiFetch('/api/admin/security/policy', {
        method: 'PUT',
        body: JSON.stringify(policy),
      })
      setSavedPolicy(true)
      setTimeout(() => setSavedPolicy(false), 2500)
    } catch {
      setErrorPolicy('Error al guardar política')
    } finally {
      setSavingPolicy(false)
    }
  }

  const handleRefreshLogs = () => {
    setLoadingLogs(true)
    const params = levelFilter !== 'all' ? `?category=${levelFilter}` : ''
    apiFetch<Log[]>(`/api/admin/security/logs${params}`)
      .then(setLogs)
      .catch(() => setLogs([]))
      .finally(() => setLoadingLogs(false))
  }

  const severityStyle: Record<string, string> = {
    info: 'bg-blue-100 text-blue-700',
    warning: 'bg-yellow-100 text-yellow-700',
    error: 'bg-red-100 text-red-700',
    critical: 'bg-red-200 text-red-800',
  }

  const filteredLogs = logs.filter(log => {
    const q = search.trim().toLowerCase()
    const matchSearch = !q || log.action.toLowerCase().includes(q) || log.user.toLowerCase().includes(q)
    const matchLevel = levelFilter === 'all' || log.severity === levelFilter
    return matchSearch && matchLevel
  })

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <div className="flex gap-4 border-b border-border">
        <button
          onClick={() => setTab('policies')}
          className={`px-4 py-3 font-medium border-b-2 transition-colors ${tab === 'policies' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          Políticas de Seguridad
        </button>
        <button
          onClick={() => setTab('logs')}
          className={`px-4 py-3 font-medium border-b-2 transition-colors ${tab === 'logs' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          Bitácora de Eventos
        </button>
      </div>

      {tab === 'policies' && (
        <div className="space-y-6">
          {savedPolicy && (
            <div className="border rounded-lg p-4 flex gap-3 items-start bg-green-50 border-green-200 text-green-800">
              <CheckCircle2 className="w-5 h-5 mt-0.5" />
              <div>
                <p className="text-sm font-semibold">Políticas guardadas</p>
                <p className="text-sm">Los cambios fueron guardados correctamente.</p>
              </div>
            </div>
          )}

          {loadingPolicy ? (
            <div className="flex items-center justify-center h-40">
              <p className="text-muted-foreground">Cargando políticas...</p>
            </div>
          ) : errorPolicy ? (
            <div className="flex items-center justify-center h-40">
              <p className="text-red-500">{errorPolicy}</p>
            </div>
          ) : policy ? (
            <>
              <Card className="p-6 border border-border">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Políticas Activas</h3>
                    <p className="text-sm text-muted-foreground">Protección, bloqueos y cifrado</p>
                  </div>
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start justify-between p-4 border border-border rounded-xl hover:bg-muted/10">
                    <div>
                      <p className="font-medium text-foreground">Detección de cambio de dispositivo</p>
                      <p className="text-sm text-muted-foreground">Alerta ante un nuevo dispositivo</p>
                    </div>
                    <input type="checkbox" checked={policy.enableDeviceDetection}
                      onChange={(e) => setPolicy({ ...policy, enableDeviceDetection: e.target.checked })}
                      className="w-4 h-4 accent-primary mt-1" />
                  </div>
                  <div className="flex items-start justify-between p-4 border border-border rounded-xl hover:bg-muted/10">
                    <div>
                      <p className="font-medium text-foreground">Verificación de identidad</p>
                      <p className="text-sm text-muted-foreground">QR o código de seguridad</p>
                    </div>
                    <input type="checkbox" checked={policy.enableIdentityVerification}
                      onChange={(e) => setPolicy({ ...policy, enableIdentityVerification: e.target.checked })}
                      className="w-4 h-4 accent-primary mt-1" />
                  </div>
                  <div className="md:col-span-2 flex items-start justify-between p-4 border border-border rounded-xl hover:bg-muted/10">
                    <div>
                      <p className="font-medium text-foreground">Cifrado E2E obligatorio</p>
                      <p className="text-sm text-muted-foreground">En auditoría solo se muestran metadatos.</p>
                    </div>
                    <input type="checkbox" checked={policy.requireE2EEncryption}
                      onChange={(e) => setPolicy({ ...policy, requireE2EEncryption: e.target.checked })}
                      className="w-4 h-4 accent-primary mt-1" />
                  </div>
                </div>
              </Card>

              <Card className="p-6 border border-border">
                <h3 className="text-lg font-bold text-foreground mb-4">Umbrales y límites</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Bloquear tras intentos fallidos</label>
                    <input type="number" value={policy.blockAfterFailedAttempts}
                      onChange={(e) => setPolicy({ ...policy, blockAfterFailedAttempts: Number(e.target.value) })}
                      className="w-full border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Duración bloqueo (min)</label>
                    <input type="number" value={policy.blockDuration}
                      onChange={(e) => setPolicy({ ...policy, blockDuration: Number(e.target.value) })}
                      className="w-full border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Rotación de claves (días)</label>
                    <input type="number" value={policy.keyRotationDays}
                      onChange={(e) => setPolicy({ ...policy, keyRotationDays: Number(e.target.value) })}
                      className="w-full border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Máx. dispositivos por usuario</label>
                    <input type="number" value={policy.maxDevicesPerUser}
                      onChange={(e) => setPolicy({ ...policy, maxDevicesPerUser: Number(e.target.value) })}
                      className="w-full border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary" />
                  </div>
                </div>
              </Card>

              <div className="flex justify-end">
                <Button onClick={handleSavePolicy} disabled={savingPolicy} className="gap-2 bg-primary hover:bg-primary/90">
                  <RefreshCw className="w-4 h-4" />
                  {savingPolicy ? 'Guardando...' : 'Guardar Políticas'}
                </Button>
              </div>
            </>
          ) : null}
        </div>
      )}

      {tab === 'logs' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por evento o usuario..."
                  className="w-full pl-9 pr-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <div className="flex gap-2 items-center flex-wrap">
              {['all', 'info', 'warning', 'error'].map(level => (
                <button key={level}
                  onClick={() => setLevelFilter(level)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${levelFilter === level ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                >
                  {level === 'all' ? 'Todos' : level === 'info' ? 'Info' : level === 'warning' ? 'Advert.' : 'Error'}
                </button>
              ))}
              <Button variant="outline" onClick={handleRefreshLogs} className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Actualizar
              </Button>
            </div>
          </div>

          {loadingLogs ? (
            <div className="flex items-center justify-center h-40">
              <p className="text-muted-foreground">Cargando bitácora...</p>
            </div>
          ) : (
            <Card className="border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="px-6 py-3 text-left font-semibold text-foreground">Evento</th>
                      <th className="px-6 py-3 text-left font-semibold text-foreground">Usuario</th>
                      <th className="px-6 py-3 text-left font-semibold text-foreground">Detalles</th>
                      <th className="px-6 py-3 text-left font-semibold text-foreground">Timestamp</th>
                      <th className="px-6 py-3 text-left font-semibold text-foreground">Nivel</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                        <td className="px-6 py-3 font-medium text-foreground">{log.action}</td>
                        <td className="px-6 py-3 text-muted-foreground">{log.user}</td>
                        <td className="px-6 py-3 text-muted-foreground text-xs">{log.details ?? '—'}</td>
                        <td className="px-6 py-3 text-muted-foreground text-xs">
                          {new Date(log.timestamp).toLocaleString('es-CR')}
                        </td>
                        <td className="px-6 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${severityStyle[log.severity] ?? 'bg-gray-100 text-gray-600'}`}>
                            {log.severity}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {filteredLogs.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-10 text-center text-sm text-muted-foreground">
                          No hay eventos.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
          <p className="text-sm text-muted-foreground">
            Mostrando {filteredLogs.length} de {logs.length} eventos
          </p>
        </div>
      )}
    </div>
  )
}