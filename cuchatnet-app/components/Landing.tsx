'use client'

import { useApp } from '@/contexts/AppContext'
import { Button } from '@/components/ui/button'
import { MessageSquare, Lock, Users, Eye } from 'lucide-react'

export function Landing() {
  const { setCurrentView } = useApp()

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A2E6D] via-[#061a3d] to-[#031028] flex flex-col text-white">
      {/* Header */}
      <header className="py-4 px-4 border-b border-white/10 bg-white/5 backdrop-blur-md shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E21B23]/30 via-white/10 to-white/5 flex items-center justify-center shadow-md ring-1 ring-white/15">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">CUChatNet</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-12">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
            Mensajería Segura para la Universidad
          </h2>
          <p className="text-lg text-white/75 mb-8 max-w-2xl mx-auto">
            CUChatNet es una plataforma de comunicación moderna con cifrado de extremo a extremo, diseñada para estudiantes y administrativos.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => setCurrentView('login')}
              className="bg-[#E21B23] hover:bg-[#E21B23]/90 text-white shadow-md shadow-[#E21B23]/20 rounded-xl transition-all duration-200"
            >
              Ingresar como Usuario
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setCurrentView('admin-login')}
              className="border-white/20 text-white bg-white/5 hover:bg-white/10 shadow-md rounded-xl transition-all duration-200"
            >
              Acceso Administrativo
            </Button>
          </div>
        </section>

        {/* Features Section */}
        <section className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-md hover:shadow-lg transition-all duration-200 hover:bg-white/10">
            <Lock className="w-8 h-8 text-[#E21B23] mb-4" />
            <h3 className="font-semibold text-white mb-2">Cifrado E2E</h3>
            <p className="text-sm text-white/75">Tus mensajes están protegidos con cifrado de extremo a extremo</p>
          </div>
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-md hover:shadow-lg transition-all duration-200 hover:bg-white/10">
            <Users className="w-8 h-8 text-[#E21B23] mb-4" />
            <h3 className="font-semibold text-white mb-2">Grupos</h3>
            <p className="text-sm text-white/75">Crea y gestiona grupos con múltiples participantes</p>
          </div>
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-md hover:shadow-lg transition-all duration-200 hover:bg-white/10">
            <MessageSquare className="w-8 h-8 text-[#E21B23] mb-4" />
            <h3 className="font-semibold text-white mb-2">Multimedia</h3>
            <p className="text-sm text-white/75">Comparte fotos, videos y archivos de forma segura</p>
          </div>
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-md hover:shadow-lg transition-all duration-200 hover:bg-white/10">
            <Eye className="w-8 h-8 text-[#E21B23] mb-4" />
            <h3 className="font-semibold text-white mb-2">Estados</h3>
            <p className="text-sm text-white/75">Comparte momentos que desaparecen en 24 horas</p>
          </div>
        </section>

        {/* Requirements Section */}
        <section className="mb-16">
          <h3 className="text-2xl font-extrabold text-white mb-6">Requerimientos de Sistema</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-md">
              <h4 className="font-semibold text-white mb-3">Registro y Verificación</h4>
              <ul className="space-y-2 text-sm text-white/75">
                <li>✓ Registro por número de teléfono</li>
                <li>✓ Verificación SMS de dos pasos</li>
                <li>✓ Perfil personalizable</li>
                <li>✓ Descripción y estado disponible</li>
              </ul>
            </div>
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-md">
              <h4 className="font-semibold text-white mb-3">Gestión de Contactos</h4>
              <ul className="space-y-2 text-sm text-white/75">
                <li>✓ Sincronización de contactos</li>
                <li>✓ Búsqueda avanzada A-Z</li>
                <li>✓ Crear chats y grupos desde contactos</li>
                <li>✓ Archivar y fijar conversaciones</li>
              </ul>
            </div>
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-md">
              <h4 className="font-semibold text-white mb-3">Seguridad</h4>
              <ul className="space-y-2 text-sm text-white/75">
                <li>✓ Cifrado de extremo a extremo</li>
                <li>✓ Claves por dispositivo</li>
                <li>✓ Verificación de identidad</li>
                <li>✓ Detección de cambio de dispositivo</li>
              </ul>
            </div>
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-md">
              <h4 className="font-semibold text-white mb-3">Panel Administrativo</h4>
              <ul className="space-y-2 text-sm text-white/75">
                <li>✓ Dashboard con métricas</li>
                <li>✓ Gestión de usuarios</li>
                <li>✓ Auditoría de mensajes</li>
                <li>✓ Configuración del sistema</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Security Section */}
        <section className="mb-16">
          <h3 className="text-2xl font-extrabold text-white mb-6">Seguridad de Datos</h3>
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-lg">
            <p className="text-white mb-4">
              CUChatNet implementa protocolos de seguridad de nivel empresarial para proteger tu privacidad:
            </p>
            <ul className="space-y-2 text-white/75">
              <li>• Cifrado de extremo a extremo en todas las conversaciones</li>
              <li>• Almacenamiento seguro de credenciales con hash bcrypt</li>
              <li>• Sesiones con cookies HTTP-only</li>
              <li>• Protección contra inyección SQL con consultas parametrizadas</li>
              <li>• Políticas de renovación periódica de claves</li>
            </ul>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 px-4 bg-white/5 backdrop-blur-md">
        <div className="max-w-6xl mx-auto text-center text-sm text-white/70">
          <p>CUC - Universidad Central - Curso 2026 - Cuatrimestre 1</p>
          <p className="mt-1">Proyecto académico de sistema de mensajería seguro</p>
        </div>
      </footer>
    </div>
  )
}
