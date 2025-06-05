"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useAuth } from "./AuthContext"
import { getUnreadCount } from "../utils/chat-api"

interface ChatContextType {
  unreadCount: number
  updateUnreadCount: () => Promise<void>
  incrementUnreadCount: () => void
  decrementUnreadCount: (count?: number) => void
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export const useChatContext = () => {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error("useChatContext must be used within a ChatProvider")
  }
  return context
}

interface ChatProviderProps {
  children: ReactNode
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0)
  const { isAuthenticated, user } = useAuth()

  const updateUnreadCount = async () => {
    if (!isAuthenticated) {
      setUnreadCount(0)
      return
    }

    try {
      const count = await getUnreadCount()
      setUnreadCount(count)
    } catch (error) {
      console.error("Error updating unread count:", error)
    }
  }

  const incrementUnreadCount = () => {
    setUnreadCount((prev) => prev + 1)
  }

  const decrementUnreadCount = (count = 1) => {
    setUnreadCount((prev) => Math.max(0, prev - count))
  }

  useEffect(() => {
    if (isAuthenticated) {
      updateUnreadCount()
      // Set up periodic refresh every 30 seconds
      const interval = setInterval(updateUnreadCount, 30000)
      return () => clearInterval(interval)
    } else {
      setUnreadCount(0)
    }
  }, [isAuthenticated, user])

  return (
    <ChatContext.Provider
      value={{
        unreadCount,
        updateUnreadCount,
        incrementUnreadCount,
        decrementUnreadCount,
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}
