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
  lastMessageSender?: string;
  unreadCount?: number;
}

// Helper function to extract ID string from various formats
const extractUserId = (participant: any): string => {
  if (typeof participant === "string") {
    return participant;
  }
  if (typeof participant === "object" && participant._id) {
    return typeof participant._id === "string"
      ? participant._id
      : participant._id.toString();
  }
  console.error("Invalid participant format:", participant);
  return "";
};

// Get all conversations for the current user with populated participant data and unread counts
export const getConversations = async () => {
  try {
    const response = await api.get("/api/conversations");
    const conversations = response.data?.data || response.data || [];

    console.log("Raw conversations from API:", conversations);

    // Process each conversation to fetch participant details and calculate unread counts
    const processedConversations = await Promise.all(
      conversations.map(async (conv: any) => {
        console.log("Processing conversation:", conv._id);
        console.log("Raw participants:", conv.participants);

        // Extract participant IDs properly
        const participantIds = conv.participants
          .map((participant: any) => {
            const userId = extractUserId(participant);
            console.log("Extracted user ID:", userId, "from:", participant);
            return userId;
          })
          .filter(Boolean); // Remove empty strings

        console.log("Final participant IDs:", participantIds);

        // Fetch user details for each participant
        const participantDetails = await Promise.all(
          participantIds.map(async (participantId: string) => {
            try {
              console.log("Fetching user details for ID:", participantId);
              const userResponse = await api.get(`/api/users/${participantId}`);
              const userData = userResponse.data?.data || userResponse.data;
              console.log("Fetched user data:", userData);
              return {
                _id: userData._id || participantId,
                username: userData.username || "Unknown User",
                profileImage: userData.profileImage || null,
              };
            } catch (error) {
              console.error(
                "Error fetching user details for ID:",
                participantId,
                error
              );
              return {
                _id: participantId,
                username: "Unknown User",
                profileImage: null,
              };
            }
          })
        );

        console.log("Processed participants:", participantDetails);

        // Get unread count for this conversation
        let unreadCount = 0;
        let lastMessageSender: string | null = null;

        try {
          const messagesResponse = await api.get(`/api/messages/${conv._id}`);
          const messages =
            messagesResponse.data?.data || messagesResponse.data || [];

          if (messages.length > 0) {
            // Get the last message sender
            const lastMessage = messages[messages.length - 1];
            lastMessageSender = extractUserId(lastMessage.sender);

            // Count unread messages (messages not sent by current user and not read)
            unreadCount = messages.filter((msg: any) => {
              const msgSenderId = extractUserId(msg.sender);
              return (
                msgSenderId !==
                  participantDetails.find((p) => p._id === lastMessageSender)
                    ?._id && !msg.read
              );
            }).length;
          }
        } catch (error) {
          console.error("Error fetching messages for unread count:", error);
        }

        return {
          ...conv,
          participants: participantDetails,
          unreadCount,
          lastMessageSender,
        };
      })
    );

    console.log("Final processed conversations:", processedConversations);

    return {
      ...response,
      data: {
        ...response.data,
        data: processedConversations,
      },
    };
  } catch (error) {
    console.error("Error in getConversations:", error);
    throw error;
  }
};

// Get unread count for a specific conversation
export const getConversationUnreadCount = async (
  conversationId: string,
  currentUserId: string
): Promise<number> => {
  try {
    const response = await api.get(`/api/messages/${conversationId}`);
    const messages = response.data?.data || response.data || [];

    // Count messages that are:
    // 1. Not sent by the current user
    // 2. Not marked as read
    const unreadCount = messages.filter((msg: any) => {
      const senderId = extractUserId(msg.sender);
      return senderId !== currentUserId && !msg.read;
    }).length;

    console.log(
      `Unread count for conversation ${conversationId}:`,
      unreadCount
    );
    return unreadCount;
  } catch (error) {
    console.error("Error getting conversation unread count:", error);
    return 0;
  }
};

// Get conversations by user ID
export const getConversationsByUserId = (userId: string) =>
  api.get(`/api/conversations/${userId}`);

