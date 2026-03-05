import React, { useEffect, useCallback, useRef } from "react";
import {
  FlatList,
  View,
  Text,
  StyleSheet,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import Animated, { FadeIn } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "@/constants/colors";
import { MessageBubble } from "@/components/MessageBubble";
import { ChatInput } from "@/components/ChatInput";
import { useApp } from "@/context/AppContext";
import { useChat } from "@/context/ChatContext";
import { Message } from "@/constants/storage";

const MOOD_ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  happy: "sunny-outline",
  loved: "heart-outline",
  sad: "rainy-outline",
  tired: "moon-outline",
  excited: "flash-outline",
  anxious: "thunderstorm-outline",
};

function Header() {
  const { partnerProfile, partnerOnline } = useApp();
  const partnerName = partnerProfile?.name || "Partner";
  const partnerMood = partnerProfile?.mood;

  return (
    <View style={styles.header}>
      <LinearGradient colors={["#0C0811", "#120B18"]} style={StyleSheet.absoluteFill} />
      <View style={styles.headerAvatar}>
        <LinearGradient colors={[Colors.accent, "#C24060"]} style={styles.avatarGradient}>
          <Text style={styles.avatarText}>{partnerName.charAt(0).toUpperCase()}</Text>
        </LinearGradient>
        {partnerOnline ? <View style={styles.onlineDot} /> : null}
      </View>
      <View style={styles.headerInfo}>
        <Text style={styles.headerName}>{partnerName}</Text>
        <View style={styles.headerStatus}>
          {partnerMood ? (
            <>
              <Ionicons
                name={MOOD_ICON_MAP[partnerMood] || "ellipsis-horizontal"}
                size={12}
                color={Colors.accentSoft}
              />
              <Text style={styles.headerStatusText}>Feeling {partnerMood}</Text>
            </>
          ) : (
            <Text style={styles.headerStatusText}>
              {partnerOnline ? "Online" : "Offline"}
            </Text>
          )}
        </View>
      </View>
      <Ionicons
        name={partnerOnline ? "wifi" : "wifi-outline"}
        size={18}
        color={partnerOnline ? Colors.online : Colors.textMuted}
      />
    </View>
  );
}

function EmptyChat() {
  const { partnerProfile } = useApp();
  return (
    <Animated.View entering={FadeIn.duration(600)} style={styles.emptyContainer}>
      <LinearGradient
        colors={[Colors.accent + "22", Colors.accent + "05"]}
        style={styles.emptyIcon}
      >
        <Ionicons name="heart" size={32} color={Colors.accent} />
      </LinearGradient>
      <Text style={styles.emptyTitle}>
        {partnerProfile?.name
          ? `Connected with ${partnerProfile.name}`
          : "Waiting for your partner"}
      </Text>
      <Text style={styles.emptySubtitle}>
        Messages are private and stored on your device.
      </Text>
    </Animated.View>
  );
}

function DateSeparator({ date }: { date: string }) {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  let label: string;
  if (d.toDateString() === today.toDateString()) {
    label = "Today";
  } else if (d.toDateString() === yesterday.toDateString()) {
    label = "Yesterday";
  } else {
    label = d.toLocaleDateString(undefined, { month: "long", day: "numeric" });
  }

  return (
    <View style={styles.dateSep}>
      <View style={styles.dateSepLine} />
      <Text style={styles.dateSepText}>{label}</Text>
      <View style={styles.dateSepLine} />
    </View>
  );
}

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const { deviceId } = useApp();
  const { messages, sendMessage, markRead } = useChat();
  const listRef = useRef<FlatList<Message>>(null);

  useEffect(() => {
    markRead();
  }, [messages.length, markRead]);

  const scrollToBottom = useCallback(() => {
    if (messages.length > 0) {
      listRef.current?.scrollToEnd({ animated: false });
    }
  }, [messages.length]);

  const renderItem = useCallback(
    ({ item, index }: { item: Message; index: number }) => {
      const isMine = item.senderId === deviceId;
      const prevMsg = index > 0 ? messages[index - 1] : undefined;
      const showDate =
        !prevMsg ||
        new Date(item.timestamp).toDateString() !==
          new Date(prevMsg.timestamp).toDateString();

      return (
        <View>
          {showDate ? <DateSeparator date={item.timestamp} /> : null}
          <MessageBubble message={item} isMine={isMine} />
        </View>
      );
    },
    [deviceId, messages]
  );

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
      <Header />
      <KeyboardAvoidingView style={styles.flex} behavior="padding" keyboardVerticalOffset={0}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          style={styles.flex}
          contentContainerStyle={styles.listContent}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={scrollToBottom}
          onLayout={scrollToBottom}
          ListEmptyComponent={<EmptyChat />}
          showsVerticalScrollIndicator={false}
        />
        <View style={{ paddingBottom: Platform.OS === "web" ? 84 : insets.bottom + 49 }}>
          <ChatInput onSend={sendMessage} />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    overflow: "hidden",
  },
  headerAvatar: { position: "relative" },
  avatarGradient: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 18, fontFamily: "Inter_600SemiBold" },
  onlineDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.online,
    borderWidth: 2,
    borderColor: Colors.bg,
  },
  headerInfo: { flex: 1, gap: 2 },
  headerName: { fontSize: 17, fontFamily: "Inter_600SemiBold", color: Colors.text },
  headerStatus: { flexDirection: "row", alignItems: "center", gap: 4 },
  headerStatusText: { fontSize: 13, color: Colors.textSecondary, fontFamily: "Inter_400Regular" },
  listContent: { paddingVertical: 12, flexGrow: 1 },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 16,
    paddingVertical: 60,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  dateSep: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 12,
    paddingHorizontal: 16,
    gap: 10,
  },
  dateSepLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dateSepText: { fontSize: 12, color: Colors.textMuted, fontFamily: "Inter_400Regular" },
});
