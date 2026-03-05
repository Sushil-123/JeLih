import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";
import { useApp } from "@/context/AppContext";

function SettingRow({
  icon,
  label,
  value,
  onPress,
  danger,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
    >
      <View style={[styles.rowIcon, danger && styles.rowIconDanger]}>
        <Ionicons name={icon} size={18} color={danger ? "#E85D75" : Colors.textSecondary} />
      </View>
      <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>{label}</Text>
      {value ? <Text style={styles.rowValue}>{value}</Text> : null}
      {onPress ? (
        <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
      ) : null}
    </Pressable>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { userProfile, pairCode, partnerProfile, updateUserProfile, unpair, deviceId } = useApp();
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(userProfile.name);

  const handleSaveName = async () => {
    if (!nameValue.trim()) return;
    await updateUserProfile({ name: nameValue.trim() });
    setEditingName(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleUnpair = () => {
    Alert.alert(
      "Disconnect",
      "This will remove your connection and all local messages. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disconnect",
          style: "destructive",
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await unpair();
          },
        },
      ]
    );
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: botPad + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(400)} style={styles.avatarSection}>
          <LinearGradient
            colors={[Colors.accent, "#C24060"]}
            style={styles.avatar}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.avatarText}>
              {(userProfile.name || "?").charAt(0).toUpperCase()}
            </Text>
          </LinearGradient>
          {editingName ? (
            <View style={styles.nameEdit}>
              <TextInput
                style={styles.nameInput}
                value={nameValue}
                onChangeText={setNameValue}
                autoFocus
                maxLength={30}
                onSubmitEditing={handleSaveName}
              />
              <Pressable onPress={handleSaveName} style={styles.saveNameBtn}>
                <Ionicons name="checkmark" size={20} color={Colors.accent} />
              </Pressable>
            </View>
          ) : (
            <Pressable onPress={() => setEditingName(true)} style={styles.nameRow}>
              <Text style={styles.name}>{userProfile.name || "Tap to set name"}</Text>
              <Ionicons name="pencil-outline" size={16} color={Colors.textMuted} />
            </Pressable>
          )}
          {userProfile.mood ? (
            <Text style={styles.moodText}>Feeling {userProfile.mood}</Text>
          ) : null}
        </Animated.View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connection</Text>
          <View style={styles.card}>
            <SettingRow
              icon="link-outline"
              label="Pair code"
              value={pairCode || "—"}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="person-outline"
              label="Partner"
              value={partnerProfile?.name || "Not connected"}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="phone-portrait-outline"
              label="Device ID"
              value={deviceId ? deviceId.slice(0, 8) + "…" : "—"}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy</Text>
          <View style={styles.card}>
            <SettingRow
              icon="lock-closed-outline"
              label="Messages stored locally"
              value="On device only"
            />
            <View style={styles.divider} />
            <SettingRow
              icon="shield-checkmark-outline"
              label="End-to-end relay"
              value="Via WebSocket"
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.card}>
            <SettingRow
              icon="log-out-outline"
              label="Disconnect & reset"
              onPress={handleUnpair}
              danger
            />
          </View>
        </View>

        <Text style={styles.footer}>Heartline — Your private space, together.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 28, fontFamily: "Inter_700Bold", color: Colors.text },
  scroll: { padding: 20, gap: 24 },
  avatarSection: { alignItems: "center", gap: 12, paddingVertical: 12 },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 36, color: "#fff", fontFamily: "Inter_700Bold" },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  name: { fontSize: 22, fontFamily: "Inter_600SemiBold", color: Colors.text },
  moodText: { fontSize: 14, color: Colors.textSecondary, fontFamily: "Inter_400Regular" },
  nameEdit: { flexDirection: "row", alignItems: "center", gap: 8 },
  nameInput: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: Colors.text,
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    borderWidth: 1,
    borderColor: Colors.accent,
    minWidth: 160,
  },
  saveNameBtn: { padding: 8 },
  section: { gap: 8 },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  rowIconDanger: {
    backgroundColor: Colors.accent + "18",
  },
  rowLabel: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular", color: Colors.text },
  rowLabelDanger: { color: Colors.accent },
  rowValue: { fontSize: 13, color: Colors.textMuted, fontFamily: "Inter_400Regular", maxWidth: 120, textAlign: "right" },
  divider: { height: 1, backgroundColor: Colors.border, marginLeft: 62 },
  footer: {
    textAlign: "center",
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
    paddingTop: 8,
  },
});
