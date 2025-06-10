"use client";

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";
import { useChatContext } from "../../contexts/ChatContext";
import { useRTL } from "../../hooks/useRTL";
import type { Conversation } from "../../utils/chat-api";
import {
  getConversations,
  getConversationUnreadCount,
} from "../../utils/chat-api";

const Chat = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { isRTL, rtlStyle, rtlViewStyle, getFlexDirection } = useRTL();
  const insets = useSafeAreaInsets();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const chatContext = useChatContext();
  const updateUnreadCount = chatContext.updateUnreadCount;

  useEffect(() => {
    if (isAuthenticated) {
      fetchConversations();
    }
  }, [isAuthenticated]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      console.log("Chat: Fetching conversations for user:", user?._id);

      const response = await getConversations();
      const conversationsData = response.data?.data || response.data || [];

      console.log("Chat: Received conversations:", conversationsData);

      const validatedConversations = await Promise.all(
        conversationsData.map(async (conv: any) => {
          console.log("Chat: Validating conversation:", conv._id);
          console.log("Chat: Participants:", conv.participants);

          const participants = Array.isArray(conv.participants)
            ? conv.participants.filter((p: any) => p && p._id && p.username)
            : [];

          let unreadCount = 0;
          if (user?._id) {
            unreadCount = await getConversationUnreadCount(conv._id, user._id);
          }

          console.log("Chat: Validated participants:", participants);
          console.log("Chat: Unread count:", unreadCount);

          return {
            ...conv,
            participants,
            unreadCount,
          };
        })
      );

      console.log(
        "Chat: Final validated conversations:",
        validatedConversations
      );
      setConversations(validatedConversations);
      await updateUnreadCount();
    } catch (error: any) {
      console.error("Chat: Error fetching conversations:", error);
      Alert.alert(
        t("error"),
        t("failedToFetchConversations") || "Failed to fetch conversations"
      );
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchConversations();
    setRefreshing(false);
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffInHours < 168) {
      return date.toLocaleDateString([], { weekday: "short" });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  const getOtherParticipant = (conversation: Conversation) => {
    console.log(
      "Chat: Getting other participant for conversation:",
      conversation._id
    );
    console.log("Chat: All participants:", conversation.participants);
    console.log("Chat: Current user ID:", user?._id);

    if (!conversation.participants || conversation.participants.length === 0) {
      console.log("Chat: No participants found");
      return null;
    }

    const otherParticipant = conversation.participants.find((p) => {
      console.log(
        "Chat: Checking participant:",
        p._id,
        "vs current user:",
        user?._id
      );
      return p._id !== user?._id;
    });

    console.log("Chat: Found other participant:", otherParticipant);
    return otherParticipant;
  };

  const getFirstLetter = (name: string): string => {
    console.log("Getting first letter for name:", name, "Type:", typeof name);
    if (!name || name.trim().length === 0) {
      console.log("Name is empty or invalid, returning '?'");
      return "?";
    }
    const firstLetter = name.trim().charAt(0).toUpperCase();
    console.log("First letter extracted:", firstLetter);
    return firstLetter;
  };

  const getAvatarBackgroundColor = (name: string): string => {
    console.log("Getting avatar color for name:", name);
    const colors = [
      "#FF6B6B",
      "#4ECDC4",
      "#45B7D1",
      "#96CEB4",
      "#FFEAA7",
      "#DDA0DD",
      "#98D8C8",
      "#F7DC6F",
      "#BB8FCE",
      "#85C1E9",
    ];

    if (!name || name.trim().length === 0) {
      console.log("Name is empty, using default color");
      return colors[0];
    }

    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    const selectedColor = colors[Math.abs(hash) % colors.length];
    console.log(`Color for ${name}: ${selectedColor} (hash: ${hash})`);
    return selectedColor;
  };

  const handleConversationPress = (conversation: Conversation) => {
    const otherParticipant = getOtherParticipant(conversation);
    const recipientName = otherParticipant?.username || "User";
    console.log("Chat: Navigating to conversation with:", recipientName);
    router.push(
      `/conversation?conversationId=${
        conversation._id
      }&recipientName=${encodeURIComponent(recipientName)}`
    );
  };

  const renderConversationItem = ({ item }: { item: Conversation }) => {
    const otherParticipant = getOtherParticipant(item);
    const hasUnread = Boolean(item.unreadCount && item.unreadCount > 0);

    const displayName = otherParticipant?.username || "Unknown User";
    const firstLetter = getFirstLetter(displayName);
    const avatarColor = getAvatarBackgroundColor(displayName);

    if (displayName.toLowerCase().includes("tayyab")) {
      console.log("=== DEBUGGING TAYYABKHALID ===");
      console.log(
        "Full otherParticipant object:",
        JSON.stringify(otherParticipant, null, 2)
      );
      console.log("Display name:", displayName);
      console.log("Has profile image:", !!otherParticipant?.profileImage);
      console.log("Profile image URL:", otherParticipant?.profileImage);
      console.log("First letter:", firstLetter);
      console.log("Avatar color:", avatarColor);
      console.log("Should show placeholder:", !otherParticipant?.profileImage);
      console.log("=== END DEBUG ===");
    }

    console.log("Chat: Rendering conversation item:", {
      conversationId: item._id,
      otherParticipant,
      displayName,
      hasUnread,
      unreadCount: item.unreadCount,
    });

    return (
      <TouchableOpacity
        style={[
          styles.conversationItem,
          hasUnread && styles.unreadConversation,
          isRTL && styles.conversationItemRTL,
        ]}
        onPress={() => handleConversationPress(item)}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.avatarContainer,
            isRTL ? styles.avatarContainerRTL : styles.avatarContainerLTR,
          ]}
        >
          {otherParticipant?.profileImage ? (
            <Image
              source={{ uri: otherParticipant.profileImage }}
              style={styles.avatar}
            />
          ) : (
            <View
              style={[
                styles.avatarPlaceholder,
                { backgroundColor: avatarColor },
              ]}
            >
              <Text style={styles.avatarText}>{firstLetter}</Text>
            </View>
          )}
          {hasUnread && (
            <View
              style={[
                styles.unreadIndicator,
                isRTL ? styles.unreadIndicatorRTL : styles.unreadIndicatorLTR,
              ]}
            />
          )}
        </View>

        <View style={styles.conversationContent}>
          <View style={[styles.conversationHeader, rtlViewStyle]}>
            <Text
              style={[
                styles.participantName,
                hasUnread && styles.unreadText,
                rtlStyle,
              ]}
              numberOfLines={1}
            >
              {displayName}
            </Text>
            <View style={[styles.timestampContainer, rtlViewStyle]}>
              {hasUnread && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>
                    {item.unreadCount! > 99
                      ? "99+"
                      : item.unreadCount!.toString()}
                  </Text>
                </View>
              )}
              <Text
                style={[
                  styles.timestamp,
                  hasUnread && styles.unreadTimestamp,
                  rtlStyle,
                ]}
              >
                {formatTime(item.lastMessageAt)}
              </Text>
            </View>
          </View>

          <View style={[styles.messagePreview, rtlViewStyle]}>
            <Text
              style={[
                styles.lastMessage,
                hasUnread && styles.unreadText,
                rtlStyle,
              ]}
              numberOfLines={1}
            >
              {item.lastMessage || t("noMessages") || "No messages"}
            </Text>
            {hasUnread && (
              <View
                style={[
                  styles.newMessageIndicator,
                  isRTL
                    ? styles.newMessageIndicatorRTL
                    : styles.newMessageIndicatorLTR,
                ]}
              >
                <Ionicons name="ellipse" size={8} color="#B80200" />
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="chatbubbles-outline" size={80} color="#ccc" />
      <Text style={[styles.emptyStateTitle, rtlStyle]}>
        {t("noConversations") || "No Conversations"}
      </Text>
      <Text style={[styles.emptyStateDescription, rtlStyle]}>
        {t("startChattingDescription") || "Start chatting with other users"}
      </Text>
    </View>
  );

  if (!isAuthenticated) {
    return (
      <View style={styles.authContainer}>
        <Ionicons name="chatbubbles-outline" size={80} color="#B80200" />
        <Text style={[styles.authTitle, rtlStyle]}>
          {t("loginRequired") || "Login Required"}
        </Text>
        <Text style={[styles.authDescription, rtlStyle]}>
          {t("loginToAccessChat") || "Please login to access chat features"}
        </Text>
        <TouchableOpacity
          style={styles.authButton}
          onPress={() => router.push("/login")}
          activeOpacity={0.8}
        >
          <Text style={[styles.authButtonText, rtlStyle]}>
            {t("login") || "Login"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, rtlViewStyle]}>
        <Text style={[styles.headerTitle, rtlStyle]}>{t("messages")}</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#B80200" />
            <Text style={[styles.loadingText, rtlStyle]}>
              {t("loading") || "Loading..."}
            </Text>
          </View>
        ) : (
          <FlatList
            data={conversations}
            keyExtractor={(item) => item._id}
            renderItem={renderConversationItem}
            ListEmptyComponent={renderEmptyState}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={
              conversations.length === 0
                ? styles.emptyContainer
                : styles.listContainer
            }
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  header: {
    backgroundColor: "#1a1a1a",
    paddingHorizontal: 20,
    paddingVertical: 15, // justifyContent: "space-between", // Remove this line
    alignItems: "center",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // Add this to center content horizontally
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#ffffff",
    textAlign: "center",
  },
  headerButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
    marginTop: 10,
  },
  listContainer: {
    paddingVertical: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  conversationItem: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  conversationItemRTL: {
    flexDirection: "row-reverse",
  },
  unreadConversation: {
    backgroundColor: "#fafafa",
    borderLeftWidth: 4,
    borderLeftColor: "#B80200",
  },
  avatarContainer: {
    position: "relative",
  },
  avatarContainerLTR: {
    marginRight: 12,
  },
  avatarContainerRTL: {
    marginLeft: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  unreadIndicator: {
    position: "absolute",
    bottom: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#B80200",
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  unreadIndicatorLTR: {
    right: 2,
  },
  unreadIndicatorRTL: {
    left: 2,
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  participantName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    flex: 1,
  },
  timestampContainer: {
    alignItems: "center",
    gap: 8,
  },
  timestamp: {
    fontSize: 12,
    color: "#999",
  },
  unreadTimestamp: {
    color: "#B80200",
    fontWeight: "600",
  },
  messagePreview: {
    justifyContent: "space-between",
    alignItems: "center",
  },
  lastMessage: {
    fontSize: 14,
    color: "#666",
    flex: 1,
  },
  unreadText: {
    color: "#1a1a1a",
    fontWeight: "600",
  },
  unreadBadge: {
    backgroundColor: "#B80200",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "700",
  },
  newMessageIndicator: {},
  newMessageIndicatorLTR: {
    marginLeft: 8,
  },
  newMessageIndicatorRTL: {
    marginRight: 8,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1a1a1a",
    marginTop: 20,
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
  authContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  authTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1a1a1a",
    marginTop: 20,
    marginBottom: 10,
  },
  authDescription: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 25,
    lineHeight: 20,
  },
  authButton: {
    backgroundColor: "#B80200",
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 12,
  },
  authButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
});

export default Chat;

//     borderRadius: 12,
//   },
//   authButtonText: {
//     color: "#ffffff",
//     fontSize: 16,
//     fontWeight: "700",
//   },
// });

// export default Chat;
