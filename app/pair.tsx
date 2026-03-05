import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";
import { Colors } from "@/constants/colors";
import { useApp, generatePairCode } from "@/context/AppContext";

type Step = "name" | "mode" | "create" | "join";

export default function PairScreen() {
  const insets = useSafeAreaInsets();
  const { setPairCode, updateUserProfile } = useApp();
  const [step, setStep] = useState<Step>("name");
  const [name, setName] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);

  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(withTiming(1.06, { duration: 1600 }), -1, true);
  }, []);
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const handleNameNext = () => {
    if (!name.trim()) {
      Alert.alert("", "Please enter your name");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep("mode");
  };

  const handleCreate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const code = generatePairCode();
    setGeneratedCode(code);
    setStep("create");
  };

  const handleJoin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep("join");
  };

  const confirmCreate = async () => {
    setLoading(true);
    await updateUserProfile({ name: name.trim() });
    await setPairCode(generatedCode);
    setLoading(false);
  };

  const confirmJoin = async () => {
    const code = joinCode.trim().toUpperCase();
    if (code.length !== 6) {
      Alert.alert("", "Please enter a valid 6-character code");
      return;
    }
    setLoading(true);
    await updateUserProfile({ name: name.trim() });
    await setPairCode(code);
    setLoading(false);
  };

  return (
    <LinearGradient
      colors={["#120B18", "#0C0811", "#1A0D1A"]}
      style={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}
    >
      <Animated.View entering={FadeInDown.duration(600)} style={styles.logoArea}>
        <Animated.View style={[styles.heartOuter, pulseStyle]}>
          <LinearGradient
            colors={[Colors.accent, "#C24060"]}
            style={styles.heartGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="heart" size={44} color="#fff" />
          </LinearGradient>
        </Animated.View>
        <Text style={styles.appName}>Heartline</Text>
        <Text style={styles.tagline}>Your private space, together.</Text>
      </Animated.View>

      {step === "name" && (
        <Animated.View entering={FadeInUp.delay(200).duration(500)} style={styles.card}>
          <Text style={styles.cardTitle}>What's your name?</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Your name..."
            placeholderTextColor={Colors.textMuted}
            autoFocus
            maxLength={30}
            returnKeyType="next"
            onSubmitEditing={handleNameNext}
          />
          <Pressable
            onPress={handleNameNext}
            style={({ pressed }) => [styles.btn, pressed && { opacity: 0.85 }]}
          >
            <LinearGradient
              colors={[Colors.accent, "#C24060"]}
              style={styles.btnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.btnText}>Continue</Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      )}

      {step === "mode" && (
        <Animated.View entering={FadeInUp.delay(100).duration(400)} style={styles.card}>
          <Text style={styles.cardTitle}>Connect with your partner</Text>
          <Text style={styles.cardSubtitle}>
            One of you creates a code, the other joins with it.
          </Text>
          <Pressable
            onPress={handleCreate}
            style={({ pressed }) => [styles.modeBtn, pressed && { opacity: 0.85 }]}
          >
            <LinearGradient
              colors={[Colors.accent, "#C24060"]}
              style={styles.modeBtnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="add-circle-outline" size={24} color="#fff" />
              <Text style={styles.btnText}>Create a pair code</Text>
            </LinearGradient>
          </Pressable>
          <Pressable
            onPress={handleJoin}
            style={({ pressed }) => [styles.modeBtn, styles.modeBtnSecondary, pressed && { opacity: 0.85 }]}
          >
            <Ionicons name="enter-outline" size={24} color={Colors.accent} />
            <Text style={[styles.btnText, { color: Colors.accent }]}>Enter partner's code</Text>
          </Pressable>
        </Animated.View>
      )}

      {step === "create" && (
        <Animated.View entering={FadeInUp.delay(100).duration(400)} style={styles.card}>
          <Text style={styles.cardTitle}>Your pair code</Text>
          <Text style={styles.cardSubtitle}>Share this code with your partner</Text>
          <View style={styles.codeBox}>
            {generatedCode.split("").map((ch, i) => (
              <View key={i} style={styles.codeLetter}>
                <Text style={styles.codeLetterText}>{ch}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.hint}>Once they join, you'll both be connected</Text>
          <Pressable
            onPress={confirmCreate}
            disabled={loading}
            style={({ pressed }) => [styles.btn, pressed && { opacity: 0.85 }]}
          >
            <LinearGradient
              colors={[Colors.accent, "#C24060"]}
              style={styles.btnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>I'm ready — connect</Text>
              )}
            </LinearGradient>
          </Pressable>
          <Pressable onPress={() => setStep("mode")} style={styles.back}>
            <Text style={styles.backText}>Back</Text>
          </Pressable>
        </Animated.View>
      )}

      {step === "join" && (
        <Animated.View entering={FadeInUp.delay(100).duration(400)} style={styles.card}>
          <Text style={styles.cardTitle}>Enter pair code</Text>
          <Text style={styles.cardSubtitle}>Ask your partner for their 6-character code</Text>
          <TextInput
            style={[styles.input, styles.codeInput]}
            value={joinCode}
            onChangeText={(v) => setJoinCode(v.toUpperCase().slice(0, 6))}
            placeholder="XXXXXX"
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="characters"
            autoFocus
            maxLength={6}
            keyboardType="default"
          />
          <Pressable
            onPress={confirmJoin}
            disabled={loading}
            style={({ pressed }) => [styles.btn, pressed && { opacity: 0.85 }]}
          >
            <LinearGradient
              colors={[Colors.accent, "#C24060"]}
              style={styles.btnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>Join</Text>
              )}
            </LinearGradient>
          </Pressable>
          <Pressable onPress={() => setStep("mode")} style={styles.back}>
            <Text style={styles.backText}>Back</Text>
          </Pressable>
        </Animated.View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 40,
  },
  logoArea: {
    alignItems: "center",
    gap: 12,
  },
  heartOuter: {
    marginBottom: 4,
  },
  heartGradient: {
    width: 88,
    height: 88,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  appName: {
    fontSize: 36,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
  },
  card: {
    width: "100%",
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 24,
    gap: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTitle: {
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
    textAlign: "center",
  },
  cardSubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    textAlign: "center",
  },
  input: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: Colors.text,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  codeInput: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    letterSpacing: 8,
  },
  btn: {
    borderRadius: 16,
    overflow: "hidden",
  },
  btnGradient: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  btnText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  modeBtn: {
    borderRadius: 16,
    overflow: "hidden",
  },
  modeBtnGradient: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },
  modeBtnSecondary: {
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: Colors.accent,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  codeBox: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    marginVertical: 8,
  },
  codeLetter: {
    width: 44,
    height: 52,
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  codeLetterText: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: Colors.accent,
  },
  hint: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: "center",
    fontFamily: "Inter_400Regular",
  },
  back: {
    alignItems: "center",
    paddingVertical: 4,
  },
  backText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
});
