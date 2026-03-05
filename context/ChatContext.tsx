import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS, Message } from "@/constants/storage";
import { useApp } from "@/context/AppContext";

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

interface ChatContextValue {
  messages: Message[];
  sendMessage: (text?: string, imageUri?: string) => void;
  markRead: () => void;
  unreadCount: number;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { deviceId, sendWsMessage, onWsMessage, pairCode } = useApp();
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (!pairCode) return;
    (async () => {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.MESSAGES);
      if (raw) {
        setMessages(JSON.parse(raw));
      }
    })();
  }, [pairCode]);

  const persistMessages = useCallback(async (msgs: Message[]) => {
    await AsyncStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(msgs));
  }, []);

  useEffect(() => {
    const unsubscribe = onWsMessage((msg: object) => {
      const m = msg as { type: string; message?: Message };
      if (m.type === "chat_message" && m.message) {
        const incoming = { ...m.message, status: "delivered" as const };
        setMessages((prev) => {
          const next = [...prev, incoming];
          persistMessages(next);
          return next;
        });
        sendWsMessage({ type: "message_delivered", messageId: m.message.id });
      }
      if (m.type === "message_delivered") {
        const md = msg as { type: string; messageId: string };
        setMessages((prev) => {
          const next = prev.map((msg2) =>
            msg2.id === md.messageId ? { ...msg2, status: "delivered" as const } : msg2
          );
          persistMessages(next);
          return next;
        });
      }
      if (m.type === "message_read") {
        setMessages((prev) => {
          const next = prev.map((msg2) =>
            msg2.status !== "read" && msg2.senderId === deviceId
              ? { ...msg2, status: "read" as const }
              : msg2
          );
          persistMessages(next);
          return next;
        });
      }
    });
    return unsubscribe;
  }, [onWsMessage, sendWsMessage, deviceId, persistMessages]);

  const sendMessage = useCallback(
    (text?: string, imageUri?: string) => {
      if (!deviceId) return;
      const msg: Message = {
        id: generateId(),
        text,
        imageUri,
        senderId: deviceId,
        timestamp: new Date().toISOString(),
        status: "sending",
      };
      setMessages((prev) => {
        const next = [...prev, msg];
        persistMessages(next);
        return next;
      });
      sendWsMessage({ type: "chat_message", message: { ...msg, status: "sent" } });
      setTimeout(() => {
        setMessages((prev) => {
          const next = prev.map((m) => (m.id === msg.id ? { ...m, status: "sent" as const } : m));
          persistMessages(next);
          return next;
        });
      }, 300);
    },
    [deviceId, sendWsMessage, persistMessages]
  );

  const markRead = useCallback(() => {
    setMessages((prev) => {
      const hasUnread = prev.some((m) => m.senderId !== deviceId && m.status !== "read");
      if (!hasUnread) return prev;
      const next = prev.map((m) =>
        m.senderId !== deviceId ? { ...m, status: "read" as const } : m
      );
      persistMessages(next);
      sendWsMessage({ type: "message_read" });
      return next;
    });
  }, [deviceId, sendWsMessage, persistMessages]);

  const unreadCount = useMemo(
    () => messages.filter((m) => m.senderId !== deviceId && m.status !== "read").length,
    [messages, deviceId]
  );

  const value = useMemo(
    () => ({ messages, sendMessage, markRead, unreadCount }),
    [messages, sendMessage, markRead, unreadCount]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
}
