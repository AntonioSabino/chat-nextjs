'use client'

import { signIn, useSession } from 'next-auth/react'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const { status: statusAuth } = useSession()
  const route = useRouter()

  useEffect(() => {
    if (statusAuth === 'authenticated') {
      route.push('/')
    }
    if (statusAuth === 'unauthenticated') {
      signIn('keycloak')
    }
  }, [statusAuth, route])

  return <div>Carregando...</div>
}
