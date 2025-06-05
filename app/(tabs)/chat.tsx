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
import type { Conversation } from "../../utils/chat-api";
import { getConversations } from "../../utils/chat-api";

export default function Chat() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { updateUnreadCount } = useChatContext();
  const insets = useSafeAreaInsets();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchConversations();
    }
  }, [isAuthenticated]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await getConversations();
      const conversationsData = response.data?.data || response.data || [];
      setConversations(conversationsData);
      await updateUnreadCount();
    } catch (error: any) {
      console.error("Error fetching conversations:", error);
      Alert.alert(t("error"), t("failedToFetchConversations"));
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
      // 7 days
      return date.toLocaleDateString([], { weekday: "short" });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participants.find((p) => p._id !== user?._id);
  };

  const handleConversationPress = (conversation: Conversation) => {
    const otherParticipant = getOtherParticipant(conversation);
    router.push(
      `./conversation?conversationId=${conversation._id}&recipientName=${otherParticipant?.username}`
    );
  };

  const renderConversationItem = ({ item }: { item: Conversation }) => {
    const otherParticipant = getOtherParticipant(item);
    const hasUnread = Boolean(item.unreadCount && item.unreadCount > 0);

    return (
      <TouchableOpacity
        style={[
          styles.conversationItem,
          hasUnread && styles.unreadConversation,
        ]}
        onPress={() => handleConversationPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          {otherParticipant?.profileImage ? (
            <Image
              source={{ uri: otherParticipant.profileImage }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={24} color="#999" />
            </View>
          )}
          {hasUnread && <View style={styles.onlineIndicator} />}
        </View>

        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text
              style={[styles.participantName, hasUnread && styles.unreadText]}
              numberOfLines={1}
            >
              {otherParticipant?.username || t("unknownUser")}
            </Text>
            <Text
              style={[styles.timestamp, hasUnread && styles.unreadTimestamp]}
            >
              {formatTime(item.lastMessageAt)}
            </Text>
          </View>

          <View style={styles.messagePreview}>
            <Text
              style={[styles.lastMessage, hasUnread && styles.unreadText]}
              numberOfLines={1}
            >
              {item.lastMessage || t("noMessages")}
            </Text>
            {hasUnread && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>
                  {item.unreadCount! > 99
                    ? "99+"
                    : item.unreadCount!.toString()}
                </Text>
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
      <Text style={styles.emptyStateTitle}>{t("noConversations")}</Text>
      <Text style={styles.emptyStateDescription}>
        {t("startChattingDescription")}
      </Text>
    </View>
  );

  if (!isAuthenticated) {
    return (
      <View style={styles.authContainer}>
        <Ionicons name="chatbubbles-outline" size={80} color="#B80200" />
        <Text style={styles.authTitle}>{t("loginRequired")}</Text>
        <Text style={styles.authDescription}>{t("loginToAccessChat")}</Text>
        <TouchableOpacity
          style={styles.authButton}
          onPress={() => router.push("/login")}
          activeOpacity={0.8}
        >
          <Text style={styles.authButtonText}>{t("login")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t("messages")}</Text>
        <TouchableOpacity style={styles.headerButton} activeOpacity={0.7}>
          <Ionicons name="create-outline" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#B80200" />
            <Text style={styles.loadingText}>{t("loading")}</Text>
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
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  header: {
    backgroundColor: "#1a1a1a",
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#ffffff",
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
  unreadConversation: {
    backgroundColor: "#fafafa",
  },
  avatarContainer: {
    position: "relative",
    marginRight: 12,
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
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#B80200",
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: "row",
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
  timestamp: {
    fontSize: 12,
    color: "#999",
    marginLeft: 8,
  },
  unreadTimestamp: {
    color: "#B80200",
    fontWeight: "600",
  },
  messagePreview: {
    flexDirection: "row",
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
    marginLeft: 8,
  },
  unreadBadgeText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "700",
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
