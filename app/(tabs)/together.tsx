import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Platform,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeIn, useSharedValue, useAnimatedStyle, withRepeat, withTiming } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors } from "@/constants/colors";
import { STORAGE_KEYS, RelationshipData, Mood } from "@/constants/storage";
import { useApp } from "@/context/AppContext";

const MOODS: { key: Mood; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: "happy", label: "Happy", icon: "sunny-outline" },
  { key: "loved", label: "Loved", icon: "heart-outline" },
  { key: "excited", label: "Excited", icon: "flash-outline" },
  { key: "tired", label: "Tired", icon: "moon-outline" },
  { key: "sad", label: "Sad", icon: "rainy-outline" },
  { key: "anxious", label: "Anxious", icon: "thunderstorm-outline" },
];

function daysBetween(a: Date, b: Date): number {
  return Math.floor(Math.abs(b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function CountdownCard({ label, date }: { label: string; date: string | null }) {
  if (!date) return null;
  const target = new Date(date);
  const now = new Date();
  const days = daysBetween(now, target);
  const isPast = target < now;
  return (
    <Animated.View entering={FadeInDown.duration(400)} style={styles.countdownCard}>
      <LinearGradient
        colors={[Colors.accent + "22", Colors.accent + "05"]}
        style={styles.countdownGrad}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.countdownDays}>{days}</Text>
        <Text style={styles.countdownUnit}>days</Text>
        <Text style={styles.countdownLabel}>{isPast ? `since ${label}` : `until ${label}`}</Text>
      </LinearGradient>
    </Animated.View>
  );
}

function MoodButton({ item, selected, onPress }: { item: typeof MOODS[0]; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.moodBtn,
        selected && styles.moodBtnSelected,
        pressed && { opacity: 0.8, transform: [{ scale: 0.95 }] },
      ]}
    >
      <Ionicons name={item.icon} size={22} color={selected ? Colors.accent : Colors.textSecondary} />
      <Text style={[styles.moodLabel, selected && styles.moodLabelSelected]}>{item.label}</Text>
    </Pressable>
  );
}

