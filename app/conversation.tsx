"use client";

import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useAuth } from "../contexts/AuthContext";
import { useChatContext } from "../contexts/ChatContext";
import { useRTL } from "../hooks/useRTL";
import type { Message } from "../utils/chat-api";
import {
  getMessages,
  markMessagesAsRead,
  sendMessage,
} from "../utils/chat-api";

export default function Conversation() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const { updateUnreadCount } = useChatContext();
  const { isRTL, rtlStyle, rtlViewStyle } = useRTL();
  const insets = useSafeAreaInsets();
  const { conversationId, recipientName } = useLocalSearchParams();
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Decode the recipient name
  const decodedRecipientName = recipientName
    ? decodeURIComponent(recipientName as string)
    : "Conversation";

  // Auto-refresh messages every 3 seconds
  useEffect(() => {
    if (conversationId) {
      fetchMessages();
      markAsRead();

      const interval = setInterval(() => {
        fetchMessages(false); // Silent refresh
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [conversationId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchMessages(false);
    setRefreshing(false);
  }, [conversationId]);

  const fetchMessages = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      console.log(
        "Conversation: Fetching messages for conversation:",
        conversationId
      );

      const response = await getMessages(conversationId as string);
      const messagesData = response.data?.data || response.data || [];

      console.log("Conversation: Fetched messages:", messagesData.length);
      console.log("Conversation: Current user ID:", user?._id);

      // Validate message data
      const validatedMessages = messagesData.map((message: any) => {
        console.log("Conversation: Processing message:", message._id);
        console.log("Conversation: Message sender:", message.sender);

        // Ensure sender is properly formatted
        if (typeof message.sender === "string") {
          console.warn(
            "Conversation: Sender is still a string ID:",
            message.sender
          );
          return {
            ...message,
            sender: {
              _id: message.sender,
              username: "Loading...",
              profileImage: null,
            },
          };
        }

        return message;
      });

      setMessages(validatedMessages);
      setTimeout(() => scrollToBottom(), 100);
    } catch (error: any) {
      console.error("Conversation: Error fetching messages:", error);
      if (showLoading) {
        Alert.alert(t("error"), t("failedToFetchMessages"));
      }
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const markAsRead = async () => {
    try {
      await markMessagesAsRead(conversationId as string);
      await updateUnreadCount();
    } catch (error) {
      console.error("Conversation: Error marking messages as read:", error);
    }
  };

  const scrollToBottom = () => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() && !selectedImage) return;

    const tempMessage = messageText.trim();
    const tempImage = selectedImage;

    // Clear input immediately for better UX
    setMessageText("");
    setSelectedImage(null);

    setSending(true);
    try {
      console.log("Conversation: Sending message:", tempMessage);
      console.log("Conversation: To conversation:", conversationId);

      const response = await sendMessage(
        conversationId as string,
        tempMessage,
        tempImage || undefined
      );
      console.log("Conversation: Message sent response:", response.data);

      // Refresh messages to get the latest
      await fetchMessages(false);
      await updateUnreadCount();
    } catch (error: any) {
      console.error("Conversation: Error sending message:", error);
      Alert.alert(t("error"), t("failedToSendMessage"));

      // Restore message on error
      setMessageText(tempMessage);
      setSelectedImage(tempImage);
    } finally {
      setSending(false);
    }
  };

  const handleImagePicker = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(t("error"), t("photoPermissionRequired"));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const formatMessageTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isMyMessage = item.sender._id === user?._id;
    const showTime =
      index === messages.length - 1 ||
      messages[index + 1].sender._id !== item.sender._id ||
      new Date(messages[index + 1].createdAt).getTime() -
        new Date(item.createdAt).getTime() >
        300000; // 5 minutes

    return (
      <View style={styles.messageContainer}>
        <View
          style={[
            styles.messageBubble,
            isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble,
            isMyMessage && isRTL && styles.myMessageBubbleRTL,
            !isMyMessage && isRTL && styles.otherMessageBubbleRTL,
          ]}
        >
          {item.image && (
            <Image source={{ uri: item.image }} style={styles.messageImage} />
          )}
          {item.message && (
            <Text
              style={[
                styles.messageText,
                isMyMessage ? styles.myMessageText : styles.otherMessageText,
                rtlStyle,
              ]}
            >
              {item.message}
            </Text>
          )}
          {showTime && (
            <Text
              style={[
                styles.messageTime,
                isMyMessage ? styles.myMessageTime : styles.otherMessageTime,
                rtlStyle,
              ]}
            >
              {formatMessageTime(item.createdAt)}
            </Text>
          )}
        </View>
      </View>
    );
  };

  const renderInputArea = () => (
    <View style={styles.inputContainer}>
      <View style={[styles.inputRow, rtlViewStyle]}>
        <TextInput
          style={[styles.textInput, rtlStyle]}
          value={messageText}
          onChangeText={setMessageText}
          placeholder={t("typeMessage")}
          placeholderTextColor="#999"
          multiline
          maxLength={1000}
        />

        <TouchableOpacity
          style={[
            styles.sendButton,
            !messageText.trim() && !selectedImage && styles.sendButtonDisabled,
          ]}
          onPress={handleSendMessage}
          disabled={sending || (!messageText.trim() && !selectedImage)}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Ionicons
              name={isRTL ? "arrow-back" : "send"}
              size={20}
              color="#ffffff"
              style={isRTL ? { transform: [{ scaleX: -1 }] } : {}}
            />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, rtlViewStyle]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons
            name={isRTL ? "arrow-forward" : "arrow-back"}
            size={24}
            color="#ffffff"
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, rtlStyle]} numberOfLines={1}>
          {decodedRecipientName}
        </Text>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? insets.top + 55 : 0}
      >
        {/* Messages */}
        <View style={styles.messagesContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#B80200" />
              <Text style={[styles.loadingText, rtlStyle]}>{t("loading")}</Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item._id}
              renderItem={renderMessage}
              contentContainerStyle={styles.messagesList}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={scrollToBottom}
              onLayout={scrollToBottom}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor="#B80200"
                  colors={["#B80200"]}
                  progressBackgroundColor="#ffffff"
                />
              }
            />
          )}
        </View>
        {/* Input Area */}
        {renderInputArea()}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#323332",
  },
  header: {
    backgroundColor: "#323332",
    paddingHorizontal: 20,
    // paddingVertical: 15,
    alignItems: "center",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
    paddingVertical: 15,
    paddingHorizontal: 15,
  },
  keyboardAvoidingContainer: {
    flex: 1,
  },
  messagesContainer: {
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
  messagesList: {
    paddingVertical: 10,
    paddingHorizontal: 0, // REMOVED ALL HORIZONTAL PADDING
  },
  messageContainer: {
    marginVertical: 2,
    paddingHorizontal: 16, // ONLY PADDING HERE
  },
  messageBubble: {
    maxWidth: "75%",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignSelf: "flex-end", // Default to right (my messages)
  },
  myMessageBubble: {
    backgroundColor: "#B80200",
    borderBottomRightRadius: 4,
    alignSelf: "flex-end",
  },
  myMessageBubbleRTL: {
    borderBottomRightRadius: 18,
    borderBottomLeftRadius: 4,
    alignSelf: "flex-start", // Left side in RTL
  },
  otherMessageBubble: {
    backgroundColor: "#ffffff",
    borderBottomLeftRadius: 4,
    alignSelf: "flex-start", // Left side for other messages
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  otherMessageBubbleRTL: {
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 4,
    alignSelf: "flex-end", // Right side in RTL
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
    marginBottom: 8,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  myMessageText: {
    color: "#ffffff",
  },
  otherMessageText: {
    color: "#1a1a1a",
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  myMessageTime: {
    color: "rgba(255, 255, 255, 0.7)",
  },
  otherMessageTime: {
    color: "#999",
  },
  inputContainer: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  inputRow: {
    alignItems: "flex-end",
    gap: 12,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    backgroundColor: "#f8f9fa",
  },
  sendButton: {
    backgroundColor: "#B80200",
    borderRadius: 20,
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#ccc",
  },
});
