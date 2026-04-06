'use client'

import { Search, Trash2, Users, Eye, X } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'

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

interface Group {
  id: number
  name: string
  creator: string
  members: number
  created: string
  messages: number
  description: string | null
}

interface Member {
  participanteId: number
  usuarioId: number
  nombre: string
  email: string | null
  rol: string
  fechaUnion: string
}

function MembersModal({ open, groupName, members, onClose }: {
  open: boolean
  groupName: string
  members: Member[]
  onClose: () => void
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full overflow-hidden border border-border">
        <div className="border-b border-border p-4 flex items-center justify-between">
          <h2 className="font-bold text-lg text-foreground">Miembros — {groupName}</h2>
          <button onClick={onClose} className="text-foreground/60 hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
          {members.length === 0 && <p className="text-sm text-muted-foreground">Sin miembros activos.</p>}
          {members.map((m) => (
            <div key={m.participanteId} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div>
                <p className="text-sm font-medium text-foreground">{m.nombre}</p>
                <p className="text-xs text-muted-foreground">{m.email ?? '—'}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${m.rol === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                {m.rol}
              </span>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-border">
          <Button variant="outline" onClick={onClose} className="w-full">Cerrar</Button>
        </div>
      </div>
    </div>
  )
}

export default function AdminGroupsView() {
  const [groups, setGroups] = useState<Group[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [membersGroupName, setMembersGroupName] = useState('')
  const [showMembers, setShowMembers] = useState(false)

  const fetchGroups = (p = 1, s = '') => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(p), pageSize: '20' })
    if (s) params.append('search', s)
    apiFetch<any>(`/api/admin/groups?${params}`)
      .then(res => {
        if (Array.isArray(res)) {
          setGroups(res)
          setTotal(res.length)
          setTotalPages(1)
          setPage(1)
        } else {
          setGroups(res.data ?? [])
          setTotal(res.total ?? 0)
          setTotalPages(res.totalPages ?? 1)
          setPage(res.page ?? 1)
        }
      })
      .catch(() => setError('Error al cargar grupos'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchGroups() }, [])

  const handleSearch = () => {
    setSearch(searchInput)
    fetchGroups(1, searchInput)
  }

  const handleDelete = async (groupId: number, name: string) => {
    if (!window.confirm(`¿Eliminar el grupo "${name}"?`)) return
    try {
      await apiFetch(`/api/admin/groups/${groupId}`, { method: 'DELETE' })
      fetchGroups(page, search)
    } catch {
      alert('Error al eliminar grupo')
    }
  }

  const handleViewMembers = async (groupId: number, name: string) => {
    try {
      const data = await apiFetch<Member[]>(`/api/admin/groups/${groupId}/members`)
      setMembers(data)
      setMembersGroupName(name)
      setShowMembers(true)
    } catch {
      alert('Error al cargar miembros')
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex gap-2 flex-1 max-w-md w-full">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Buscar por nombre de grupo..."
              className="w-full pl-9 pr-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary"
            />
          </div>
          <Button onClick={handleSearch} className="bg-primary hover:bg-primary/90">
            Buscar
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">{total} grupos en total</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <p className="text-muted-foreground">Cargando grupos...</p>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-40">
          <p className="text-red-500">{error}</p>
        </div>
      ) : (
        <Card className="border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-6 py-3 text-left font-semibold text-foreground">Nombre</th>
                  <th className="px-6 py-3 text-left font-semibold text-foreground">Creador</th>
                  <th className="px-6 py-3 text-left font-semibold text-foreground">Miembros</th>
                  <th className="px-6 py-3 text-left font-semibold text-foreground">Mensajes</th>
                  <th className="px-6 py-3 text-left font-semibold text-foreground">Creado</th>
                  <th className="px-6 py-3 text-left font-semibold text-foreground">Descripción</th>
                  <th className="px-6 py-3 text-left font-semibold text-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((group) => (
                  <tr key={group.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-3 font-medium text-foreground">{group.name}</td>
                    <td className="px-6 py-3 text-muted-foreground">{group.creator}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{group.members}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-muted-foreground">{group.messages}</td>
                    <td className="px-6 py-3 text-muted-foreground text-xs">
                      {new Date(group.created).toLocaleDateString('es-CR')}
                    </td>
                    <td className="px-6 py-3 text-muted-foreground text-xs max-w-xs truncate">
                      {group.description ?? '—'}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewMembers(group.id, group.name)}
                          className="p-1 hover:bg-muted rounded"
                          title="Ver miembros"
                        >
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => handleDelete(group.id, group.name)}
                          className="p-1 hover:bg-red-100 rounded"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {groups.length === 0 && (
                  <tr>
                    <td className="px-6 py-6 text-sm text-muted-foreground" colSpan={7}>
                      No hay grupos.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Página {page} de {totalPages}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => fetchGroups(page - 1, search)}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => fetchGroups(page + 1, search)}
          >
            Siguiente
          </Button>
        </div>
      </div>

      <MembersModal
        open={showMembers}
        groupName={membersGroupName}
        members={members}
        onClose={() => setShowMembers(false)}
      />
    </div>
  )
}