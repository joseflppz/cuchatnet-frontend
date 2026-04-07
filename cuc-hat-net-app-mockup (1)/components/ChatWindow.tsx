'use client'

import { useApp } from '@/contexts/AppContext'
import * as signalR from "@microsoft/signalr"
import { 
  Send, FileText, MoreVertical, Loader2, Paperclip, Mic, X, Check, CheckCheck 
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { getMessages, sendMessage, uploadFile } from "@/lib/api" 

export default function ChatWindow() {
  const { currentChatId, chats, currentUser } = useApp()
  const [messageText, setMessageText] = useState('')
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [inlineError, setInlineError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isRecording, setIsRecording] = useState(false) 
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  const connectionRef = useRef<signalR.HubConnection | null>(null)
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)

  // BÚSQUEDA DEL CHAT: Aseguramos que la comparación sea estricta como texto
  const currentChat = chats.find(c => String(c.id) === String(currentChatId))

  // --- 1. SIGNALR ---
  useEffect(() => {
    if (!currentChatId || !currentUser || currentChatId === '0') return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl("https://localhost:7086/hubs/chat") 
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    const startConnection = async () => {
      if (connection.state === signalR.HubConnectionState.Disconnected) {
        try {
          await connection.start();
          await connection.invoke("JoinChat", String(currentChatId));
        } catch (err) {
          console.error("Error conectando SignalR:", err);
          if (connection.state === signalR.HubConnectionState.Disconnected) {
            setTimeout(startConnection, 5000);
          }
        }
      }
    };

    startConnection();

    connection.on("ReceiveMessage", (msg) => {
      setChatMessages(prev => {
        const msgId = msg.id || msg.mensajeId;
        if (prev.some(m => (m.id || m.mensajeId) === msgId)) return prev;
        return [...prev, msg];
      });
    });

    connection.on("MessageRead", (messageId) => {
        setChatMessages(prev => prev.map(m => 
            (m.id === messageId || m.mensajeId === messageId) ? { ...m, isRead: true, leido: true } : m
        ));
    });

    connectionRef.current = connection;

    return () => {
      if (connection) connection.stop();
    };
  }, [currentChatId, currentUser]);

  // --- 2. CARGA DE HISTORIAL ---
  useEffect(() => {
    if (!currentChatId || currentChatId === '0') return;
    
    // LIMPIAR mensajes anteriores mientras carga los nuevos
    setChatMessages([]); 
    
    getMessages(currentChatId).then(data => {
        setChatMessages(Array.isArray(data) ? data : []);
    }).catch(err => console.error("Error al obtener mensajes:", err));
  }, [currentChatId]);

  useEffect(() => { 
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) 
  }, [chatMessages]);

  // --- 3. ENVÍO DE MENSAJES ---
  const handleSendMessage = async (content?: string, type: string = "text") => {
    if (!currentUser || !currentChatId) return;
    const finalContent = typeof content === 'string' ? content : messageText.trim();
    if (!finalContent) return;

    if (type === "text") setMessageText('');

    try {
      const newMessage = await sendMessage(currentChatId, {
        senderId: Number(currentUser.id),
        content: finalContent,
        type: type
      });

      if (newMessage) {
        setChatMessages(prev => {
          const msgId = newMessage.id || newMessage.mensajeId;
          if (prev.some(m => (m.id || m.mensajeId) === msgId)) return prev;
          return [...prev, newMessage];
        });
      }
      setInlineError(null);
    } catch (error) {
      setInlineError("Error al enviar");
    }
  };

  const renderStatus = (m: any) => {
    const isRead = m.isRead || m.leido || m.estado === 'visto';
    const isDelivered = true; 
    return (
      <div className="flex items-center ml-1">
        {isRead ? <CheckCheck size={15} className="text-blue-500" /> : isDelivered ? <CheckCheck size={15} className="text-gray-400" /> : <Check size={15} className="text-gray-400" />}
      </div>
    );
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentChatId) return;
    setIsUploading(true);
    try {
      const response = await uploadFile(currentChatId, file); 
      const fileUrl = response?.url || response?.fileUrl;
      if (!fileUrl) throw new Error("No URL");
      let type = file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : file.type.startsWith("audio/") ? "audio" : "file";
      await handleSendMessage(fileUrl, type);
    } catch (error) { setInlineError("Error al subir"); }
    finally { setIsUploading(false); if (e.target) e.target.value = ''; }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], "voice_note.webm", { type: 'audio/webm' });
        setIsUploading(true);
        try {
          const res = await uploadFile(currentChatId!, audioFile);
          const url = res?.url || res?.fileUrl;
          if (url) await handleSendMessage(url, "audio");
        } catch (err) { setInlineError("Error nota voz"); }
        setIsUploading(false);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) { setInlineError("Micrófono bloqueado"); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
    }
  };

  // --- PANTALLA DE DIAGNÓSTICO ---
  if (!currentChat || !currentUser) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#efeae2] text-gray-600 font-medium p-6 text-center">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full">
          <h3 className="text-xl font-bold text-gray-800 mb-2">Pantalla de inicio</h3>
          <p className="mb-4">Selecciona un chat o contacto para comenzar.</p>
          
          {/* Zona de diagnóstico: Se muestra solo si hay un ID seleccionado pero no encuentra el chat */}
          {currentChatId && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded text-sm text-left">
              <p className="font-bold text-red-600 mb-2">⚠️ Diagnóstico de Error:</p>
              <p>El sistema intentó abrir el Chat ID: <span className="font-mono bg-gray-200 px-1">{currentChatId}</span></p>
              <p className="mt-2">Pero en tu lista global de chats solo tienes estos IDs:</p>
              <ul className="list-disc pl-5 mt-1 font-mono text-xs">
                {chats.length > 0 ? chats.map(c => <li key={c.id}>{c.id} ({c.participantName})</li>) : <li>La lista de chats está vacía (0 chats).</li>}
              </ul>
              <p className="mt-3 text-xs text-gray-500">
                Solución: Si la lista está vacía, tu base de datos no está devolviendo los chats. Si el ID no coincide, el botón donde hiciste clic está enviando el ID incorrecto.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#efeae2] relative">
      {/* ... (Todo tu código del return principal se mantiene igual) ... */}
      {selectedImage && (
        <div className="absolute inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
          <button className="absolute top-5 right-5 text-white hover:bg-white/10 p-2 rounded-full transition-colors"><X size={32} /></button>
          <img src={selectedImage} className="max-w-full max-h-full object-contain shadow-2xl" alt="Full" />
        </div>
      )}

      {/* HEADER */}
      <div className="p-3 bg-[#f0f2f5] flex items-center justify-between border-b border-gray-300">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-primary overflow-hidden border border-gray-300">
            {currentChat.participantPhoto ? <img src={currentChat.participantPhoto} className="w-full h-full object-cover" alt="p" /> : '👤'}
          </div>
          <div>
            <h2 className="font-semibold text-gray-800 leading-tight">{currentChat.participantName}</h2>
            <p className="text-[11px] text-green-600 font-medium">En línea</p>
          </div>
        </div>
        <MoreVertical className="text-gray-500 cursor-pointer hover:bg-gray-200 rounded-full p-1" />
      </div>

      {/* MENSAJES */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat">
        {chatMessages.map((m: any) => {
          const isMe = String(m.senderId || m.remitenteUsuarioId) === String(currentUser.id);
          const msgType = (m.type || m.tipoMensaje || "text").toLowerCase();
          const content = m.content || m.contenido;

          return (
            <div key={m.id || m.mensajeId} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in duration-300`}>
              <div className={`relative p-2 px-3 rounded-xl shadow-sm max-w-[85%] sm:max-w-[70%] ${isMe ? 'bg-[#dcf8c6] rounded-tr-none' : 'bg-white rounded-tl-none'}`}>
                {msgType === 'text' && <p className="text-[14px] text-gray-800 pb-4">{content}</p>}
                {msgType === 'image' && (
                  <div className="pb-4">
                    <img src={content} onClick={() => setSelectedImage(content)} className="rounded-lg max-h-72 w-full object-cover cursor-pointer hover:opacity-95 transition-opacity" alt="img" />
                  </div>
                )}
                {msgType === 'video' && <video src={content} controls className="rounded-lg max-h-64 pb-4" />}
                {msgType === 'audio' && <audio src={content} controls className="w-full h-10 pb-4" />}
                {msgType === 'file' && (
                  <a href={content} target="_blank" rel="noreferrer" className="flex items-center gap-3 bg-black/5 p-3 rounded-lg mb-4 text-blue-700 text-sm font-medium">
                    <FileText size={24} className="text-gray-500" /> 
                    <span className="truncate">Documento adjunto</span>
                  </a>
                )}
                
                <div className="absolute bottom-1 right-2 flex items-center gap-1">
                  <span className="text-[10px] text-gray-500">
                    {new Date(m.timestamp || m.fechaEnvio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {isMe && renderStatus(m)}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* FOOTER */}
      <div className="p-2 bg-[#f0f2f5] flex items-center gap-2 border-t border-gray-300 relative">
        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
        <button onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-600 hover:bg-gray-200 rounded-full transition-colors">
          {isUploading ? <Loader2 className="animate-spin text-primary" size={22} /> : <Paperclip size={22} />}
        </button>
        <input
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder={isRecording ? "Grabando nota de voz..." : "Escribe un mensaje"}
          className="flex-1 p-2.5 px-4 rounded-full outline-none bg-white text-sm shadow-sm border border-transparent focus:border-gray-300 transition-all"
        />
        {!messageText.trim() ? (
          <button onMouseDown={startRecording} onMouseUp={stopRecording} className={`p-2 rounded-full transition-all ${isRecording ? 'bg-red-500 text-white scale-110 animate-pulse' : 'text-gray-600 hover:bg-gray-200'}`}>
            <Mic size={22} />
          </button>
        ) : (
          <button onClick={() => handleSendMessage()} className="p-2 rounded-full bg-[#00a884] text-white hover:bg-[#008f6f] shadow-md transition-all active:scale-95">
            <Send size={22} />
          </button>
        )}
      </div>
      {inlineError && <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-1 rounded-full text-xs shadow-lg">{inlineError}</div>}
    </div>
  )
}