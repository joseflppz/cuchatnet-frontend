'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { apiFetch } from "@/lib/api";

// --- TIPOS E INTERFACES ---
export type View = 'landing' | 'login' | 'register' | 'verify-sms' | 'profile-setup' | 'chat' | 'admin-login' | 'admin-dashboard'
export type ClientTab = 'chats' | 'groups' | 'contacts' | 'states' | 'settings'
export type AdminTab = 'dashboard' | 'users' | 'groups' | 'messages' | 'config' | 'security'

export interface User { id: string; phone: string; name: string; nombre?: string; photo?: string; description?: string; status: 'available' | 'busy' | 'away'; createdAt: string; active: boolean; }
export interface Chat { id: string; participantId: string; participantName: string; participantPhoto?: string; participantDescription?: string; participantStatus?: 'available' | 'busy' | 'away'; lastMessage: string; lastMessageTime: string; unread: number; pinned: boolean; archived: boolean; isGroup: boolean; silenced: boolean; }
export interface Message { id: string; chatId: string; senderId: string; senderName: string; content: string; timestamp: string; status: 'sending' | 'sent' | 'received' | 'seen'; encrypted: boolean; edited: boolean; deletedForMe: boolean; deletedForAll: boolean; type: 'text' | 'image' | 'video' | 'audio' | 'file'; mediaUrl?: string; }
export interface Group { id: string; name: string; photo?: string; description?: string; rules?: string; members: Array<{ id: string; name: string; role: 'admin' | 'member' }>; createdAt: string; creatorId: string; permissions: { sendMessages: 'all' | 'admins'; editInfo: 'all' | 'admins' }; }
export interface Contact { id: string; name: string; phone: string; photo?: string; description?: string; status: 'available' | 'busy' | 'away'; fromAgenda: boolean; }
export interface State { id: string; userId: string; userName: string; userPhoto?: string; content: string; type: 'text' | 'image' | 'video'; createdAt: string; expiresAt: string; viewedBy: string[]; }
export interface AdminUser { id: string; phone: string; name: string; status: 'active' | 'inactive' | 'suspended'; createdAt: string; lastActive: string; }
export interface AdminLog { id: string; timestamp: string; action: string; user: string; details: string; severity: 'info' | 'warning' | 'error'; }
export interface AdminConfig { maxGroupSize: number; messageTimeout: number; maxFileSize: number; maintenanceMode: boolean; e2eRequired: boolean; autoArchiveInactivity: number; }
export interface SecurityPolicy { blockAfterFailedAttempts: number; blockDuration: number; keyRotationDays: number; enableDeviceDetection: boolean; enableIdentityVerification: boolean; requireE2EEncryption: boolean; suspiciousLoginTimeout: number; }