// Start a new conversation or get existing one
export const startConversation = (recipientId: string) =>
  api.post("/api/conversations", { recipientId });

// Get messages in a conversation with populated sender data
export const getMessages = async (conversationId: string) => {
  try {
    const response = await api.get(`/api/messages/${conversationId}`);
    const messages = response.data?.data || response.data || [];

    console.log("Raw messages from API:", messages);

    // Process each message to ensure sender details are populated
    const processedMessages = await Promise.all(
      messages.map(async (message: any) => {
        console.log("Processing message:", message._id);
        console.log("Raw sender:", message.sender);

        // Extract sender ID properly
        const senderId = extractUserId(message.sender);
        console.log("Extracted sender ID:", senderId);

        // If sender is just an ID string, fetch the user details
        if (senderId && typeof message.sender === "string") {
          try {
            console.log("Fetching sender details for ID:", senderId);
            const userResponse = await api.get(`/api/users/${senderId}`);
            const userData = userResponse.data?.data || userResponse.data;
            console.log("Fetched sender data:", userData);

            return {
              ...message,
              sender: {
                _id: userData._id || senderId,
                username: userData.username || "Unknown User",
                profileImage: userData.profileImage || null,
              },
            };
          } catch (error) {
            console.error(
              "Error fetching sender details for ID:",
              senderId,
              error
            );
            return {
              ...message,
              sender: {
                _id: senderId,
                username: "Unknown User",
                profileImage: null,
              },
            };
          }
        }

        // If sender is already an object with proper structure, return as is
        if (typeof message.sender === "object" && message.sender.username) {
          return message;
        }

        // If sender is an object but missing username, fetch details
        if (typeof message.sender === "object" && senderId) {
          try {
            console.log("Fetching sender details for object ID:", senderId);
            const userResponse = await api.get(`/api/users/${senderId}`);
            const userData = userResponse.data?.data || userResponse.data;
            console.log("Fetched sender data:", userData);

            return {
              ...message,
              sender: {
                _id: userData._id || senderId,
                username: userData.username || "Unknown User",
                profileImage: userData.profileImage || null,
              },
            };
          } catch (error) {
            console.error(
              "Error fetching sender details for object ID:",
              senderId,
              error
            );
            return {
              ...message,
              sender: {
                _id: senderId,
                username: "Unknown User",
                profileImage: null,
              },
            };
          }
        }

        // Fallback
        return {
          ...message,
          sender: {
            _id: senderId || "unknown",
            username: "Unknown User",
            profileImage: null,
          },
        };
      })
    );

    console.log("Final processed messages:", processedMessages);

    return {
      ...response,
      data: {
        ...response.data,
        data: processedMessages,
      },
    };
  } catch (error) {
    console.error("Error in getMessages:", error);
    throw error;
  }
};

// Send a message
export const sendMessage = (
  conversationId: string,
  message: string,
  image?: string
) => {
  if (image) {
    const formData = new FormData();
    formData.append("conversationId", conversationId);
    if (message) formData.append("message", message);
    formData.append("image", {
      uri: image,
      type: "image/jpeg",
      name: "message-image.jpg",
    } as any);

    return api.post("/api/messages", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  } else {
    return api.post("/api/messages", { conversationId, message });
  }
};

// Mark messages as read
export const markMessagesAsRead = (conversationId: string) =>
  api.put(`/api/messages/${conversationId}/read`);

// Get total unread message count across all conversations
export const getUnreadCount = async (): Promise<number> => {
  try {
    const response = await getConversations();
    const conversations = response.data?.data || response.data || [];
    const totalUnread = conversations.reduce(
      (total: number, conv: Conversation) => {
        return total + (conv.unreadCount || 0);
      },
      0
    );
    console.log("Calculated total unread count:", totalUnread);
    return totalUnread;
  } catch (error) {
    console.error("Error getting unread count:", error);
    return 0;
  }
};

// Import these from your existing api.ts
export { addToWishlist, checkWishlist } from "./api";
