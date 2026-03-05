import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  Image,
  Modal,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors } from "@/constants/colors";
import { STORAGE_KEYS, Memory } from "@/constants/storage";

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function MemoryCard({ memory, onDelete }: { memory: Memory; onDelete: (id: string) => void }) {
  return (
    <Animated.View entering={FadeInDown.duration(400)} style={styles.card}>
      {memory.imageUri ? (
        <Image source={{ uri: memory.imageUri }} style={styles.cardImage} resizeMode="cover" />
      ) : (
        <LinearGradient
          colors={[Colors.accent + "33", Colors.accentSoft + "11"]}
          style={styles.cardImagePlaceholder}
        >
          <Ionicons name="heart" size={32} color={Colors.accent + "88"} />
        </LinearGradient>
      )}
      <View style={styles.cardBody}>
        <Text style={styles.cardDate}>{formatDate(memory.date)}</Text>
        <Text style={styles.cardTitle}>{memory.title}</Text>
        {memory.note ? <Text style={styles.cardNote}>{memory.note}</Text> : null}
      </View>
      <Pressable
        onPress={() => {
          Alert.alert("Delete Memory", "Remove this memory?", [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", style: "destructive", onPress: () => onDelete(memory.id) },
          ]);
        }}
        style={styles.deleteBtn}
      >
        <Ionicons name="trash-outline" size={16} color={Colors.textMuted} />
      </Pressable>
    </Animated.View>
  );
}

export default function MemoriesScreen() {
  const insets = useSafeAreaInsets();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [imageUri, setImageUri] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.MEMORIES);
      if (raw) setMemories(JSON.parse(raw));
    })();
  }, []);

  const persist = useCallback(async (mems: Memory[]) => {
    await AsyncStorage.setItem(STORAGE_KEYS.MEMORIES, JSON.stringify(mems));
  }, []);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert("", "Please add a title");
      return;
    }
    setSaving(true);
    const mem: Memory = {
      id: generateId(),
      title: title.trim(),
      note: note.trim() || undefined,
      imageUri,
      date: date || new Date().toISOString().split("T")[0],
      createdAt: new Date().toISOString(),
    };
    const next = [mem, ...memories];
    setMemories(next);
    await persist(next);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSaving(false);
    setShowModal(false);
    setTitle("");
    setNote("");
    setDate(new Date().toISOString().split("T")[0]);
    setImageUri(undefined);
  };

  const handleDelete = useCallback(
    async (id: string) => {
      const next = memories.filter((m) => m.id !== id);
      setMemories(next);
      await persist(next);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    },
    [memories, persist]
  );

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Memories</Text>
        <Pressable
          onPress={() => setShowModal(true)}
          style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.8 }]}
        >
          <LinearGradient
            colors={[Colors.accent, "#C24060"]}
            style={styles.addBtnGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="add" size={22} color="#fff" />
          </LinearGradient>
        </Pressable>
      </View>

      <FlatList
        data={memories}
        keyExtractor={(m) => m.id}
        renderItem={({ item }) => <MemoryCard memory={item} onDelete={handleDelete} />}
        contentContainerStyle={[styles.list, { paddingBottom: botPad + 80 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Animated.View entering={FadeIn.duration(600)} style={styles.empty}>
            <LinearGradient
              colors={[Colors.accent + "22", Colors.accent + "05"]}
              style={styles.emptyIcon}
            >
              <Ionicons name="images-outline" size={32} color={Colors.accent} />
            </LinearGradient>
            <Text style={styles.emptyTitle}>No memories yet</Text>
            <Text style={styles.emptyText}>Capture the moments that matter most.</Text>
          </Animated.View>
        }
      />

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { paddingBottom: botPad + 20 }]}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Add a Memory</Text>

            <Pressable onPress={handlePickImage} style={styles.photoBtn}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.photoPreview} resizeMode="cover" />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Ionicons name="camera-outline" size={28} color={Colors.textSecondary} />
                  <Text style={styles.photoText}>Add photo</Text>
                </View>
              )}
            </Pressable>

            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Memory title..."
              placeholderTextColor={Colors.textMuted}
              maxLength={80}
            />
            <TextInput
              style={[styles.input, styles.noteInput]}
              value={note}
              onChangeText={setNote}
              placeholder="A note about this moment..."
              placeholderTextColor={Colors.textMuted}
              multiline
              maxLength={500}
            />
            <TextInput
              style={styles.input}
              value={date}
              onChangeText={setDate}
              placeholder="Date (YYYY-MM-DD)"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numbers-and-punctuation"
            />

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setShowModal(false)}
                style={[styles.actionBtn, styles.cancelBtn]}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSave}
                disabled={saving}
                style={({ pressed }) => [styles.actionBtn, styles.saveBtn, pressed && { opacity: 0.85 }]}
              >
                <LinearGradient
                  colors={[Colors.accent, "#C24060"]}
                  style={styles.saveBtnGrad}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.saveText}>Save</Text>
                  )}
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
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
  },
  addBtn: {
    borderRadius: 20,
    overflow: "hidden",
  },
  addBtnGrad: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  cardImage: {
    width: "100%",
    height: 180,
  },
  cardImagePlaceholder: {
    width: "100%",
    height: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: {
    padding: 14,
    gap: 4,
  },
  cardDate: {
    fontSize: 12,
    color: Colors.accent,
    fontFamily: "Inter_500Medium",
  },
  cardTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  cardNote: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
    marginTop: 2,
  },
  deleteBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.bg + "CC",
    alignItems: "center",
    justifyContent: "center",
  },
  empty: {
    alignItems: "center",
    paddingVertical: 80,
    gap: 16,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingHorizontal: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 14,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
    textAlign: "center",
  },
  photoBtn: {
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  photoPreview: {
    width: "100%",
    height: 160,
  },
  photoPlaceholder: {
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.card,
    gap: 8,
  },
  photoText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
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
  noteInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 14,
    overflow: "hidden",
  },
  cancelBtn: {
    backgroundColor: Colors.card,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelText: {
    color: Colors.textSecondary,
    fontFamily: "Inter_500Medium",
    fontSize: 15,
  },
  saveBtn: {
    overflow: "hidden",
  },
  saveBtnGrad: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  saveText: {
    color: "#fff",
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
});
