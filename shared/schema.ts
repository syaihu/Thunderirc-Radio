import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const tracks = pgTable("tracks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  artist: text("artist").notNull(),
  album: text("album"),
  duration: text("duration").notNull(),
  bitrate: text("bitrate").default("320 kbps"),
  genre: text("genre"),
  albumArt: text("album_art"),
  filePath: text("file_path"),
});

export const queueItems = pgTable("queue_items", {
  id: serial("id").primaryKey(),
  trackId: integer("track_id").notNull(),
  position: integer("position").notNull(),
  requestedBy: text("requested_by"),
  requestedAt: timestamp("requested_at").defaultNow(),
  isPlaying: boolean("is_playing").default(false),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  message: text("message").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  isBot: boolean("is_bot").default(false),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  author: text("author").notNull(),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  likes: integer("likes").default(0),
});

export const radioState = pgTable("radio_state", {
  id: serial("id").primaryKey(),
  isPlaying: boolean("is_playing").default(false),
  currentTrackId: integer("current_track_id"),
  volume: integer("volume").default(75),
  listenerCount: integer("listener_count").default(0),
  ircConnected: boolean("irc_connected").default(false),
  ircChannel: text("irc_channel").default("#neonwave-radio"),
  ircUserCount: integer("irc_user_count").default(0),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("listener"), // admin, moderator, dj, listener
  isActive: boolean("is_active").default(true),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const systemLogs = pgTable("system_logs", {
  id: serial("id").primaryKey(),
  level: text("level").notNull(), // error, warn, info, debug
  category: text("category").notNull(), // stream, irc, database, auth, system
  message: text("message").notNull(),
  details: text("details"), // JSON string for additional data
  userId: integer("user_id"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const securityEvents = pgTable("security_events", {
  id: serial("id").primaryKey(),
  eventType: text("event_type").notNull(), // login_attempt, failed_login, permission_denied, api_access
  severity: text("severity").notNull(), // low, medium, high, critical
  description: text("description").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: integer("user_id"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const stationSettings = pgTable("station_settings", {
  id: serial("id").primaryKey(),
  stationName: text("station_name").default("NeonWave Radio"),
  tagline: text("tagline").default("Synthwave & Cyberpunk Vibes"),
  icecastServer: text("icecast_server").default("localhost:8000"),
  maxBitrate: integer("max_bitrate").default(320),
  autoPlay: boolean("auto_play").default(true),
  allowRequests: boolean("allow_requests").default(true),
  maxRequestsPerUser: integer("max_requests_per_user").default(3),
  theme: text("theme").default("cyberpunk"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertTrackSchema = createInsertSchema(tracks);
export const insertQueueItemSchema = createInsertSchema(queueItems);
export const insertChatMessageSchema = createInsertSchema(chatMessages);
export const insertCommentSchema = createInsertSchema(comments);
export const insertRadioStateSchema = createInsertSchema(radioState);
export const insertUserSchema = createInsertSchema(users);
export const insertSystemLogSchema = createInsertSchema(systemLogs);
export const insertSecurityEventSchema = createInsertSchema(securityEvents);
export const insertStationSettingsSchema = createInsertSchema(stationSettings);

// Types
export type Track = typeof tracks.$inferSelect;
export type QueueItem = typeof queueItems.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type RadioState = typeof radioState.$inferSelect;
export type User = typeof users.$inferSelect;
export type SystemLog = typeof systemLogs.$inferSelect;
export type SecurityEvent = typeof securityEvents.$inferSelect;
export type StationSettings = typeof stationSettings.$inferSelect;

export type InsertTrack = z.infer<typeof insertTrackSchema>;
export type InsertQueueItem = z.infer<typeof insertQueueItemSchema>;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type InsertRadioState = z.infer<typeof insertRadioStateSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertSystemLog = z.infer<typeof insertSystemLogSchema>;
export type InsertSecurityEvent = z.infer<typeof insertSecurityEventSchema>;
export type InsertStationSettings = z.infer<typeof insertStationSettingsSchema>;

// WebSocket message types
export interface WSMessage {
  type: 'track_request' | 'chat_message' | 'queue_update' | 'radio_state' | 'irc_status' | 'comments';
  data: any;
}

export interface TrackRequest {
  username: string;
  query: string;
  timestamp: Date;
}

export interface QueueWithTrack extends QueueItem {
  track: Track;
}
