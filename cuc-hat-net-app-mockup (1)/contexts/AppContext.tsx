'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

export type View = 'landing' | 'login' | 'register' | 'verify-sms' | 'profile-setup' | 'chat' | 'admin-login' | 'admin-dashboard'
export type ClientTab = 'chats' | 'groups' | 'contacts' | 'states' | 'settings'
export type AdminTab = 'dashboard' | 'users' | 'groups' | 'messages' | 'config' | 'security'

export interface User {
  id: string
  phone: string
  name: string
  photo?: string
  description?: string
  status: 'available' | 'busy' | 'away'
  createdAt: string
  active: boolean
}

export interface Chat {
  id: string
  participantId: string
  participantName: string
  participantPhoto?: string
  participantDescription?: string
  participantStatus?: 'available' | 'busy' | 'away'
  lastMessage: string
  lastMessageTime: string
  unread: number
  pinned: boolean
  archived: boolean
  isGroup: boolean
  silenced: boolean
}


export interface Message {
  id: string
  chatId: string
  senderId: string
  senderName: string
  content: string
  timestamp: string
  status: 'sending' | 'sent' | 'received' | 'seen'
  encrypted: boolean
  edited: boolean
  deletedForMe: boolean
  deletedForAll: boolean
  type: 'text' | 'image' | 'video' | 'audio' | 'file'
  mediaUrl?: string
}

export interface Group {
  id: string
  name: string
  photo?: string
  description?: string
  rules?: string
  members: Array<{ id: string; name: string; role: 'admin' | 'member' }>
  createdAt: string
  creatorId: string
  permissions: {
    sendMessages: 'all' | 'admins'
    editInfo: 'all' | 'admins'
  }
}

export interface Contact {
  id: string
  name: string
  phone: string
  photo?: string
  description?: string
  status: 'available' | 'busy' | 'away'
  fromAgenda: boolean
}

export interface State {
  id: string
  userId: string
  userName: string
  userPhoto?: string
  content: string
  type: 'text' | 'image'
  createdAt: string
  expiresAt: string
  viewedBy: string[]
}

export interface AdminUser {
  id: string
  phone: string
  name: string
  status: 'active' | 'inactive' | 'suspended'
  createdAt: string
  lastActive: string
}

export interface AdminLog {
  id: string
  timestamp: string
  action: string
  user: string
  details: string
  severity: 'info' | 'warning' | 'error'
}

export interface AdminConfig {
  maxGroupSize: number
  messageTimeout: number
  maxFileSize: number
  maintenanceMode: boolean
  e2eRequired: boolean
  autoArchiveInactivity: number
}

export interface SecurityPolicy {
  blockAfterFailedAttempts: number
  blockDuration: number
  keyRotationDays: number
  enableDeviceDetection: boolean
  enableIdentityVerification: boolean
  requireE2EEncryption: boolean
  suspiciousLoginTimeout: number
}

interface AppContextType {
  // Navigation
  currentView: View
  setCurrentView: (view: View) => void
  currentUser: User | null
  setCurrentUser: (user: User | null) => void
  isAdmin: boolean
  setIsAdmin: (admin: boolean) => void

  // Tabs
  clientTab: ClientTab
  setClientTab: (tab: ClientTab) => void
  adminTab: AdminTab
  setAdminTab: (tab: AdminTab) => void

  // Current selections
  currentChatId: string | null
  setCurrentChatId: (id: string | null) => void
  currentGroupId: string | null
  setCurrentGroupId: (id: string | null) => void

  // Client data
  chats: Chat[]
  setChats: React.Dispatch<React.SetStateAction<Chat[]>>

  messages: Message[]
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>

  groups: Group[]
  setGroups: React.Dispatch<React.SetStateAction<Group[]>>

  contacts: Contact[]
  setContacts: React.Dispatch<React.SetStateAction<Contact[]>>

  states: State[]
  setStates: React.Dispatch<React.SetStateAction<State[]>>

  mutedContacts: string[]
  setMutedContacts: React.Dispatch<React.SetStateAction<string[]>>


