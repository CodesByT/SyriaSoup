"use client";

import type React from "react";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { getUnreadCount } from "../utils/chat-api";
import { useAuth } from "./AuthContext";

interface ChatContextType {
  unreadCount: number;
  updateUnreadCount: () => Promise<void>;
  incrementUnreadCount: () => void;
  decrementUnreadCount: (count?: number) => void;
  hasUnread: boolean;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    // Return default values instead of throwing error
    return {
      unreadCount: 0,
      updateUnreadCount: async () => {},
      incrementUnreadCount: () => {},
      decrementUnreadCount: () => {},
      hasUnread: false,
    };
  }
  return context;
};

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const { isAuthenticated, user } = useAuth();

  const updateUnreadCount = async () => {
    if (!isAuthenticated || !user) {
      console.log("ChatContext: Not authenticated, setting unread count to 0");
      setUnreadCount(0);
      return;
    }

    try {
      console.log("ChatContext: Fetching unread count...");
      const count = await getUnreadCount();
      console.log("ChatContext: Updated unread count to:", count);
      setUnreadCount(count);
    } catch (error) {
      console.error("ChatContext: Error updating unread count:", error);
      setUnreadCount(0);
    }
  };

  const incrementUnreadCount = () => {
    console.log("ChatContext: Incrementing unread count");
    setUnreadCount((prev) => prev + 1);
  };

  const decrementUnreadCount = (count = 1) => {
    console.log("ChatContext: Decrementing unread count by:", count);
    setUnreadCount((prev) => Math.max(0, prev - count));
  };

  useEffect(() => {
    console.log(
      "ChatContext: Auth state changed - authenticated:",
      isAuthenticated,
      "user:",
      !!user
    );

    if (isAuthenticated && user) {
      updateUnreadCount();
      // Set up periodic refresh every 30 seconds
      const interval = setInterval(() => {
        console.log("ChatContext: Periodic unread count update");
        updateUnreadCount();
      }, 30000);
      return () => clearInterval(interval);
    } else {
      setUnreadCount(0);
    }
  }, [isAuthenticated, user]);

  // Debug logging
  useEffect(() => {
    console.log("ChatContext: Unread count changed to:", unreadCount);
  }, [unreadCount]);

  return (
    <ChatContext.Provider
      value={{
        unreadCount,
        updateUnreadCount,
        incrementUnreadCount,
        decrementUnreadCount,
        hasUnread: unreadCount > 0,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
