'use client'

import { useApp } from '@/contexts/AppContext'
import * as signalR from "@microsoft/signalr"
import { 
  Send, FileText, MoreVertical, Loader2, Paperclip, Mic, X, CheckCheck, Check, AlertCircle 
} from 'lucide-react'
import { useEffect, useRef, useState, useCallback } from 'react'
import { getMessages, sendMessage, uploadFile, markChatAsRead } from "@/lib/api" 

export default function ChatWindow() {
  const { currentChatId, chats, currentUser, groups } = useApp()
  const [messageText, setMessageText] = useState('')
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [inlineError, setInlineError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isRecording, setIsRecording] = useState(false) 
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isPartnerOnline, setIsPartnerOnline] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)

  const connectionRef = useRef<signalR.HubConnection | null>(null)
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)

  const API_BASE_URL = "https://localhost:7086";

  // Buscar si es un chat directo o un grupo en ambos arrays
  const currentChat = chats.find(c => String(c.id) === String(currentChatId)) || 
                     groups.find(g => String(g.id) === String(currentChatId));

  // --- 1. CARGA DE HISTORIAL ---
  const loadData = useCallback(async () => {
    if (!currentChatId || currentChatId === '0' || !currentUser?.id) return;
    
    try {
      setLoadingHistory(true);
      setInlineError(null);
      const data = await getMessages(currentChatId, currentUser.id);
      setChatMessages(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Error al cargar mensajes:", err);
      setInlineError("Error al cargar historial");
    } finally {
      setLoadingHistory(false);
    }
  }, [currentChatId, currentUser?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // --- 2. SIGNALR: TIEMPO REAL ---
  useEffect(() => {
    if (!currentChatId || !currentUser || currentChatId === '0') return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_BASE_URL}/chathub?userId=${currentUser.id}`)
      .withAutomaticReconnect()
      .build();

    const startConnection = async () => {
      try {
        await connection.start();
        await connection.invoke("JoinChat", String(currentChatId));
        await markChatAsRead(currentChatId, currentUser.id);
      } catch (err) {
        setTimeout(startConnection, 5000);
      }
    };

    startConnection();

    connection.on("ReceiveMessage", async (msg) => {
      if (String(msg.chatId || msg.chatId) === String(currentChatId)) {
        setChatMessages(prev => {
          const newId = msg.id || msg.mensajeId;
          if (prev.some(m => (m.id || m.mensajeId) === newId)) return prev;
          return [...prev, msg];
        });

        if (String(msg.senderId || msg.remitenteUsuarioId) !== String(currentUser.id)) {
          await markChatAsRead(currentChatId, currentUser.id);
        }
      }
    });

    connection.on("ChatReadByPeer", (peerId) => {
      if (String(peerId) !== String(currentUser.id)) {
        setChatMessages(prev => prev.map(m => ({ ...m, status: 'seen', estado: 'seen' })));
      }
    });

    connection.on("UserStatusChanged", (userId, isOnline) => {
      if (currentChat && String(userId) === String((currentChat as any).participantId)) {
        setIsPartnerOnline(isOnline);
      }
    });

    connectionRef.current = connection;
    return () => { connection.stop(); };
  }, [currentChatId, currentUser]);

  useEffect(() => { 
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) 
  }, [chatMessages]);

  const getFileUrl = (url: string) => {
    if (!url) return "";
    return url.startsWith("http") ? url : `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const renderStatus = (m: any) => {
    const isMe = String(m.senderId || m.remitenteUsuarioId) === String(currentUser?.id);
    if (!isMe) return null;
    const s = (m.status || m.estado || 'sent').toLowerCase();
    if (s === 'seen') return <CheckCheck size={14} className="text-blue-500" />;
    if (s === 'received') return <CheckCheck size={14} className="text-gray-400" />;
    return <Check size={14} className="text-gray-400" />;
  };

  // --- 3. ACCIONES: ENVIAR, ARCHIVOS, AUDIO ---
  const handleSendMessage = async (content?: string, type: string = "text") => {
    if (!currentUser || !currentChatId) return;
    const finalContent = typeof content === 'string' ? content : messageText.trim();
    if (!finalContent) return;

    if (type === "text") setMessageText('');

    try {
      await sendMessage(currentChatId, {
        senderId: Number(currentUser.id),
        content: finalContent,
        type: type
      });
    } catch (error: any) { 
      setInlineError("Error al enviar: " + (error.response?.data?.error || "Servidor offline")); 
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentChatId) return;
    setIsUploading(true);
    try {
      const response = await uploadFile(currentChatId, file); 
      const fileUrl = response?.url || response?.fileUrl;
      let type = "file";
      if (file.type.startsWith("image/")) type = "image";
      else if (file.type.startsWith("video/")) type = "video";
      else if (file.type.startsWith("audio/")) type = "audio";
      if (fileUrl) await handleSendMessage(fileUrl, type);
    } catch (error) { setInlineError("Error al subir archivo"); }
    finally { setIsUploading(false); if (e.target) e.target.value = ''; }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/ogg; codecs=opus' });
        const file = new File([blob], "voice_memo.ogg", { type: 'audio/ogg' });
        setIsUploading(true);
        const res = await uploadFile(currentChatId!, file);
        if (res?.url || res?.fileUrl) await handleSendMessage(res.url || res.fileUrl, "audio");
        setIsUploading(false);
      };
      recorder.start();
      setIsRecording(true);
    } catch (err) { console.error("Error microfono:", err); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  if (!currentChat || !currentUser) {
    return <div className="h-full flex items-center justify-center bg-[#efeae2] text-gray-500">Selecciona un chat o grupo</div>;
  }

  return (
    <div className="h-full flex flex-col bg-[#efeae2] relative overflow-hidden">
      {selectedImage && (
        <div className="absolute inset-0 z-50 bg-black/95 flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
          <img src={getFileUrl(selectedImage)} className="max-w-full max-h-full rounded shadow-2xl" alt="Preview" />
        </div>
      )}

      {inlineError && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[100] bg-red-600 text-white px-4 py-2 rounded-full text-xs font-bold shadow-xl flex items-center gap-2 animate-bounce">
          <AlertCircle size={14} /> {inlineError}
          <button onClick={() => setInlineError(null)} className="ml-2 hover:text-black">×</button>
        </div>
      )}

      {/* HEADER */}
      <div className="p-3 bg-[#f0f2f5] flex items-center justify-between border-b border-gray-300 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#E21B23] to-[#0A2E6D] rounded-full overflow-hidden flex items-center justify-center border border-gray-300 shadow-sm">
            {(currentChat as any).participantPhoto || (currentChat as any).photo ? (
              <img src={getFileUrl((currentChat as any).participantPhoto || (currentChat as any).photo)} className="w-full h-full object-cover" alt="" />
            ) : (
              <span className="text-white font-bold">{(currentChat as any).participantName?.charAt(0) || (currentChat as any).name?.charAt(0)}</span>
            )}
          </div>
          <div>
            <h2 className="font-bold text-gray-800 text-sm">{(currentChat as any).participantName || (currentChat as any).name}</h2>
            <p className={`text-[10px] ${isPartnerOnline ? 'text-green-600 font-bold' : 'text-gray-500'}`}>
              {currentChat.isGroup ? 'Grupo activo' : (isPartnerOnline ? '● en línea' : 'desconectado')}
            </p>
          </div>
        </div>
        <MoreVertical className="text-gray-500 cursor-pointer" size={20} />
      </div>

      {/* MENSAJES */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat">
        {loadingHistory && <div className="flex justify-center"><Loader2 className="animate-spin text-[#E21B23]" /></div>}
        
        {chatMessages.map((m: any) => {
          const isMe = String(m.senderId || m.remitenteUsuarioId) === String(currentUser.id);
          const type = (m.type || m.tipoMensaje || "text").toLowerCase();
          const content = m.content || m.contenido;
          const url = getFileUrl(content);

          return (
            <div key={m.id || m.mensajeId || Math.random()} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-1 duration-300`}>
              <div className={`p-2 rounded-lg shadow-sm max-w-[80%] relative ${isMe ? 'bg-[#dcf8c6] rounded-tr-none' : 'bg-white rounded-tl-none'}`}>
                {!isMe && currentChat.isGroup && (
                  <p className="text-[10px] font-bold text-[#0A2E6D] mb-1">{m.senderName || 'Usuario'}</p>
                )}
                {type === 'text' && <p className="text-[13.5px] text-gray-800 pr-4 break-words">{content}</p>}
                {type === 'image' && <img src={url} onClick={() => setSelectedImage(content)} className="rounded-md max-h-64 object-cover cursor-pointer" alt="" />}
                {type === 'video' && <video src={url} controls className="rounded-md max-h-64 w-full" />}
                {type === 'audio' && <audio src={url} controls className="w-52 h-10 mt-1" />}
                {type === 'file' && (
                  <a href={url} target="_blank" className="flex items-center gap-3 p-2 bg-black/5 rounded-md text-blue-700 text-xs font-semibold">
                    <FileText size={20} /> <span className="truncate max-w-[120px]">Archivo</span>
                  </a>
                )}
                <div className="flex justify-end items-center gap-1 mt-1 opacity-70">
                  <span className="text-[9px] text-gray-500">
                    {new Date(m.timestamp || m.fechaEnvio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {renderStatus(m)}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* INPUT */}
      <div className="p-2 bg-[#f0f2f5] flex items-center gap-2 border-t border-gray-300">
        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
        <button onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-600 hover:bg-gray-200 rounded-full">
          {isUploading ? <Loader2 className="animate-spin text-[#E21B23]" size={22} /> : <Paperclip size={22} className="rotate-45" />}
        </button>
        <input
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder={isRecording ? "Grabando audio..." : "Escribe un mensaje"}
          className="flex-1 p-2.5 px-4 rounded-full outline-none text-sm bg-white"
        />
        {!messageText.trim() ? (
          <button onMouseDown={startRecording} onMouseUp={stopRecording} className={`p-2 rounded-full ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'text-gray-600'}`}>
            <Mic size={22} />
          </button>
        ) : (
          <button onClick={() => handleSendMessage()} className="p-2 bg-[#00a884] text-white rounded-full">
            <Send size={22} />
          </button>
        )}
      </div>
    </div>
  )
}