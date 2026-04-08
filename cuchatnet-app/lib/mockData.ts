/**
 * Helper functions for mockup data
 */

export function getExpiryTime(createdAt: string): string {
  const now = new Date()
  const created = new Date(createdAt)
  const diffHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60)
  
  if (diffHours < 1) return 'en ~23h'
  if (diffHours < 12) return `en ~${24 - Math.floor(diffHours)}h`
  if (diffHours < 24) return 'en ~1h'
  return 'Expirado'
}

export function formatMessageTime(timestamp: string): string {
  const now = new Date()
  const msg = new Date(timestamp)
  const diffMinutes = (now.getTime() - msg.getTime()) / (1000 * 60)
  
  if (diffMinutes < 1) return 'Ahora'
  if (diffMinutes < 60) return `${Math.floor(diffMinutes)}m`
  
  const diffHours = diffMinutes / 60
  if (diffHours < 24) return `${Math.floor(diffHours)}h`
  
  return msg.toLocaleDateString('es-ES')
}

export function getStatusText(status: 'available' | 'busy' | 'away'): string {
  const statusMap = {
    available: 'Disponible',
    busy: 'Ocupado',
    away: 'Ausente',
  }
  return statusMap[status] || status
}
