const ACCENT = "#E85D75";
const ACCENT_SOFT = "#F2A0B0";

export const Colors = {
  bg: "#0C0811",
  surface: "#1A1220",
  card: "#231929",
  cardHover: "#2C2136",
  accent: ACCENT,
  accentSoft: ACCENT_SOFT,
  accentDim: "#9B3E55",
  text: "#F8F0FA",
  textSecondary: "#9B8FA5",
  textMuted: "#6B5F75",
  border: "#2E2238",
  borderLight: "#3A2D48",
  sentBubble: "#A83A52",
  receivedBubble: "#1E1626",
  online: "#4CAF6E",
  read: "#6EC6F4",
  white: "#FFFFFF",
};

export default {
  light: {
    text: Colors.text,
    background: Colors.bg,
    tint: Colors.accent,
    tabIconDefault: Colors.textMuted,
    tabIconSelected: Colors.accent,
  },
};
