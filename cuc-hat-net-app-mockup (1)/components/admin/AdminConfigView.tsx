'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Save, RotateCcw, CheckCircle2, AlertTriangle, Mail, MessageSquare, Link2 } from 'lucide-react'

type ConfigState = {
  appName: string
  maxGroupSize: string
  messageTimeout: string
  maxFileSize: string
  smtpServer: string
  smtpPort: string
  smsProvider: 'Twilio' | 'AWS SNS' | 'Nexmo'
  apiEndpoint: string
}

const STORAGE_KEY = 'cuchatnet_admin_config_v1'

export default function AdminConfigView() {
  const defaultConfig: ConfigState = useMemo(
    () => ({
      appName: 'CUChatNet',
      maxGroupSize: '500',
      messageTimeout: '30',
      maxFileSize: '100',
      smtpServer: 'mail.cuc.edu',
      smtpPort: '587',
      smsProvider: 'Twilio',
      apiEndpoint: 'https://api.cuc.edu',
    }),
    []
  )

  const [config, setConfig] = useState<ConfigState>(defaultConfig)
  const [saved, setSaved] = useState(false)
  const [dirty, setDirty] = useState(false)

  const [testEmail, setTestEmail] = useState<'idle' | 'ok' | 'fail'>('idle')
  const [testSms, setTestSms] = useState<'idle' | 'ok' | 'fail'>('idle')
  const [testApi, setTestApi] = useState<'idle' | 'ok' | 'fail'>('idle')

  // Cargar config guardada (simulado persistente)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<ConfigState>
        setConfig({ ...defaultConfig, ...parsed })
      }
    } catch {
      // si falla, usamos defaults
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Detectar cambios sin guardar
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      const savedConfig = raw ? ({ ...defaultConfig, ...(JSON.parse(raw) as Partial<ConfigState>) } as ConfigState) : defaultConfig
      setDirty(JSON.stringify(savedConfig) !== JSON.stringify(config))
    } catch {
      setDirty(true)
    }
  }, [config, defaultConfig])

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
    setSaved(true)
    setDirty(false)
    setTimeout(() => setSaved(false), 2500)
  }

  const handleReset = () => {
    setConfig(defaultConfig)
    setTestEmail('idle')
    setTestSms('idle')
    setTestApi('idle')
  }

  const runFakeTest = (type: 'email' | 'sms' | 'api') => {
    // “Prueba” simulada con resultado determinístico simple
    const ok =
      (type === 'email' && config.smtpServer.trim().length > 2 && Number(config.smtpPort) > 0) ||
      (type === 'sms' && config.smsProvider.length > 0) ||
      (type === 'api' && config.apiEndpoint.trim().startsWith('http'))

    if (type === 'email') setTestEmail(ok ? 'ok' : 'fail')
    if (type === 'sms') setTestSms(ok ? 'ok' : 'fail')
    if (type === 'api') setTestApi(ok ? 'ok' : 'fail')

    setTimeout(() => {
      if (type === 'email') setTestEmail('idle')
      if (type === 'sms') setTestSms('idle')
      if (type === 'api') setTestApi('idle')
    }, 2500)
  }

  const Banner = ({
    variant,
    title,
    text,
  }: {
    variant: 'success' | 'warning'
    title: string
    text: string
  }) => {
    const styles =
      variant === 'success'
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

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {saved && (
        <Banner
          variant="success"
          title="Configuración guardada"
          text="Los cambios fueron almacenados localmente (mockup) y se mantendrán al recargar."
        />
      )}

      {dirty && !saved && (
        <Banner
          variant="warning"
          title="Cambios sin guardar"
          text="Tienes modificaciones pendientes. Presiona “Guardar cambios” para conservarlas."
        />
      )}

      {/* General Settings */}
      <Card className="p-6 border border-border">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-lg font-bold text-foreground">Configuración General</h3>
            <p className="text-xs text-muted-foreground">Parámetros globales del sistema</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset} className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Restablecer
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Nombre de la Aplicación
            </label>
            <input
              type="text"
              value={config.appName}
              onChange={(e) => setConfig({ ...config, appName: e.target.value })}
              className="w-full border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Tamaño Máximo de Grupo
              </label>
              <input
                type="number"
                value={config.maxGroupSize}
                onChange={(e) => setConfig({ ...config, maxGroupSize: e.target.value })}
                className="w-full border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-muted-foreground mt-1">Ej: 500</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Timeout de Mensajes (min)
              </label>
              <input
                type="number"
                value={config.messageTimeout}
                onChange={(e) => setConfig({ ...config, messageTimeout: e.target.value })}
                className="w-full border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-muted-foreground mt-1">Ej: 30</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Tamaño Máximo Archivo (MB)
              </label>
              <input
                type="number"
                value={config.maxFileSize}
                onChange={(e) => setConfig({ ...config, maxFileSize: e.target.value })}
                className="w-full border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-muted-foreground mt-1">Ej: 100</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Email Configuration */}
      <Card className="p-6 border border-border">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-lg font-bold text-foreground">Configuración de Email (SMTP)</h3>
            <p className="text-xs text-muted-foreground">Cuenta de salida y parámetros</p>
          </div>

          <Button
            variant="outline"
            className="gap-2 bg-transparent"
            onClick={() => runFakeTest('email')}
          >
            <Mail className="w-4 h-4" />
            Probar
          </Button>
        </div>

        {testEmail === 'ok' && (
          <div className="mb-4">
            <Banner variant="success" title="Prueba SMTP" text="Conexión simulada exitosa." />
          </div>
        )}
        {testEmail === 'fail' && (
          <div className="mb-4">
            <Banner variant="warning" title="Prueba SMTP" text="Faltan datos válidos (simulado)." />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Servidor SMTP</label>
            <input
              type="text"
              value={config.smtpServer}
              onChange={(e) => setConfig({ ...config, smtpServer: e.target.value })}
              className="w-full border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Puerto SMTP</label>
            <input
              type="number"
              value={config.smtpPort}
              onChange={(e) => setConfig({ ...config, smtpPort: e.target.value })}
              className="w-full border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </Card>

      {/* SMS Configuration */}
      <Card className="p-6 border border-border">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-lg font-bold text-foreground">Proveedor de SMS</h3>
            <p className="text-xs text-muted-foreground">Verificación por código (mock)</p>
          </div>

          <Button
            variant="outline"
            className="gap-2 bg-transparent"
            onClick={() => runFakeTest('sms')}
          >
            <MessageSquare className="w-4 h-4" />
            Probar
          </Button>
        </div>

        {testSms === 'ok' && (
          <div className="mb-4">
            <Banner variant="success" title="Prueba SMS" text="Proveedor simulado disponible." />
          </div>
        )}
        {testSms === 'fail' && (
          <div className="mb-4">
            <Banner variant="warning" title="Prueba SMS" text="Proveedor no seleccionado (simulado)." />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Proveedor</label>
            <select
              value={config.smsProvider}
              onChange={(e) =>
                setConfig({ ...config, smsProvider: e.target.value as ConfigState['smsProvider'] })
              }
              className="w-full border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary"
            >
              <option>Twilio</option>
              <option>AWS SNS</option>
              <option>Nexmo</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">API Key</label>
            <input
              type="password"
              placeholder="••••••••••••"
              className="w-full border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary"
            />
            <p className="text-xs text-muted-foreground mt-1">No se guarda en el mockup</p>
          </div>
        </div>
      </Card>

      {/* API Configuration */}
      <Card className="p-6 border border-border">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-lg font-bold text-foreground">API Transaccional</h3>
            <p className="text-xs text-muted-foreground">Consumo de API (simulado)</p>
          </div>

          <Button
            variant="outline"
            className="gap-2 bg-transparent"
            onClick={() => runFakeTest('api')}
          >
            <Link2 className="w-4 h-4" />
            Probar
          </Button>
        </div>

        {testApi === 'ok' && (
          <div className="mb-4">
            <Banner variant="success" title="Prueba API" text="Endpoint válido (simulado)." />
          </div>
        )}
        {testApi === 'fail' && (
          <div className="mb-4">
            <Banner
              variant="warning"
              title="Prueba API"
              text="El endpoint debe iniciar con http/https (simulado)."
            />
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Endpoint API</label>
            <input
              type="url"
              value={config.apiEndpoint}
              onChange={(e) => setConfig({ ...config, apiEndpoint: e.target.value })}
              className="w-full border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Token API</label>
            <input
              type="password"
              placeholder="••••••••••••"
              className="w-full border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary"
            />
            <p className="text-xs text-muted-foreground mt-1">No se guarda en el mockup</p>
          </div>
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-2">
        <Button
          onClick={handleSave}
          className="gap-2 bg-primary hover:bg-primary/90"
          disabled={!dirty}
          title={!dirty ? 'No hay cambios pendientes' : 'Guardar cambios'}
        >
          <Save className="w-4 h-4" />
          Guardar Cambios
        </Button>
      </div>
    </div>
  )
}
