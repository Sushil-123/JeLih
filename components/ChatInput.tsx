import React, { useRef, useState } from "react";
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";

interface ChatInputProps {
  onSend: (text?: string, imageUri?: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [text, setText] = useState("");
  const [pickingImage, setPickingImage] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSend(trimmed, undefined);
    setText("");
    inputRef.current?.focus();
  };

  const handleImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    setPickingImage(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        quality: 0.8,
        allowsEditing: true,
      });
      if (!result.canceled && result.assets[0]) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onSend(undefined, result.assets[0].uri);
      }
    } finally {
      setPickingImage(false);
    }
  };

  const canSend = text.trim().length > 0;

  return (
    <View style={styles.container}>
      <Pressable onPress={handleImage} style={styles.iconBtn} disabled={pickingImage}>
        {pickingImage ? (
          <ActivityIndicator size="small" color={Colors.textSecondary} />
        ) : (
          <Ionicons name="image-outline" size={24} color={Colors.textSecondary} />
        )}
      </Pressable>
      <TextInput
        ref={inputRef}
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder="Message..."
        placeholderTextColor={Colors.textMuted}
        multiline
        maxLength={2000}
        returnKeyType="default"
        editable={!disabled}
      />
      <Pressable
        onPress={handleSend}
        style={({ pressed }) => [
          styles.sendBtn,
          canSend ? styles.sendBtnActive : styles.sendBtnInactive,
          pressed && canSend ? { opacity: 0.8, transform: [{ scale: 0.94 }] } : {},
        ]}
        disabled={!canSend || disabled}
      >
        <Ionicons name="arrow-up" size={18} color={canSend ? Colors.white : Colors.textMuted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 8,
  },
  iconBtn: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 1,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === "ios" ? 10 : 8,
    color: Colors.text,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    maxHeight: 120,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 1,
  },
  sendBtnActive: {
    backgroundColor: Colors.accent,
  },
  sendBtnInactive: {
    backgroundColor: Colors.card,
  },
});