  // Admin data
  adminUsers: AdminUser[]
  setAdminUsers: (users: AdminUser[]) => void
  adminLogs: AdminLog[]
  setAdminLogs: (logs: AdminLog[]) => void
  adminConfig: AdminConfig
  setAdminConfig: (config: AdminConfig) => void
  securityPolicy: SecurityPolicy
  setSecurityPolicy: (policy: SecurityPolicy) => void

  // UI
  showModal: boolean
  setShowModal: (show: boolean) => void
  modalContent: string
  setModalContent: (content: string) => void
  toast: { message: string; type: 'success' | 'error' | 'info' } | null
  setToast: React.Dispatch<React.SetStateAction<{ message: string; type: 'success' | 'error' | 'info' } | null>>
  showToast: (message: string, type: 'success' | 'error' | 'info') => void

  // Helpers
  loadFromLocalStorage: () => void
  saveToLocalStorage: () => void
  createDirectChat: (contactId: string, contactName: string, contactPhoto?: string) => void
  createGroupChat: (groupName: string, memberIds: string[], groupPhoto?: string, groupDescription?: string) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

const DEFAULT_ADMIN_CONFIG: AdminConfig = {
  maxGroupSize: 500,
  messageTimeout: 24,
  maxFileSize: 100,
  maintenanceMode: false,
  e2eRequired: true,
  autoArchiveInactivity: 90,
}

const DEFAULT_SECURITY_POLICY: SecurityPolicy = {
  blockAfterFailedAttempts: 5,
  blockDuration: 15,
  keyRotationDays: 90,
  enableDeviceDetection: true,
  enableIdentityVerification: true,
  requireE2EEncryption: true,
  suspiciousLoginTimeout: 30,
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentView, setCurrentView] = useState<View>('landing')
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [clientTab, setClientTab] = useState<ClientTab>('chats')
  const [adminTab, setAdminTab] = useState<AdminTab>('dashboard')
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [currentGroupId, setCurrentGroupId] = useState<string | null>(null)

  const [chats, setChats] = useState<Chat[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [states, setStates] = useState<State[]>([])
  const [mutedContacts, setMutedContacts] = useState<string[]>([])

  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [adminLogs, setAdminLogs] = useState<AdminLog[]>([])
  const [adminConfig, setAdminConfig] = useState<AdminConfig>(DEFAULT_ADMIN_CONFIG)
  const [securityPolicy, setSecurityPolicy] = useState<SecurityPolicy>(DEFAULT_SECURITY_POLICY)

  const [showModal, setShowModal] = useState(false)
  const [modalContent, setModalContent] = useState('')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  // Helper functions to create chats and groups
  const createDirectChat = (contactId: string, contactName: string, contactPhoto?: string) => {
    const existingChat = chats.find((c) => c.participantId === contactId && !c.isGroup)
    if (existingChat) {
      setCurrentChatId(existingChat.id)
      return
    }

    const contact = contacts.find((c) => c.id === contactId)

    const newChat: Chat = {
      id: `chat-${contactId}-${Date.now()}`,
      participantId: contactId,
      participantName: contactName,
      participantPhoto: contactPhoto,
      participantDescription: contact?.description,
      participantStatus: contact?.status,
      lastMessage: 'Sin mensajes aún',
      lastMessageTime: new Date().toISOString(),
      unread: 0,
      pinned: false,
      archived: false,
      isGroup: false,
      silenced: false,
    }


    const updatedChats = [...chats, newChat]
    setChats(updatedChats)
    setCurrentChatId(newChat.id)
  }

  const createGroupChat = (groupName: string, memberIds: string[], groupPhoto?: string, groupDescription?: string) => {
    const groupId = `group-${Date.now()}`

    // Get selected members details
    const groupMembers = memberIds.map((memberId) => {
      const contact = contacts.find((c) => c.id === memberId)
      return {
        id: memberId,
        name: contact?.name || 'Unknown',
        role: 'member' as const,
      }
    })

    // Add current user as admin
    if (currentUser) {
      groupMembers.unshift({
        id: currentUser.id,
        name: currentUser.name,
        role: 'admin',
      })
    }

    // Create group
    const newGroup: Group = {
      id: groupId,
      name: groupName,
      photo: groupPhoto || '👥',
      description: groupDescription,
      rules: '',
      members: groupMembers,
      createdAt: new Date().toISOString(),
      creatorId: currentUser?.id || '',
      permissions: {
        sendMessages: 'all',
        editInfo: 'admins',
      },
    }

    // Create associated chat
    const newChat: Chat = {
      id: groupId,
      participantId: groupId,
      participantName: groupName,
      participantPhoto: groupPhoto || '👥',
      lastMessage: 'Grupo creado recientemente',
      lastMessageTime: new Date().toISOString(),
      unread: 0,
      pinned: false,
      archived: false,
      isGroup: true,
      silenced: false,
    }

    setGroups([...groups, newGroup])
    setChats([...chats, newChat])
    setCurrentChatId(newChat.id)
  }

  // Load from localStorage on mount
  const loadFromLocalStorage = () => {
    if (typeof window === 'undefined') return
    try {
      const saved = localStorage.getItem('cuchatnet_state')
      const savedUser = localStorage.getItem('cuchatnet_currentUser')

      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser))
      }

