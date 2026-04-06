import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api-client'

export type BackendAuthUser = {
  id: number
  phone: string
  email?: string | null
  name: string
  photo?: string | null
  description?: string | null
  status: string
  role?: string | null
  createdAt: string
  active: boolean
}

export function mapAuthUser(user: BackendAuthUser) {
  return {
    id: String(user.id),
    phone: user.phone,
    name: user.name,
    photo: user.photo ?? undefined,
    description: user.description ?? undefined,
    status: normalizeStatus(user.status),
    createdAt: user.createdAt,
    active: user.active,
  }
}

function normalizeStatus(status?: string | null): 'available' | 'busy' | 'away' {
  if (status === 'busy' || status === 'away') return status
  return 'available'
}

export async function loadClientData(userId: string) {
  const numericUserId = Number(userId)
  const [rawChats, rawContacts, rawStates] = await Promise.all([
    apiGet<any[]>(`/api/users/${numericUserId}/chats`).catch(() => []),
    apiGet<any[]>(`/api/users/${numericUserId}/contacts`).catch(() => []),
    apiGet<any[]>(`/api/users/${numericUserId}/states-feed`).catch(() => []),
  ])

  const chats = rawChats.map((chat) => ({
    id: String(chat.id),
    participantId: String(chat.participantId),
    participantName: chat.participantName,
    participantPhoto: chat.participantPhoto ?? undefined,
    participantDescription: chat.participantDescription ?? undefined,
    participantStatus: normalizeStatus(chat.participantStatus),
    lastMessage: chat.lastMessage,
    lastMessageTime: chat.lastMessageTime ?? new Date().toISOString(),
    unread: chat.unread ?? 0,
    pinned: chat.pinned ?? false,
    archived: chat.archived ?? false,
    isGroup: chat.isGroup ?? false,
    silenced: chat.silenced ?? false,
  }))

  const contacts = rawContacts.map((contact) => ({
    id: String(contact.id),
    name: contact.name,
    phone: contact.phone,
    photo: contact.photo ?? undefined,
    description: contact.description ?? undefined,
    status: normalizeStatus(contact.status),
    fromAgenda: contact.fromAgenda ?? true,
  }))

  const groupChats = chats.filter((chat) => chat.isGroup)
  const rawGroups = await Promise.all(
    groupChats.map((group) =>
      apiGet<any>(`/api/chats/${group.id}/group-detail`).catch(() => null)
    )
  )

  const groups: any[] = rawGroups.filter(Boolean).map((group: any) => ({
  id: String(group.id),
  name: group.name,
  photo: group.photo ?? undefined,
  description: group.description ?? undefined,
  rules: group.rules ?? undefined,
  members: (group.members ?? []).map((member: any) => ({
    id: String(member.id),
    name: member.name,
    role: member.role === 'admin' ? 'admin' : 'member',
  })),
  createdAt: group.createdAt,
  creatorId: String(group.creatorId),
  permissions: {
    sendMessages: group.sendMessagesPermission === 'admins' ? 'admins' as 'admins' : 'all' as 'all',
    editInfo: group.editInfoPermission === 'all' ? 'all' as 'all' : 'admins' as 'admins',
  },
}))

  const states: any[] = rawStates.map((state: any) => ({
  id: String(state.id),
  userId: String(state.userId),
  userName: state.userName,
  userPhoto: state.userPhoto ?? undefined,
  content: state.content,
  type: state.type === 'image' ? 'image' as 'image' : 'text' as 'text',
  createdAt: state.createdAt,
  expiresAt: state.expiresAt,
  viewedBy: (state.viewedBy ?? []).map((id: number) => String(id)),
}))

  return { chats, contacts, groups, states }
}

export async function createDirectChat(currentUserId: string, contactUserId: string) {
  return apiPost<{ chatId: number }>(`/api/chats/direct`, {
    currentUserId: Number(currentUserId),
    contactUserId: Number(contactUserId),
  })
}

export async function createGroup(currentUserId: string, groupName: string, memberIds: string[], groupPhoto?: string, groupDescription?: string) {
  return apiPost<{ chatId: number }>(`/api/chats/group`, {
    currentUserId: Number(currentUserId),
    groupName,
    groupPhoto,
    groupDescription,
    memberIds: memberIds.map((id) => Number(id)),
  })
}

export async function updateGroup(groupId: string, payload: {
  name: string
  photo?: string
  description?: string
  rules?: string
  sendMessagesPermission: 'all' | 'admins'
  editInfoPermission: 'all' | 'admins'
}) {
  return apiPut(`/api/chats/${Number(groupId)}/group-detail`, payload)
}

export async function deleteGroup(groupId: string) {
  return apiDelete(`/api/admin/groups/${Number(groupId)}`)
}

export async function createState(userId: string, payload: { content: string; type?: 'text' | 'image'; mediaUrl?: string }) {
  return apiPost(`/api/users/${Number(userId)}/states`, {
    userId: Number(userId),
    content: payload.content,
    type: payload.type ?? 'text',
    mediaUrl: payload.mediaUrl,
  })
}

export async function viewState(stateId: string, userId: string) {
  return apiPost(`/api/states/${Number(stateId)}/view`, { userId: Number(userId) })
}
