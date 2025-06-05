"use client";

import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../contexts/AuthContext";
import { useChatContext } from "../contexts/ChatContext";
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
  const insets = useSafeAreaInsets();
  const { conversationId, recipientName } = useLocalSearchParams();
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (conversationId) {
      fetchMessages();
      markAsRead();
    }
  }, [conversationId]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await getMessages(conversationId as string);
      const messagesData = response.data?.data || response.data || [];
      setMessages(messagesData);
      setTimeout(() => scrollToBottom(), 100);
    } catch (error: any) {
      console.error("Error fetching messages:", error);
      Alert.alert(t("error"), t("failedToFetchMessages"));
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async () => {
    try {
      await markMessagesAsRead(conversationId as string);
      await updateUnreadCount();
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  const scrollToBottom = () => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() && !selectedImage) return;

    setSending(true);
    try {
      const response = await sendMessage(
        conversationId as string,
        messageText.trim(),
        selectedImage || undefined
      );

      const newMessage = response.data?.data || response.data;
      setMessages((prev) => [...prev, newMessage]);
      setMessageText("");
      setSelectedImage(null);
      setTimeout(() => scrollToBottom(), 100);
    } catch (error: any) {
      console.error("Error sending message:", error);
      Alert.alert(t("error"), t("failedToSendMessage"));
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
    const showAvatar =
      index === 0 || messages[index - 1].sender._id !== item.sender._id;
    const showTime =
      index === messages.length - 1 ||
      messages[index + 1].sender._id !== item.sender._id ||
      new Date(messages[index + 1].createdAt).getTime() -
        new Date(item.createdAt).getTime() >
        300000; // 5 minutes

    return (
      <View
        style={[
          styles.messageContainer,
          isMyMessage && styles.myMessageContainer,
        ]}
      >
        {!isMyMessage && showAvatar && (
          <View style={styles.avatarContainer}>
            {item.sender.profileImage ? (
              <Image
                source={{ uri: item.sender.profileImage }}
                style={styles.messageAvatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={16} color="#999" />
              </View>
            )}
          </View>
        )}

        <View
          style={[
            styles.messageBubble,
            isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble,
            !isMyMessage && !showAvatar && styles.messageWithoutAvatar,
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
      {selectedImage && (
        <View style={styles.selectedImageContainer}>
          <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
          <TouchableOpacity
            style={styles.removeImageButton}
            onPress={() => setSelectedImage(null)}
          >
            <Ionicons name="close-circle" size={20} color="#B80200" />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.inputRow}>
        <TouchableOpacity
          style={styles.imageButton}
          onPress={handleImagePicker}
        >
          <Ionicons name="image-outline" size={24} color="#B80200" />
        </TouchableOpacity>

        <TextInput
          style={styles.textInput}
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
            <Ionicons name="send" size={20} color="#ffffff" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {recipientName || t("conversation")}
        </Text>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="call-outline" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <View style={styles.messagesContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#B80200" />
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
          />
        )}
      </View>

      {/* Input Area */}
      {renderInputArea()}
    </KeyboardAvoidingView>
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
    alignItems: "center",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  },
  headerButton: {
    padding: 8,
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
  messagesList: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  messageContainer: {
    flexDirection: "row",
    marginVertical: 2,
    alignItems: "flex-end",
  },
  myMessageContainer: {
    justifyContent: "flex-end",
  },
  avatarContainer: {
    marginRight: 8,
    marginBottom: 4,
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  messageBubble: {
    maxWidth: "75%",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginVertical: 1,
  },
  myMessageBubble: {
    backgroundColor: "#B80200",
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: "#ffffff",
    borderBottomLeftRadius: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageWithoutAvatar: {
    marginLeft: 40,
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
    textAlign: "right",
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
  selectedImageContainer: {
    position: "relative",
    marginBottom: 12,
    alignSelf: "flex-start",
  },
  selectedImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeImageButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#ffffff",
    borderRadius: 10,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
  },
  imageButton: {
    padding: 8,
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
