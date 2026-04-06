'use client'

import { useEffect, useState } from 'react'
import { Users, MessageSquare, Users2, TrendingUp } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { getDashboardSummary } from '@/lib/api/admin'

interface Activity {
  id: number
  action: string
  details: string | null
  timestamp: string
  severity: string
}

interface Summary {
  totalUsers: number
  activeUsers: number
  totalGroups: number
  messagesToday: number
  recentActivity: Activity[]
}

export default function AdminDashboardView() {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getDashboardSummary()
      .then(setSummary)
      .catch(() => setError('Error al cargar el dashboard'))
      .finally(() => setLoading(false))
  }, [])

  const stats = summary
    ? [
        { label: 'Usuarios Registrados', value: summary.totalUsers.toLocaleString(), icon: Users, color: 'primary' },
        { label: 'Usuarios Activos Hoy', value: summary.activeUsers.toLocaleString(), icon: TrendingUp, color: 'secondary' },
        { label: 'Mensajes Hoy', value: summary.messagesToday.toLocaleString(), icon: MessageSquare, color: 'primary' },
        { label: 'Grupos Activos', value: summary.totalGroups.toLocaleString(), icon: Users2, color: 'secondary' },
      ]
    : []

  const severityColor: Record<string, string> = {
    info: 'text-blue-500',
    warning: 'text-yellow-500',
    error: 'text-red-500',
    critical: 'text-red-700',
  }

  if (loading) return (
    <div className="p-6 flex items-center justify-center h-64">
      <p className="text-muted-foreground">Cargando dashboard...</p>
    </div>
  )

  if (error) return (
    <div className="p-6 flex items-center justify-center h-64">
      <p className="text-red-500">{error}</p>
    </div>
  )

  return (
    <div className="p-6 space-y-6">
      <p style={{color: 'red', fontSize: '20px'}}>VERSIÓN NUEVA</p>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon
          return (
            <Card key={idx} className="p-6 border border-border">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground mt-2">{stat.value}</p>
                </div>
                <div className={`p-2 rounded-lg ${stat.color === 'primary' ? 'bg-primary/10' : 'bg-secondary/10'}`}>
                  <Icon className={`w-6 h-6 ${stat.color === 'primary' ? 'text-primary' : 'text-secondary'}`} />
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Recent Activity */}
      <Card className="p-6 border border-border">
        <h3 className="font-semibold text-foreground mb-4">Actividad Reciente</h3>
        <div className="space-y-3">
          {summary?.recentActivity.length === 0 && (
            <p className="text-sm text-muted-foreground">No hay actividad reciente.</p>
          )}
          {summary?.recentActivity.map((activity) => (
            <div key={activity.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div>
                <p className={`text-sm font-medium ${severityColor[activity.severity] ?? 'text-foreground'}`}>
                  {activity.action}
                </p>
                <p className="text-xs text-muted-foreground">{activity.details ?? '—'}</p>
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(activity.timestamp).toLocaleString('es-CR')}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}