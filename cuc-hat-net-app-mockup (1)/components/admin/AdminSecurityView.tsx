'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Shield,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  Download,
  RotateCcw,
  Search,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

type Tab = 'policies' | 'logs'

type Policies = {
  lockoutEnabled: boolean
  autoKeyRotationEnabled: boolean
  deviceChangeDetectionEnabled: boolean
  requireIdentityVerificationEnabled: boolean
  e2eRequired: boolean

  lockoutMinutes: string
  maxDevicesPerUser: string
  keyRotationDays: string
}

type LogLevel = 'critical' | 'warning' | 'info'

type SecurityLog = {
  id: number
  event: string
  user: string
  timestamp: string
  level: LogLevel
}

const POLICIES_KEY = 'cuchatnet_admin_security_policies_v1'
const LOGS_KEY = 'cuchatnet_admin_security_logs_v1'

function nowStamp() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function downloadTextFile(filename: string, content: string, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function csvEscape(v: string) {
  const s = String(v ?? '')
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export default function AdminSecurityView() {
  const defaultPolicies: Policies = useMemo(
    () => ({
      lockoutEnabled: true,
      autoKeyRotationEnabled: true,
      deviceChangeDetectionEnabled: true,
      requireIdentityVerificationEnabled: true,
      e2eRequired: true,

      lockoutMinutes: '30',
      maxDevicesPerUser: '5',
      keyRotationDays: '30',
    }),
    []
  )

  const defaultLogs: SecurityLog[] = useMemo(
    () => [
      { id: 1, event: 'Cambio de dispositivo detectado', user: 'Juan Pérez', timestamp: '2026-02-10 14:32', level: 'warning' },
      { id: 2, event: 'Intento de acceso fallido', user: 'Desconocido', timestamp: '2026-02-10 14:15', level: 'critical' },
      { id: 3, event: 'Usuario desbloqueado', user: 'Carlos López', timestamp: '2026-02-10 13:45', level: 'info' },
      { id: 4, event: 'Clave renovada', user: 'Ana García', timestamp: '2026-02-10 13:20', level: 'info' },
      { id: 5, event: 'Configuración de seguridad actualizada', user: 'Administrador', timestamp: '2026-02-10 12:50', level: 'info' },
    ],
    []
  )

  const [selectedTab, setSelectedTab] = useState<Tab>('policies')

  const [policies, setPolicies] = useState<Policies>(defaultPolicies)
  const [saved, setSaved] = useState(false)
  const [dirty, setDirty] = useState(false)

  const [logs, setLogs] = useState<SecurityLog[]>(defaultLogs)
  const [searchTerm, setSearchTerm] = useState('')
  const [levelFilter, setLevelFilter] = useState<'all' | LogLevel>('all')

  // Load persisted data
  useEffect(() => {
    try {
      const rawP = localStorage.getItem(POLICIES_KEY)
      if (rawP) setPolicies({ ...defaultPolicies, ...(JSON.parse(rawP) as Partial<Policies>) })
    } catch { }

    try {
      const rawL = localStorage.getItem(LOGS_KEY)
      if (rawL) setLogs(JSON.parse(rawL) as SecurityLog[])
      else localStorage.setItem(LOGS_KEY, JSON.stringify(defaultLogs))
    } catch {
      // keep in-memory defaults
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Dirty detection (policies)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(POLICIES_KEY)
      const stored = raw ? ({ ...defaultPolicies, ...(JSON.parse(raw) as Partial<Policies>) } as Policies) : defaultPolicies
      setDirty(JSON.stringify(stored) !== JSON.stringify(policies))
    } catch {
      setDirty(true)
    }
  }, [policies, defaultPolicies])

  const addLog = (entry: Omit<SecurityLog, 'id'>) => {
    setLogs((prev) => {
      const nextId = prev.length ? Math.max(...prev.map((x) => x.id)) + 1 : 1
      const next = [{ id: nextId, ...entry }, ...prev]
      try {
        localStorage.setItem(LOGS_KEY, JSON.stringify(next))
      } catch { }
      return next
    })
  }

  const handleSavePolicies = () => {
    localStorage.setItem(POLICIES_KEY, JSON.stringify(policies))
    setSaved(true)
    setDirty(false)

    addLog({
      event: 'Configuración de seguridad actualizada',
      user: 'Administrador',
      timestamp: nowStamp(),
      level: 'info',
    })

    setTimeout(() => setSaved(false), 2200)
  }

  const handleResetPolicies = () => {
    setPolicies(defaultPolicies)
    addLog({
      event: 'Políticas restablecidas a valores por defecto',
      user: 'Administrador',
      timestamp: nowStamp(),
      level: 'warning',
    })
  }

  const handleRefreshLogs = () => {
    addLog({
      event: 'Bitácora actualizada manualmente',
      user: 'Administrador',
      timestamp: nowStamp(),
      level: 'info',
    })
  }

  const exportCsv = () => {
    const header = ['id', 'evento', 'usuario', 'timestamp', 'nivel']
    const rows = logs.map((l) => [String(l.id), l.event, l.user, l.timestamp, l.level])
    const csv = [header, ...rows].map((r) => r.map(csvEscape).join(',')).join('\n')
    downloadTextFile(`cuchatnet_bitacora_seguridad_${new Date().toISOString().slice(0, 10)}.csv`, csv, 'text/csv;charset=utf-8')
  }

  const filteredLogs = logs.filter((log) => {
    const q = searchTerm.trim().toLowerCase()
    const matchesSearch =
      !q ||
      log.event.toLowerCase().includes(q) ||
      log.user.toLowerCase().includes(q) ||
      log.timestamp.toLowerCase().includes(q)

    const matchesLevel = levelFilter === 'all' || log.level === levelFilter
    return matchesSearch && matchesLevel
  })

  const LevelPill = ({ level }: { level: LogLevel }) => {
    if (level === 'critical') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
          <AlertTriangle className="w-3 h-3" />
          Crítico
        </span>
      )
    }
    if (level === 'warning') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
          Advertencia
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
        Información
      </span>
    )
  }

  const Banner = ({ type }: { type: 'saved' | 'dirty' }) => {
    if (type === 'saved') {
      return (
        <div className="border rounded-lg p-4 flex gap-3 items-start bg-green-50 border-green-200 text-green-800">
          <CheckCircle2 className="w-5 h-5 mt-0.5" />
          <div>
            <p className="text-sm font-semibold">Políticas guardadas</p>
            <p className="text-sm">Cambios almacenados localmente (mockup).</p>
          </div>
        </div>
      )
    }

    return (
      <div className="border rounded-lg p-4 flex gap-3 items-start bg-amber-50 border-amber-200 text-amber-800">
        <AlertTriangle className="w-5 h-5 mt-0.5" />
        <div>
          <p className="text-sm font-semibold">Cambios sin guardar</p>
          <p className="text-sm">Guarda para conservarlos al recargar.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      {/* Tabs */}
      <div className="flex gap-4 border-b border-border">
        <button
          onClick={() => setSelectedTab('policies')}
          className={`px-4 py-3 font-medium border-b-2 transition-colors ${selectedTab === 'policies'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
        >
          Políticas de Seguridad
        </button>
        <button
          onClick={() => setSelectedTab('logs')}
          className={`px-4 py-3 font-medium border-b-2 transition-colors ${selectedTab === 'logs'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
        >
          Bitácora de Eventos
        </button>
      </div>

      {/* Banners */}
      {selectedTab === 'policies' && saved && <Banner type="saved" />}
      {selectedTab === 'policies' && !saved && dirty && <Banner type="dirty" />}

      {/* Policies Tab */}
      {selectedTab === 'policies' && (
        <div className="space-y-6">
          {/* Active Policies */}
          <Card className="p-6 border border-border">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-foreground">Políticas Activas</h3>
                <p className="text-sm text-muted-foreground">Protección, bloqueos y cifrado</p>
              </div>
              <Shield className="w-6 h-6 text-primary" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Lockout */}
              <div className="flex items-start justify-between p-4 border border-border rounded-xl hover:bg-muted/10 transition-colors">
                <div>
                  <p className="font-medium text-foreground">Bloqueo por intentos fallidos</p>
                  <p className="text-sm text-muted-foreground">Bloquea tras 5 intentos incorrectos</p>
                </div>
                <input
                  type="checkbox"
                  checked={policies.lockoutEnabled}
                  onChange={(e) => setPolicies({ ...policies, lockoutEnabled: e.target.checked })}
                  className="w-4 h-4 accent-primary mt-1"
                />
              </div>

              {/* Key Rotation */}
              <div className="flex items-start justify-between p-4 border border-border rounded-xl hover:bg-muted/10 transition-colors">
                <div>
                  <p className="font-medium text-foreground">Renovación automática de claves</p>
                  <p className="text-sm text-muted-foreground">Rotación programada por período</p>
                </div>
                <input
                  type="checkbox"
                  checked={policies.autoKeyRotationEnabled}
                  onChange={(e) => setPolicies({ ...policies, autoKeyRotationEnabled: e.target.checked })}
                  className="w-4 h-4 accent-primary mt-1"
                />
              </div>

              {/* Device Change */}
              <div className="flex items-start justify-between p-4 border border-border rounded-xl hover:bg-muted/10 transition-colors">
                <div>
                  <p className="font-medium text-foreground">Detección de cambio de dispositivo</p>
                  <p className="text-sm text-muted-foreground">Alerta ante un nuevo dispositivo</p>
                </div>
                <input
                  type="checkbox"
                  checked={policies.deviceChangeDetectionEnabled}
                  onChange={(e) => setPolicies({ ...policies, deviceChangeDetectionEnabled: e.target.checked })}
                  className="w-4 h-4 accent-primary mt-1"
                />
              </div>

              {/* Identity Verification */}
              <div className="flex items-start justify-between p-4 border border-border rounded-xl hover:bg-muted/10 transition-colors">
                <div>
                  <p className="font-medium text-foreground">Verificación de identidad</p>
                  <p className="text-sm text-muted-foreground">QR o código de seguridad</p>
                </div>
                <input
                  type="checkbox"
                  checked={policies.requireIdentityVerificationEnabled}
                  onChange={(e) =>
                    setPolicies({ ...policies, requireIdentityVerificationEnabled: e.target.checked })
                  }
                  className="w-4 h-4 accent-primary mt-1"
                />
              </div>

              {/* E2E Required */}
              <div className="md:col-span-2 flex items-start justify-between p-4 border border-border rounded-xl hover:bg-muted/10 transition-colors">
                <div>
                  <p className="font-medium text-foreground">Cifrado E2E obligatorio</p>
                  <p className="text-sm text-muted-foreground">
                    En auditoría solo se muestran metadatos, no contenido.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={policies.e2eRequired}
                  onChange={(e) => setPolicies({ ...policies, e2eRequired: e.target.checked })}
                  className="w-4 h-4 accent-primary mt-1"
                />
              </div>
            </div>
          </Card>

          {/* Threat Settings */}
          <Card className="p-6 border border-border">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-lg font-bold text-foreground">Umbrales y límites</h3>
                <p className="text-sm text-muted-foreground">Parámetros de mitigación</p>
              </div>
              <Button variant="outline" onClick={handleResetPolicies} className="gap-2">
                <RotateCcw className="w-4 h-4" />
                Defaults
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Tiempo de bloqueo (min)
                </label>
                <input
                  type="number"
                  value={policies.lockoutMinutes}
                  onChange={(e) => setPolicies({ ...policies, lockoutMinutes: e.target.value })}
                  className="w-full border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Máx. dispositivos por usuario
                </label>
                <input
                  type="number"
                  value={policies.maxDevicesPerUser}
                  onChange={(e) => setPolicies({ ...policies, maxDevicesPerUser: e.target.value })}
                  className="w-full border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Renovación de claves (días)
                </label>
                <input
                  type="number"
                  value={policies.keyRotationDays}
                  onChange={(e) => setPolicies({ ...policies, keyRotationDays: e.target.value })}
                  className="w-full border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end gap-2">
            <Button
              onClick={handleSavePolicies}
              className="gap-2 bg-primary hover:bg-primary/90"
              disabled={!dirty}
              title={!dirty ? 'No hay cambios pendientes' : 'Guardar políticas'}
            >
              <RefreshCw className="w-4 h-4" />
              Guardar Políticas
            </Button>
          </div>
        </div>
      )}

      {/* Logs Tab */}
      {selectedTab === 'logs' && (
        <div className="space-y-6">
          {/* Controls */}
          <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por evento, usuario o fecha..."
                  className="w-full pl-9 pr-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex gap-2 items-center">
              <button
                onClick={() => setLevelFilter('all')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${levelFilter === 'all'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
              >
                Todos
              </button>
              <button
                onClick={() => setLevelFilter('info')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${levelFilter === 'info'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
              >
                Info
              </button>
              <button
                onClick={() => setLevelFilter('warning')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${levelFilter === 'warning'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
              >
                Advert.
              </button>
              <button
                onClick={() => setLevelFilter('critical')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${levelFilter === 'critical'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
              >
                Crítico
              </button>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={exportCsv} className="gap-2">
                <Download className="w-4 h-4" />
                Descargar CSV
              </Button>
              <Button variant="outline" onClick={handleRefreshLogs} className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Actualizar
              </Button>
            </div>
          </div>

          {/* Table */}
          <Card className="border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-6 py-3 text-left font-semibold text-foreground">Evento</th>
                    <th className="px-6 py-3 text-left font-semibold text-foreground">Usuario</th>
                    <th className="px-6 py-3 text-left font-semibold text-foreground">Timestamp</th>
                    <th className="px-6 py-3 text-left font-semibold text-foreground">Nivel</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-3 font-medium text-foreground">{log.event}</td>
                      <td className="px-6 py-3 text-muted-foreground">{log.user}</td>
                      <td className="px-6 py-3 text-muted-foreground text-xs">{log.timestamp}</td>
                      <td className="px-6 py-3">
                        <LevelPill level={log.level} />
                      </td>
                    </tr>
                  ))}
                  {filteredLogs.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-sm text-muted-foreground">
                        No hay resultados con esos filtros.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <p className="text-sm text-muted-foreground">
            Mostrando {filteredLogs.length} de {logs.length} eventos
          </p>
        </div>
      )}
    </div>
  )
}
