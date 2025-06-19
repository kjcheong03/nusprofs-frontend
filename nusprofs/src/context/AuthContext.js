// src/context/AuthContext.js
import React, { createContext, useState, useEffect } from 'react'
import {
  getCurrentUser,
  logoutUser as doLogoutUser,
} from '../services/auth'

export const AuthContext = createContext({
  user: null,
  isLoggedIn: false,
  loading: true,
  logout: () => {},
  refreshUser: () => {},
})

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = async () => {
    try {
      const data = await getCurrentUser()
      setUser(data)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    await doLogoutUser()
    setUser(null)
  }

  useEffect(() => {
    refreshUser()
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        loading,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