interface AppContextType {
  currentView: View; setCurrentView: (view: View) => void;
  currentUser: User | null; setCurrentUser: (user: User | null) => void;
  isAdmin: boolean; setIsAdmin: (admin: boolean) => void;
  clientTab: ClientTab; setClientTab: (tab: ClientTab) => void;
  adminTab: AdminTab; setAdminTab: (tab: AdminTab) => void;
  currentChatId: string | null; setCurrentChatId: (id: string | null) => void;
  currentGroupId: string | null; setCurrentGroupId: (id: string | null) => void;
  chats: Chat[]; setChats: React.Dispatch<React.SetStateAction<Chat[]>>;
  messages: Message[]; setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  groups: Group[]; setGroups: React.Dispatch<React.SetStateAction<Group[]>>;
  contacts: Contact[]; setContacts: React.Dispatch<React.SetStateAction<Contact[]>>;
  states: State[]; setStates: React.Dispatch<React.SetStateAction<State[]>>;
  mutedContacts: string[]; setMutedContacts: React.Dispatch<React.SetStateAction<string[]>>;
  adminUsers: AdminUser[]; setAdminUsers: (users: AdminUser[]) => void;
  adminLogs: AdminLog[]; setAdminLogs: (logs: AdminLog[]) => void;
  adminConfig: AdminConfig; setAdminConfig: (config: AdminConfig) => void;
  securityPolicy: SecurityPolicy; setSecurityPolicy: (policy: SecurityPolicy) => void;
  showModal: boolean; setShowModal: (show: boolean) => void;
  modalContent: string; setModalContent: (content: string) => void;
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  setToast: React.Dispatch<React.SetStateAction<{ message: string; type: 'success' | 'error' | 'info' } | null>>;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
  logout: () => void;
  loadFromLocalStorage: () => void;
  saveToLocalStorage: () => void;
  fetchChats: () => Promise<void>;
  createDirectChat: (contactId: string, contactName: string, contactPhoto?: string) => Promise<void>;
  createGroupChat: (groupName: string, memberIds: string[], groupPhoto?: string, groupDescription?: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined)

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
  const [adminConfig, setAdminConfig] = useState<AdminConfig>({ maxGroupSize: 500, messageTimeout: 24, maxFileSize: 100, maintenanceMode: false, e2eRequired: true, autoArchiveInactivity: 90 })
  const [securityPolicy, setSecurityPolicy] = useState<SecurityPolicy>({ blockAfterFailedAttempts: 5, blockDuration: 15, keyRotationDays: 90, enableDeviceDetection: true, enableIdentityVerification: true, requireE2EEncryption: true, suspiciousLoginTimeout: 30 })
  const [showModal, setShowModal] = useState(false)
  const [modalContent, setModalContent] = useState('')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  // --- PERSISTENCIA INTEGRADA ---
  const loadFromLocalStorage = () => {
    if (typeof window === 'undefined') return
    try {
      // Usamos solo 'user' para evitar conflictos entre llaves viejas y nuevas
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        const userId = (parsedUser.usuarioId || parsedUser.id)?.toString();
        
        if (userId && userId !== "undefined") {
          setCurrentUser({ ...parsedUser, id: userId });
          
          // Cargar chats específicos para este ID para evitar mezcla de cuentas
          const savedChats = localStorage.getItem(`chats_${userId}`);
          if (savedChats) setChats(JSON.parse(savedChats));
        }
      }
      setIsLoaded(true);
    } catch (e) {
      console.error("Error cargando LocalStorage:", e);
      setIsLoaded(true);
    }
  }

  const saveToLocalStorage = () => {
    if (typeof window === 'undefined' || !isLoaded || !currentUser) return
    try {
      localStorage.setItem('user', JSON.stringify(currentUser));
      localStorage.setItem(`chats_${currentUser.id}`, JSON.stringify(chats));
    } catch (e) { console.error(e); }
  }

  const logout = () => {
    localStorage.clear(); // Limpieza total para seguridad entre sesiones
    setCurrentUser(null);
    setChats([]);
    setMessages([]);
    setContacts([]);
    setGroups([]);
    setCurrentChatId(null);
    setCurrentView('landing');
  }

  useEffect(() => { loadFromLocalStorage() }, [])

  useEffect(() => {
    if (isLoaded && currentUser) {
      saveToLocalStorage();
      fetchChats();
    }
  }, [currentUser, isLoaded])

  // --- FETCH DE CHATS (REFORZADO) ---
  const fetchChats = async () => {
    if (!currentUser?.id) return;
    try {
      const data = await apiFetch(`chats/${currentUser.id}`);
      if (!Array.isArray(data)) return;

      const mappedChats: Chat[] = data.map((c: any) => {
        // Detectar el nombre real basado en las propiedades del backend observadas
        const name = c.nombre || c.otroUsuarioNombre || c.nombreGrupo || c.otherUserName || (c.esGrupo ? "Grupo" : "Chat Privado");
        
        return {
          id: (c.id || c.chatId || c.idChat).toString(),
          participantId: (c.otroUsuarioId || c.otherUserId || c.idParticipante || '').toString(),
          participantName: name, 
          participantPhoto: c.fotoUrl || c.foto || "",
          lastMessage: c.ultimoMensaje || c.lastMessage || "Sin mensajes",
          lastMessageTime: c.fechaUltimoMensaje || c.lastMessageTime || new Date().toISOString(),
          unread: 0, pinned: false, archived: false, isGroup: c.esGrupo || false, silenced: false,
        };
      });
      
      setChats(mappedChats);
      localStorage.setItem(`chats_${currentUser.id}`, JSON.stringify(mappedChats));
    } catch (error) { 
      console.error("Error en fetchChats:", error); 
    }
  };

  // --- CREAR CHAT (CON VALIDACIÓN DE DUPLICADOS) ---
  const createDirectChat = async (contactId: string, contactName: string, contactPhoto?: string) => {
    if (!currentUser?.id) return;
    
    // Evitar crear un chat si ya existe uno con este contacto
    const existing = chats.find(c => String(c.participantId) === String(contactId) && !c.isGroup);
    if (existing) {
      setCurrentChatId(existing.id);
      setClientTab('chats');
      return;
    }

    try {
      const response = await apiFetch('chats', {
        method: 'POST',
        body: JSON.stringify({
          userId: Number(currentUser.id),
          participantesIds: [Number(currentUser.id), Number(contactId)],
          esGrupo: false,
          nombreGrupo: ""
        })
      });

      const newId = (response.id || response.chatId || response.idChat).toString();

      const newChat: Chat = {
        id: newId,
        participantId: contactId,
        participantName: contactName,
        participantPhoto: contactPhoto || "",
        lastMessage: "Nuevo chat",
        lastMessageTime: new Date().toISOString(),
        unread: 0, pinned: false, archived: false, isGroup: false, silenced: false
      };

      setChats(prev => [newChat, ...prev]);
      setCurrentChatId(newId);
      setClientTab('chats');
      
    } catch (error) {
      showToast("Error al conectar con el chat", "error");
    }
  }

  // --- CREAR GRUPO ---
  const createGroupChat = async (groupName: string, memberIds: string[], groupPhoto?: string, groupDescription?: string) => {
    if (!currentUser?.id) return;
    try {
      const response = await apiFetch('chats', {
        method: 'POST',
        body: JSON.stringify({
          userId: Number(currentUser.id),
          participantesIds: [...memberIds.map(id => Number(id)), Number(currentUser.id)],
          esGrupo: true,
          nombreGrupo: groupName
        })
      });

      const newId = (response.id || response.chatId || response.idChat).toString();

      const newGroup: Chat = {
        id: newId,
        participantId: "0",
        participantName: groupName,
        participantPhoto: groupPhoto || "",
        lastMessage: "Grupo creado",
        lastMessageTime: new Date().toISOString(),
        unread: 0, pinned: false, archived: false, isGroup: true, silenced: false
      };

      setChats(prev => [newGroup, ...prev]);
      setCurrentChatId(newId);
      setClientTab('chats');
      showToast("Grupo creado con éxito", "success");
    } catch (error) {
      showToast("Error al crear el grupo", "error");
    }
  }

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type }); setTimeout(() => setToast(null), 3000);
  }

  return (
    <AppContext.Provider value={{
      currentView, setCurrentView, currentUser, setCurrentUser, isAdmin, setIsAdmin,
      clientTab, setClientTab, adminTab, setAdminTab, currentChatId, setCurrentChatId,
      currentGroupId, setCurrentGroupId, chats, setChats, groups, setGroups,
      contacts, setContacts, states, setStates, messages, setMessages,
      mutedContacts, setMutedContacts, adminUsers, setAdminUsers, adminLogs, setAdminLogs,
      adminConfig, setAdminConfig, securityPolicy, setSecurityPolicy,
      showModal, setShowModal, modalContent, setModalContent, toast, setToast, showToast,
      logout, loadFromLocalStorage, saveToLocalStorage, fetchChats,
      createDirectChat, createGroupChat
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used within AppProvider')
  return context
}