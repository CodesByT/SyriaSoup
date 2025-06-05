import { api } from "./api";

export interface Message {
  _id: string;
  conversation: string;
  sender: {
    _id: string;
    username: string;
    profileImage?: string;
  };
  message?: string;
  image?: string;
  createdAt: string;
  read: boolean;
}

export interface Conversation {
  _id: string;
  participants: {
    _id: string;
    username: string;
    profileImage?: string;
  }[];
  lastMessage?: string;
  lastMessageAt: string;
  unreadCount?: number;
}

// Get all conversations for the current user
export const getConversations = () => api.get("/api/conversations");

// Get conversations by user ID
export const getConversationsByUserId = (userId: string) =>
  api.get(`/api/conversations/${userId}`);

// Start a new conversation
export const startConversation = (recipientId: string) =>
  api.post("/api/conversations", { recipientId });

// Get messages in a conversation
export const getMessages = (conversationId: string) =>
  api.get(`/api/messages/${conversationId}`);

// Send a message
export const sendMessage = (
  conversationId: string,
  message: string,
  image?: string
) => {
  const formData = new FormData();
  formData.append("conversationId", conversationId);
  if (message) formData.append("message", message);
  if (image) {
    formData.append("image", {
      uri: image,
      type: "image/jpeg",
      name: "message-image.jpg",
    } as any);
  }

  return api.post("/api/messages", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

// Mark messages as read
export const markMessagesAsRead = (conversationId: string) =>
  api.put(`/api/messages/${conversationId}/read`);

// Get unread message count
export const getUnreadCount = async (): Promise<number> => {
  try {
    const response = await getConversations();
    const conversations = response.data?.data || response.data || [];
    return conversations.reduce(
      (total: number, conv: Conversation) => total + (conv.unreadCount || 0),
      0
    );
  } catch (error) {
    console.error("Error getting unread count:", error);
    return 0;
  }
};