export default function TogetherScreen() {
  const insets = useSafeAreaInsets();
  const { userProfile, partnerProfile, updateMood } = useApp();
  const [relationship, setRelationship] = useState<RelationshipData>({
    anniversaryDate: null,
    firstMeetDate: null,
    nextMeetDate: null,
    partnerName: "",
  });
  const [showEdit, setShowEdit] = useState(false);
  const [form, setForm] = useState({ anniversaryDate: "", firstMeetDate: "", nextMeetDate: "" });

  const heartScale = useSharedValue(1);
  useEffect(() => {
    heartScale.value = withRepeat(withTiming(1.12, { duration: 900 }), -1, true);
  }, []);
  const heartStyle = useAnimatedStyle(() => ({ transform: [{ scale: heartScale.value }] }));

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.RELATIONSHIP);
      if (raw) {
        const data = JSON.parse(raw);
        setRelationship(data);
        setForm({
          anniversaryDate: data.anniversaryDate || "",
          firstMeetDate: data.firstMeetDate || "",
          nextMeetDate: data.nextMeetDate || "",
        });
      }
    })();
  }, []);

  const handleSaveRelationship = useCallback(async () => {
    const data: RelationshipData = {
      ...relationship,
      anniversaryDate: form.anniversaryDate || null,
      firstMeetDate: form.firstMeetDate || null,
      nextMeetDate: form.nextMeetDate || null,
    };
    setRelationship(data);
    await AsyncStorage.setItem(STORAGE_KEYS.RELATIONSHIP, JSON.stringify(data));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowEdit(false);
  }, [form, relationship]);

  const handleMood = useCallback(
    (mood: Mood) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      updateMood(mood);
    },
    [updateMood]
  );

  const toStr = (d: string | null) =>
    d ? new Date(d).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" }) : null;

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Together</Text>
        <Pressable onPress={() => setShowEdit(true)} style={styles.editBtn}>
          <Ionicons name="pencil-outline" size={20} color={Colors.textSecondary} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: botPad + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heartSection}>
          <Animated.View style={heartStyle}>
            <LinearGradient
              colors={[Colors.accent, "#C24060"]}
              style={styles.heartCircle}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="heart" size={40} color="#fff" />
            </LinearGradient>
          </Animated.View>
          <Text style={styles.coupleLabel}>
            {userProfile.name || "You"}{" "}
            <Text style={{ color: Colors.accent }}>&</Text>{" "}
            {partnerProfile?.name || "Partner"}
          </Text>
          {relationship.firstMeetDate ? (
            <Text style={styles.daysText}>
              {daysBetween(new Date(relationship.firstMeetDate), new Date())} days together
            </Text>
          ) : null}
        </View>

        <View style={styles.countdownRow}>
          <CountdownCard label="anniversary" date={relationship.anniversaryDate} />
          <CountdownCard label="next meet" date={relationship.nextMeetDate} />
        </View>

        {relationship.anniversaryDate ? (
          <Animated.View entering={FadeInDown.duration(400)} style={styles.dateCard}>
            <Ionicons name="calendar-outline" size={18} color={Colors.accentSoft} />
            <View>
              <Text style={styles.dateCardLabel}>Anniversary</Text>
              <Text style={styles.dateCardValue}>{toStr(relationship.anniversaryDate)}</Text>
            </View>
          </Animated.View>
        ) : null}

        {relationship.nextMeetDate ? (
          <Animated.View entering={FadeInDown.duration(400).delay(80)} style={styles.dateCard}>
            <Ionicons name="airplane-outline" size={18} color={Colors.accentSoft} />
            <View>
              <Text style={styles.dateCardLabel}>Next Meeting</Text>
              <Text style={styles.dateCardValue}>{toStr(relationship.nextMeetDate)}</Text>
            </View>
          </Animated.View>
        ) : null}

        <Text style={styles.sectionLabel}>How are you feeling today?</Text>
        <View style={styles.moodGrid}>
          {MOODS.map((m) => (
            <MoodButton
              key={m.key}
              item={m}
              selected={userProfile.mood === m.key}
              onPress={() => handleMood(m.key)}
            />
          ))}
        </View>

        {partnerProfile ? (
          <Animated.View entering={FadeIn.duration(600)} style={styles.partnerMoodCard}>
            <View style={styles.partnerMoodAvatar}>
              <LinearGradient
                colors={[Colors.accent, "#C24060"]}
                style={styles.partnerAvatar}
              >
                <Text style={styles.partnerAvatarText}>
                  {(partnerProfile.name || "P").charAt(0).toUpperCase()}
                </Text>
              </LinearGradient>
            </View>
            <View style={styles.partnerMoodInfo}>
              <Text style={styles.partnerMoodName}>{partnerProfile.name}</Text>
              {partnerProfile.mood ? (
                <View style={styles.partnerMoodRow}>
                  <Ionicons
                    name={MOODS.find((m) => m.key === partnerProfile.mood)?.icon || "help-circle-outline"}
                    size={16}
                    color={Colors.accentSoft}
                  />
                  <Text style={styles.partnerMoodLabel}>
                    is feeling {partnerProfile.mood}
                  </Text>
                </View>
              ) : (
                <Text style={styles.partnerMoodLabel}>No mood shared yet</Text>
              )}
            </View>
          </Animated.View>
        ) : null}
      </ScrollView>

      <Modal visible={showEdit} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={[styles.sheet, { paddingBottom: botPad + 16 }]}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>Relationship Details</Text>
            <Text style={styles.fieldLabel}>Anniversary date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={form.anniversaryDate}
              onChangeText={(v) => setForm((f) => ({ ...f, anniversaryDate: v }))}
              placeholder="e.g. 2023-02-14"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numbers-and-punctuation"
            />
            <Text style={styles.fieldLabel}>First met date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={form.firstMeetDate}
              onChangeText={(v) => setForm((f) => ({ ...f, firstMeetDate: v }))}
              placeholder="e.g. 2022-08-01"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numbers-and-punctuation"
            />
            <Text style={styles.fieldLabel}>Next meeting date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={form.nextMeetDate}
              onChangeText={(v) => setForm((f) => ({ ...f, nextMeetDate: v }))}
              placeholder="e.g. 2025-07-10"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numbers-and-punctuation"
            />
            <View style={styles.sheetActions}>
              <Pressable onPress={() => setShowEdit(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleSaveRelationship} style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.85 }]}>
                <LinearGradient
                  colors={[Colors.accent, "#C24060"]}
                  style={styles.saveBtnGrad}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.saveText}>Save</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 28, fontFamily: "Inter_700Bold", color: Colors.text },
  editBtn: { padding: 4 },
  scroll: { padding: 20, gap: 16 },
  heartSection: { alignItems: "center", gap: 12, paddingVertical: 20 },
  heartCircle: {
    width: 88,
    height: 88,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  coupleLabel: { fontSize: 22, fontFamily: "Inter_600SemiBold", color: Colors.text },
  daysText: { fontSize: 14, color: Colors.textSecondary, fontFamily: "Inter_400Regular" },
  countdownRow: { flexDirection: "row", gap: 12 },
  countdownCard: { flex: 1, borderRadius: 18, overflow: "hidden" },
  countdownGrad: {
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 12,
    gap: 2,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 18,
  },
  countdownDays: { fontSize: 40, fontFamily: "Inter_700Bold", color: Colors.accent },
  countdownUnit: { fontSize: 13, color: Colors.textSecondary, fontFamily: "Inter_400Regular" },
  countdownLabel: { fontSize: 12, color: Colors.textMuted, fontFamily: "Inter_400Regular", textAlign: "center" },
  dateCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dateCardLabel: { fontSize: 12, color: Colors.textMuted, fontFamily: "Inter_400Regular" },
  dateCardValue: { fontSize: 15, color: Colors.text, fontFamily: "Inter_500Medium" },
  sectionLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.text, marginTop: 8 },
  moodGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  moodBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: Colors.surface,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  moodBtnSelected: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accent + "18",
  },
  moodLabel: { fontSize: 14, color: Colors.textSecondary, fontFamily: "Inter_400Regular" },
  moodLabelSelected: { color: Colors.accent, fontFamily: "Inter_500Medium" },
  partnerMoodCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  partnerMoodAvatar: {},
  partnerAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  partnerAvatarText: { color: "#fff", fontSize: 18, fontFamily: "Inter_600SemiBold" },
  partnerMoodInfo: { gap: 4 },
  partnerMoodName: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.text },
  partnerMoodRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  partnerMoodLabel: { fontSize: 14, color: Colors.textSecondary, fontFamily: "Inter_400Regular" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "flex-end" },
  sheet: { backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 12 },
  handle: { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: "center", marginBottom: 4 },
  sheetTitle: { fontSize: 20, fontFamily: "Inter_600SemiBold", color: Colors.text, textAlign: "center", marginBottom: 8 },
  fieldLabel: { fontSize: 13, color: Colors.textMuted, fontFamily: "Inter_400Regular", marginBottom: -6 },
  input: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Colors.text,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sheetActions: { flexDirection: "row", gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, backgroundColor: Colors.card, borderRadius: 14, paddingVertical: 14, alignItems: "center", borderWidth: 1, borderColor: Colors.border },
  cancelText: { color: Colors.textSecondary, fontFamily: "Inter_500Medium", fontSize: 15 },
  saveBtn: { flex: 1, borderRadius: 14, overflow: "hidden" },
  saveBtnGrad: { paddingVertical: 14, alignItems: "center", justifyContent: "center" },
  saveText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 15 },
});
