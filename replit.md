# Heartline — Private Couple Messaging App

## Architecture

**Local-first, WebSocket-relayed** private messaging app for couples.

### Stack
- **Frontend**: Expo Router (React Native) with TypeScript
- **Backend**: Express + WebSocket (ws) server — relay only, no database
- **Storage**: AsyncStorage on each device (local-first)

### How It Works
1. Device A generates a 6-character pair code
2. Device B enters the same code
3. Both connect to the WebSocket server (same "room")
4. Messages are relayed peer-to-peer via the server — never stored on the server
5. Each device stores all messages in AsyncStorage locally

---

## Features
- **Private Chat** — Real-time end-to-end relay, messages stored locally
- **Message Status** — Sending → Sent → Delivered → Read receipts
- **Photo Messages** — Share images via gallery
- **Mood Sharing** — Share daily mood, visible to partner
- **Memories** — Store photos + notes with dates
- **Relationship Timeline** — Anniversary countdown, next meeting countdown, days together
- **Partner Presence** — Online/offline indicator in real time
- **Dark Romantic Theme** — Deep violet-black with rose accents

---

## File Structure

```
app/
  _layout.tsx          # Root layout with providers (AppProvider, ChatProvider)
  pair.tsx             # Pairing onboarding screen
  (tabs)/
    _layout.tsx        # Tab bar (NativeTabs for iOS 26+, classic Tabs fallback)
    index.tsx          # Chat screen (inverted FlatList)
    memories.tsx       # Memories gallery + add memory modal
    together.tsx       # Relationship timeline + mood sharing
    profile.tsx        # Profile, settings, pair code, disconnect

context/
  AppContext.tsx        # Device ID, pair code, WebSocket connection, user/partner profile
  ChatContext.tsx       # Messages (AsyncStorage), send/receive, read receipts

components/
  MessageBubble.tsx    # Chat bubble (sent/received styling + status icons)
  ChatInput.tsx        # Input bar with image picker + send button

constants/
  colors.ts            # Theme: dark violet-black bg, rose accent
  storage.ts           # AsyncStorage keys + type definitions

server/
  index.ts             # Express server setup
  routes.ts            # WebSocket relay server (pair rooms, no DB)
```

---

## Ports
- **Backend**: Port 5000 (Express + WebSocket at /ws)
- **Frontend**: Port 8081 (Expo Metro dev server)

## AsyncStorage Keys
- `heartline_device_id` — Unique device ID (auto-generated)
- `heartline_pair_code` — Shared pair code (the "room ID")
- `heartline_user_profile` — Own profile (name, mood)
- `heartline_partner_profile` — Partner's synced profile
- `heartline_messages` — All messages (local copy)
- `heartline_memories` — Saved memories
- `heartline_relationship` — Anniversary, first met, next meeting dates

## Color Theme
- Background: `#0C0811` (near-black warm violet)
- Surface: `#1A1220`
- Accent: `#E85D75` (rose)
- Accent Soft: `#F2A0B0` (blush)
- Text: `#F8F0FA`