      if (saved) {
        const data = JSON.parse(saved)
        if (data.chats) setChats(data.chats)
        if (data.groups) setGroups(data.groups)
        if (data.contacts) setContacts(data.contacts)
        if (data.states) setStates(data.states)
        if (data.messages) setMessages(data.messages)
        if (data.mutedContacts) setMutedContacts(data.mutedContacts)
        if (data.adminUsers) setAdminUsers(data.adminUsers)
        if (data.adminLogs) setAdminLogs(data.adminLogs)
        if (data.adminConfig) setAdminConfig(data.adminConfig)
        if (data.securityPolicy) setSecurityPolicy(data.securityPolicy)
      }
      setIsLoaded(true)
    } catch (e) {
      console.error('Failed to load from localStorage', e)
      setIsLoaded(true)
    }
  }

  // Save to localStorage
  const saveToLocalStorage = () => {
    if (typeof window === 'undefined') return
    try {
      if (currentUser) {
        localStorage.setItem('cuchatnet_currentUser', JSON.stringify(currentUser))
      }

      const state = {
        chats,
        groups,
        contacts,
        states,
        messages,
        mutedContacts,
        adminUsers,
        adminLogs,
        adminConfig,
        securityPolicy,
      }
      localStorage.setItem('cuchatnet_state', JSON.stringify(state))
    } catch (e) {
      console.error('Failed to save to localStorage', e)
    }
  }

  // Load on mount
  useEffect(() => {
    loadFromLocalStorage()
  }, [])

  // Save whenever state changes
  useEffect(() => {
    if (isLoaded) {
      saveToLocalStorage()
    }
  }, [currentUser, chats, groups, contacts, states, messages, mutedContacts, adminUsers, adminLogs, adminConfig, securityPolicy, isLoaded])

  // 🔄 Sincronizar chats cuando el usuario actual cambia su perfil
  useEffect(() => {
    if (!currentUser) return

    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat.participantId === currentUser.id
          ? {
            ...chat,
            participantName: currentUser.name,
            participantPhoto: currentUser.photo,
            participantDescription: currentUser.description,
            participantStatus: currentUser.status,
          }
          : chat
      )
    )
  }, [currentUser])


  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  return (
    <AppContext.Provider
      value={{
        currentView,
        setCurrentView,
        currentUser,
        setCurrentUser,
        isAdmin,
        setIsAdmin,
        clientTab,
        setClientTab,
        adminTab,
        setAdminTab,
        currentChatId,
        setCurrentChatId,
        currentGroupId,
        setCurrentGroupId,
        chats,
        setChats,
        groups,
        setGroups,
        contacts,
        setContacts,
        states,
        setStates,
        messages,
        setMessages,
        mutedContacts,
        setMutedContacts,
        adminUsers,
        setAdminUsers,
        adminLogs,
        setAdminLogs,
        adminConfig,
        setAdminConfig,
        securityPolicy,
        setSecurityPolicy,
        showModal,
        setShowModal,
        modalContent,
        setModalContent,
        toast,
        setToast,
        showToast,
        loadFromLocalStorage,
        saveToLocalStorage,
        createDirectChat,
        createGroupChat,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }
  return context
}
