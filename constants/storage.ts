export const STORAGE_KEYS = {
  DEVICE_ID: "heartline_device_id",
  PAIR_CODE: "heartline_pair_code",
  USER_PROFILE: "heartline_user_profile",
  PARTNER_PROFILE: "heartline_partner_profile",
  MESSAGES: "heartline_messages",
  MEMORIES: "heartline_memories",
  RELATIONSHIP: "heartline_relationship",
};

export type Mood = "happy" | "loved" | "sad" | "tired" | "excited" | "anxious";

export interface UserProfile {
  name: string;
  mood: Mood | null;
  moodUpdatedAt: string | null;
}

export interface Message {
  id: string;
  text?: string;
  imageUri?: string;
  senderId: string;
  timestamp: string;
  status: "sending" | "sent" | "delivered" | "read";
}

export interface Memory {
  id: string;
  title: string;
  note?: string;
  imageUri?: string;
  date: string;
  createdAt: string;
}

export interface RelationshipData {
  anniversaryDate: string | null;
  firstMeetDate: string | null;
  nextMeetDate: string | null;
  partnerName: string;
}
