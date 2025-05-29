import { useRouter } from "expo-router";
import React, { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import LoginPrompt from "../../components/LoginPrompt";
import { AuthContext } from "../../contexts/AuthContext";
import { Conversation } from "../../types";
import { getConversations } from "../../utils/api";

export default function Chat() {
  const { isAuthenticated } = useContext(AuthContext);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    if (isAuthenticated) {
      console.log("Chat: Fetching conversations...");
      fetchConversations();
    }
  }, [isAuthenticated]);

  const fetchConversations = async () => {
    try {
      const { data } = await getConversations(); // Your /api/conversations
      console.log("Chat: Conversations fetched:", data.length);
      setConversations(data);
    } catch (error) {
      console.error("Chat: Error fetching conversations:", error);
      Alert.alert(t("error"), t("failedToFetchConversations"));
    }
  };

  if (!isAuthenticated) {
    console.log("Chat: User not authenticated, showing LoginPrompt");
    return <LoginPrompt />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => {
              console.log(
                "Chat: Navigating to chat-detail with conversationId:",
                item._id
              );
              //router.push(`/chat-detail?conversationId=${item._id}`);
            }}
            style={styles.conversationItem}
          >
            <Text>{item.lastMessage}</Text>
            <Text style={styles.timestamp}>
              {new Date(item.lastMessageAt).toLocaleString()}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  conversationItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  timestamp: {
    fontSize: 12,
    color: "#666",
    marginTop: 5,
  },
});
