import React from "react";
import { View, Text, StyleSheet, Image, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { Message } from "@/constants/storage";

interface MessageBubbleProps {
  message: Message;
  isMine: boolean;
}

function StatusIcon({ status }: { status: Message["status"] }) {
  if (status === "sending") {
    return <Ionicons name="time-outline" size={12} color={Colors.textMuted} />;
  }
  if (status === "sent") {
    return <Ionicons name="checkmark" size={12} color={Colors.textMuted} />;
  }
  if (status === "delivered") {
    return <Ionicons name="checkmark-done" size={12} color={Colors.textMuted} />;
  }
  if (status === "read") {
    return <Ionicons name="checkmark-done" size={12} color={Colors.read} />;
  }
  return null;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${m} ${ampm}`;
}

export function MessageBubble({ message, isMine }: MessageBubbleProps) {
  return (
    <View style={[styles.row, isMine ? styles.rowMine : styles.rowTheirs]}>
      <View
        style={[
          styles.bubble,
          isMine ? styles.bubbleMine : styles.bubbleTheirs,
        ]}
      >
        {message.imageUri ? (
          <Image source={{ uri: message.imageUri }} style={styles.image} resizeMode="cover" />
        ) : null}
        {message.text ? (
          <Text style={styles.text}>{message.text}</Text>
        ) : null}
        <View style={styles.footer}>
          <Text style={styles.time}>{formatTime(message.timestamp)}</Text>
          {isMine ? <StatusIcon status={message.status} /> : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 16,
    paddingVertical: 2,
  },
  rowMine: {
    alignItems: "flex-end",
  },
  rowTheirs: {
    alignItems: "flex-start",
  },
  bubble: {
    maxWidth: "78%",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
      },
      android: { elevation: 2 },
    }),
  },
  bubbleMine: {
    backgroundColor: Colors.sentBubble,
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    backgroundColor: Colors.receivedBubble,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  text: {
    color: Colors.text,
    fontSize: 15,
    lineHeight: 21,
    fontFamily: "Inter_400Regular",
  },
  image: {
    width: 200,
    height: 150,
    borderRadius: 12,
    marginBottom: 6,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
    justifyContent: "flex-end",
  },
  time: {
    color: Colors.textMuted,
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
});
