'use client'

import { AppProvider, useApp } from '@/contexts/AppContext'
import { Landing } from '@/components/Landing'
import { LoginScreen, VerifySmsScreen, ProfileSetupScreen, AdminLoginScreen } from '@/components/AuthScreens'
import { ChatInterface } from '@/components/ChatInterface'
import { AdminDashboard } from '@/components/AdminDashboard'
import { Toast } from '@/components/Toast'

function AppContent() {
  const { currentView } = useApp()

  return (
    <div className="min-h-screen bg-background">
      {currentView === 'landing' && <Landing />}
      {currentView === 'login' && <LoginScreen />}
      {currentView === 'verify-sms' && <VerifySmsScreen />}
      {currentView === 'profile-setup' && <ProfileSetupScreen />}
      {currentView === 'chat' && <ChatInterface />}
      {currentView === 'admin-login' && <AdminLoginScreen />}
      {currentView === 'admin-dashboard' && <AdminDashboard />}
      <Toast />
    </div>
  )
}

export default function Page() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}
