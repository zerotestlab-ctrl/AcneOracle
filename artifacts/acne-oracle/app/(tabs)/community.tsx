import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fetch } from "expo/fetch";

import Colors from "@/constants/colors";
import { useApp, type ChatMessage } from "@/context/AppContext";

const C = Colors.dark;
const BASE_URL = `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;

const SUGGESTED = [
  "What skincare routine is best for cystic acne?",
  "Which foods trigger hormonal breakouts?",
  "Is The Ordinary niacinamide worth it?",
  "How long before I see results from a new routine?",
];

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <View style={[styles.bubbleRow, isUser && styles.bubbleRowUser]}>
      {!isUser && (
        <LinearGradient colors={C.tealGradient} style={styles.avatar}>
          <Ionicons name="sparkles" size={14} color="#fff" />
        </LinearGradient>
      )}
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
        <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextAI]}>
          {message.content}
        </Text>
      </View>
    </View>
  );
}

function TypingIndicator() {
  return (
    <View style={styles.bubbleRow}>
      <LinearGradient colors={C.tealGradient} style={styles.avatar}>
        <Ionicons name="sparkles" size={14} color="#fff" />
      </LinearGradient>
      <View style={[styles.bubble, styles.bubbleAI, styles.typingBubble]}>
        <ActivityIndicator size="small" color={C.teal} />
        <Text style={styles.typingText}>Analyzing...</Text>
      </View>
    </View>
  );
}

export default function CommunityScreen() {
  const insets = useSafeAreaInsets();
  const { chatHistory, addChatMessage, clearChat, userProfile } = useApp();
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const flatRef = useRef<FlatList>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const displayMessages: ChatMessage[] = streamingContent
    ? [
        ...chatHistory,
        {
          id: "streaming",
          role: "assistant" as const,
          content: streamingContent,
          timestamp: new Date().toISOString(),
        },
      ]
    : chatHistory;

  const sendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return;
    const msg = text.trim();
    setInput("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    await addChatMessage({ role: "user", content: msg });
    setIsTyping(true);
    setStreamingContent("");

    try {
      const history = chatHistory.slice(-8).map((m) => ({ role: m.role, content: m.content }));
      const response = await fetch(`${BASE_URL}/acne/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, history, userProfile }),
      });

      if (!response.ok || !response.body) throw new Error("Chat failed");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        const lines = text.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                full += data.content;
                setStreamingContent(full);
              }
              if (data.done) break;
            } catch {}
          }
        }
      }

      setStreamingContent("");
      await addChatMessage({ role: "assistant", content: full || "I'm here to help! Please try again." });
    } catch (err) {
      setStreamingContent("");
      await addChatMessage({ role: "assistant", content: "I'm having trouble connecting right now. Please try again in a moment." });
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: C.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <View>
          <Text style={styles.title}>AI Coach</Text>
          <View style={styles.onlineRow}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>AcneOracle AI · Always available</Text>
          </View>
        </View>
        {chatHistory.length > 0 && (
          <Pressable onPress={clearChat} style={styles.clearBtn}>
            <Ionicons name="trash-outline" size={18} color={C.textSecondary} />
          </Pressable>
        )}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatRef}
          data={displayMessages}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => <MessageBubble message={item} />}
          inverted={false}
          onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
          contentContainerStyle={styles.messageList}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <LinearGradient colors={C.tealGradient} style={styles.emptyAvatar}>
                <Ionicons name="sparkles" size={32} color="#fff" />
              </LinearGradient>
              <Text style={styles.emptyTitle}>
                {userProfile ? `Hey ${userProfile.nickname}! 👋` : "Your AI Skin Coach"}
              </Text>
              <Text style={styles.emptySubtitle}>
                {userProfile
                  ? `Ask me anything about your ${userProfile.skinTone} skin, your "${userProfile.currentCream}", or anything acne-related.`
                  : "Ask me anything about acne, skincare routines, ingredients, or products. I'm here to help you get clearer skin."}
              </Text>
              <Text style={styles.disclaimerText}>
                Wellness coach only · Not medical advice
              </Text>
              <View style={styles.suggestedList}>
                {SUGGESTED.map((s) => (
                  <Pressable
                    key={s}
                    style={styles.suggChip}
                    onPress={() => sendMessage(s)}
                  >
                    <Text style={styles.suggText}>{s}</Text>
                    <Ionicons name="arrow-forward" size={14} color={C.teal} />
                  </Pressable>
                ))}
              </View>
            </View>
          }
          ListFooterComponent={isTyping && !streamingContent ? <TypingIndicator /> : null}
        />

        <View style={[styles.inputBar, { paddingBottom: botPad + 10 }]}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask about your skin..."
            placeholderTextColor={C.textTertiary}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={() => sendMessage(input)}
          />
          <Pressable
            style={[styles.sendBtn, (!input.trim() || isTyping) && styles.sendBtnDisabled]}
            onPress={() => sendMessage(input)}
            disabled={!input.trim() || isTyping}
          >
            <LinearGradient
              colors={(!input.trim() || isTyping) ? [C.backgroundTertiary, C.backgroundTertiary] : C.tealGradient}
              style={styles.sendGrad}
            >
              <Ionicons name="send" size={18} color={(!input.trim() || isTyping) ? C.textTertiary : "#fff"} />
            </LinearGradient>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  title: { fontFamily: "Inter_700Bold", fontSize: 28, color: C.text, marginBottom: 4 },
  onlineRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.teal },
  onlineText: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.textSecondary },
  clearBtn: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: C.card, justifyContent: "center", alignItems: "center",
    borderWidth: 1, borderColor: C.cardBorder,
  },
  messageList: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    flexGrow: 1,
  },
  bubbleRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, marginBottom: 12 },
  bubbleRowUser: { justifyContent: "flex-end" },
  avatar: { width: 28, height: 28, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  bubble: { maxWidth: "80%", padding: 12, borderRadius: 18 },
  bubbleUser: {
    backgroundColor: C.accent,
    borderBottomRightRadius: 6,
  },
  bubbleAI: {
    backgroundColor: C.card,
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  bubbleText: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 21 },
  bubbleTextUser: { color: "#fff" },
  bubbleTextAI: { color: C.text },
  typingBubble: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 10 },
  typingText: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.textSecondary },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: C.separator,
    backgroundColor: C.background,
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: C.inputBg,
    borderWidth: 1,
    borderColor: C.inputBorder,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: C.text,
    maxHeight: 100,
  },
  sendBtn: { borderRadius: 18, overflow: "hidden" },
  sendBtnDisabled: { opacity: 0.5 },
  sendGrad: { width: 44, height: 44, justifyContent: "center", alignItems: "center", borderRadius: 18 },
  emptyState: { alignItems: "center", paddingTop: 24, paddingHorizontal: 20, gap: 12 },
  emptyAvatar: { width: 72, height: 72, borderRadius: 22, justifyContent: "center", alignItems: "center" },
  emptyTitle: { fontFamily: "Inter_700Bold", fontSize: 22, color: C.text },
  emptySubtitle: { fontFamily: "Inter_400Regular", fontSize: 14, color: C.textSecondary, textAlign: "center", lineHeight: 22 },
  disclaimerText: {
    fontFamily: "Inter_400Regular", fontSize: 11, color: C.textTertiary,
    backgroundColor: C.card, paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 10, overflow: "hidden",
  },
  suggestedList: { width: "100%", gap: 8, marginTop: 8 },
  suggChip: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: C.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: C.cardBorder,
  },
  suggText: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.textSecondary, flex: 1, marginRight: 8 },
});
