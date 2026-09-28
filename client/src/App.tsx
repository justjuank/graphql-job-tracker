import { useApolloClient } from '@apollo/client/react'
import { useState } from 'react'

import { AuthenticatedHome } from './auth/AuthenticatedHome'
import { LoginPage } from './auth/LoginPage'
import { clearAccessToken, getAccessToken } from './auth/token-storage'

export default function App() {
  const client = useApolloClient()
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => getAccessToken() !== null,
  )

  async function handleLogout() {
    clearAccessToken()
    await client.clearStore()
    setIsAuthenticated(false)
  }

  return isAuthenticated ? (
    <AuthenticatedHome onLogout={handleLogout} />
  ) : (
    <LoginPage onAuthenticated={() => setIsAuthenticated(true)} />
  )
}
