import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS, UserProfile, Mood } from "@/constants/storage";

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function generatePairCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function getWsUrl(): string {
  const host = process.env.EXPO_PUBLIC_DOMAIN;
  if (!host) return "ws://localhost:5000/ws";
  return `wss://${host}/ws`;
}

export type AppState = "loading" | "unpaired" | "paired";

interface AppContextValue {
  appState: AppState;
  deviceId: string | null;
  pairCode: string | null;
  userProfile: UserProfile;
  partnerProfile: UserProfile | null;
  partnerOnline: boolean;
  isWsConnected: boolean;
  setPairCode: (code: string) => Promise<void>;
  updateUserProfile: (profile: Partial<UserProfile>) => Promise<void>;
  updateMood: (mood: Mood) => Promise<void>;
  sendWsMessage: (msg: object) => void;
  onWsMessage: (handler: (msg: object) => void) => () => void;
  unpair: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [appState, setAppState] = useState<AppState>("loading");
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [pairCode, setPairCodeState] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: "",
    mood: null,
    moodUpdatedAt: null,
  });
  const [partnerProfile, setPartnerProfile] = useState<UserProfile | null>(null);
  const [partnerOnline, setPartnerOnline] = useState(false);
  const [isWsConnected, setIsWsConnected] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const messageHandlers = useRef<Set<(msg: object) => void>>(new Set());
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onWsMessage = useCallback((handler: (msg: object) => void) => {
    messageHandlers.current.add(handler);
    return () => {
      messageHandlers.current.delete(handler);
    };
  }, []);

  const sendWsMessage = useCallback((msg: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  const connectWs = useCallback((code: string, devId: string) => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    const url = getWsUrl();
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsWsConnected(true);
      ws.send(JSON.stringify({ type: "join", pairCode: code, deviceId: devId }));
    };

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === "joined") {
          setPartnerOnline(msg.partnerOnline);
          return;
        }
        if (msg.type === "partner_online") {
          setPartnerOnline(msg.online);
          return;
        }
        if (msg.type === "profile_sync") {
          const prof = msg.profile as UserProfile;
          setPartnerProfile(prof);
          AsyncStorage.setItem(STORAGE_KEYS.PARTNER_PROFILE, JSON.stringify(prof));
          return;
        }
        messageHandlers.current.forEach((h) => h(msg));
      } catch {}
    };

    ws.onclose = () => {
      setIsWsConnected(false);
      setPartnerOnline(false);
      reconnectTimer.current = setTimeout(() => {
        connectWs(code, devId);
      }, 3000);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    (async () => {
      let devId = await AsyncStorage.getItem(STORAGE_KEYS.DEVICE_ID);
      if (!devId) {
        devId = generateId();
        await AsyncStorage.setItem(STORAGE_KEYS.DEVICE_ID, devId);
      }
      setDeviceId(devId);

      const code = await AsyncStorage.getItem(STORAGE_KEYS.PAIR_CODE);
      const profileStr = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      const partnerStr = await AsyncStorage.getItem(STORAGE_KEYS.PARTNER_PROFILE);

      if (profileStr) {
        setUserProfile(JSON.parse(profileStr));
      }
      if (partnerStr) {
        setPartnerProfile(JSON.parse(partnerStr));
      }

      if (code) {
        setPairCodeState(code);
        setAppState("paired");
        connectWs(code, devId);
      } else {
        setAppState("unpaired");
      }
    })();

    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connectWs]);

  const setPairCode = useCallback(
    async (code: string) => {
      await AsyncStorage.setItem(STORAGE_KEYS.PAIR_CODE, code);
      setPairCodeState(code);
      setAppState("paired");
      if (deviceId) connectWs(code, deviceId);
    },
    [deviceId, connectWs]
  );

  const updateUserProfile = useCallback(
    async (update: Partial<UserProfile>) => {
      setUserProfile((prev) => {
        const next = { ...prev, ...update };
        AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(next));
        if (pairCode && deviceId) {
          sendWsMessage({ type: "profile_sync", profile: next });
        }
        return next;
      });
    },
    [pairCode, deviceId, sendWsMessage]
  );

  const updateMood = useCallback(
    async (mood: Mood) => {
      await updateUserProfile({ mood, moodUpdatedAt: new Date().toISOString() });
    },
    [updateUserProfile]
  );

  const unpair = useCallback(async () => {
    wsRef.current?.close();
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.PAIR_CODE,
      STORAGE_KEYS.PARTNER_PROFILE,
      STORAGE_KEYS.MESSAGES,
    ]);
    setPairCodeState(null);
    setPartnerProfile(null);
    setPartnerOnline(false);
    setAppState("unpaired");
  }, []);

  const value = useMemo(
    () => ({
      appState,
      deviceId,
      pairCode,
      userProfile,
      partnerProfile,
      partnerOnline,
      isWsConnected,
      setPairCode,
      updateUserProfile,
      updateMood,
      sendWsMessage,
      onWsMessage,
      unpair,
    }),
    [
      appState,
      deviceId,
      pairCode,
      userProfile,
      partnerProfile,
      partnerOnline,
      isWsConnected,
      setPairCode,
      updateUserProfile,
      updateMood,
      sendWsMessage,
      onWsMessage,
      unpair,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

export { generatePairCode };
