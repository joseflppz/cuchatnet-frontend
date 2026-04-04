'use client'

import { Users, MessageSquare, Users2, TrendingUp } from 'lucide-react'
import { Card } from '@/components/ui/card'

export default function AdminDashboardView() {
  const stats = [
    { label: 'Usuarios Registrados', value: '1,247', icon: Users, color: 'primary' },
    { label: 'Usuarios Activos Hoy', value: '487', icon: TrendingUp, color: 'secondary' },
    { label: 'Mensajes/Día (Prom)', value: '12,543', icon: MessageSquare, color: 'primary' },
    { label: 'Grupos Activos', value: '324', icon: Users2, color: 'secondary' },
  ]

  return (
    <div className="p-6 space-y-6">
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

      {/* Charts Placeholder */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6 border border-border">
          <h3 className="font-semibold text-foreground mb-4">Usuarios por Día</h3>
          <div className="h-64 bg-muted/30 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-2">📊</div>
              <p className="text-sm text-muted-foreground">Gráfico de usuarios registrados</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-border">
          <h3 className="font-semibold text-foreground mb-4">Mensajes por Hora</h3>
          <div className="h-64 bg-muted/30 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-2">📈</div>
              <p className="text-sm text-muted-foreground">Actividad de mensajes</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="p-6 border border-border">
        <h3 className="font-semibold text-foreground mb-4">Actividad Reciente</h3>
        <div className="space-y-3">
          {[
            { action: 'Usuario registrado', user: 'Juan Pérez', time: 'Hace 2 minutos' },
            { action: 'Grupo creado', user: 'Equipo Proyecto', time: 'Hace 15 minutos' },
            { action: 'Usuario iniciado sesión', user: 'Ana García', time: 'Hace 1 hora' },
            { action: 'Mensaje reportado', user: 'Chat ID: 12345', time: 'Hace 3 horas' },
          ].map((activity, idx) => (
            <div key={idx} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div>
                <p className="text-sm font-medium text-foreground">{activity.action}</p>
                <p className="text-xs text-muted-foreground">{activity.user}</p>
              </div>
              <span className="text-xs text-muted-foreground">{activity.time}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
