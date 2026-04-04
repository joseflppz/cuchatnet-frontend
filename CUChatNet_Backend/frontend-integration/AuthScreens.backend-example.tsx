'use client'

import React, { useState } from "react"
import { useApp } from '@/contexts/AppContext'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { apiPost } from '@/lib/api-client'

export function LoginScreen() {
  const { setCurrentView, showToast } = useApp()
  const [phone, setPhone] = useState('')
  const [country, setCountry] = useState('+506')

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(e.target.value.replace(/\D/g, '').slice(0, 8))
  }

  const handleLogin = async () => {
    if (!phone || phone.length < 8) {
      showToast('Por favor ingresa un número válido', 'error')
      return
    }

    try {
      const fullPhone = `${country}${phone}`
      const data = await apiPost<any>('/api/verify/send', { phone: fullPhone })
      localStorage.setItem('verify_phone', fullPhone)

      if (data?.developmentCode) {
        console.log('Código de desarrollo:', data.developmentCode)
      }

      showToast('Código enviado correctamente', 'success')
      setCurrentView('verify-sms')
    } catch (error: any) {
      showToast(error.message || 'Error enviando código', 'error')
    }
  }

  return (
    <div />
  )
}

export function VerifySmsScreen() {
  const { setCurrentView, showToast } = useApp()
  const [code, setCode] = useState('')

  const handleVerify = async () => {
    const phone = localStorage.getItem('verify_phone')
    if (!phone) {
      showToast('No se encontró teléfono pendiente', 'error')
      return
    }

    try {
      const data = await apiPost<any>('/api/verify/check', { phone, code })

      if (data?.userExists && data?.user) {
        localStorage.setItem('cuchatnet_currentUser', JSON.stringify(data.user))
      }

      showToast('SMS verificado correctamente', 'success')
      setCurrentView(data?.userExists ? 'chat' : 'profile-setup')
    } catch (error: any) {
      showToast(error.message || 'Código incorrecto', 'error')
    }
  }

  return <div />
}
