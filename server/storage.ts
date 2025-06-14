import { 
  tracks, queueItems, chatMessages, comments, radioState, users, systemLogs, securityEvents, stationSettings,
  type Track, type QueueItem, type ChatMessage, type Comment, type RadioState, type User, type SystemLog, type SecurityEvent, type StationSettings,
  type InsertTrack, type InsertQueueItem, type InsertChatMessage, type InsertComment, type InsertRadioState, type InsertUser, type InsertSystemLog, type InsertSecurityEvent, type InsertStationSettings,
  type QueueWithTrack
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, like, or } from "drizzle-orm";

export interface IStorage {
  // Tracks
  getTracks(): Promise<Track[]>;
  getTrack(id: number): Promise<Track | undefined>;
  createTrack(track: InsertTrack): Promise<Track>;
  searchTracks(query: string): Promise<Track[]>;

  // Queue
  getQueue(): Promise<QueueWithTrack[]>;
  addToQueue(item: InsertQueueItem): Promise<QueueItem>;
  removeFromQueue(id: number): Promise<void>;
  updateQueuePosition(id: number, position: number): Promise<void>;
  clearQueue(): Promise<void>;

  // Chat
  getChatMessages(limit?: number): Promise<ChatMessage[]>;
  addChatMessage(message: InsertChatMessage): Promise<ChatMessage>;

  // Comments
  getComments(limit?: number): Promise<Comment[]>;
  addComment(comment: InsertComment): Promise<Comment>;
  likeComment(id: number): Promise<void>;

  // Radio State
  getRadioState(): Promise<RadioState>;
  updateRadioState(state: Partial<InsertRadioState>): Promise<RadioState>;

  // Users
  getUsers(): Promise<User[]>;
  getUser(id: number): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User>;
  deleteUser(id: number): Promise<void>;

  // System Logs
  getSystemLogs(limit?: number): Promise<SystemLog[]>;
  addSystemLog(log: InsertSystemLog): Promise<SystemLog>;
  clearSystemLogs(): Promise<void>;

  // Security Events
  getSecurityEvents(limit?: number): Promise<SecurityEvent[]>;
  addSecurityEvent(event: InsertSecurityEvent): Promise<SecurityEvent>;

  // Station Settings
  getStationSettings(): Promise<StationSettings>;
  updateStationSettings(settings: Partial<InsertStationSettings>): Promise<StationSettings>;
}

export class DatabaseStorage implements IStorage {
  async getTracks(): Promise<Track[]> {
    return await db.select().from(tracks);
  }

  async getTrack(id: number): Promise<Track | undefined> {
    const [track] = await db.select().from(tracks).where(eq(tracks.id, id));
    return track || undefined;
  }

  async createTrack(insertTrack: InsertTrack): Promise<Track> {
    const [track] = await db
      .insert(tracks)
      .values(insertTrack)
      .returning();
    return track;
  }

  async searchTracks(query: string): Promise<Track[]> {
    const lowerQuery = `%${query.toLowerCase()}%`;
    return await db
      .select()
      .from(tracks)
      .where(
        or(
          like(tracks.title, lowerQuery),
          like(tracks.artist, lowerQuery),
          like(tracks.album, lowerQuery)
        )
      );
  }

  async getQueue(): Promise<QueueWithTrack[]> {
    const result = await db
      .select({
        id: queueItems.id,
        trackId: queueItems.trackId,
        position: queueItems.position,
        requestedBy: queueItems.requestedBy,
        requestedAt: queueItems.requestedAt,
        isPlaying: queueItems.isPlaying,
        track: tracks
      })
      .from(queueItems)
      .leftJoin(tracks, eq(queueItems.trackId, tracks.id))
      .orderBy(queueItems.position);

    return result.map(row => ({
      id: row.id,
      trackId: row.trackId,
      position: row.position,
      requestedBy: row.requestedBy,
      requestedAt: row.requestedAt,
      isPlaying: row.isPlaying,
      track: row.track!
    }));
  }

  async addToQueue(insertItem: InsertQueueItem): Promise<QueueItem> {
    const [item] = await db
      .insert(queueItems)
      .values(insertItem)
      .returning();
    return item;
  }

  async removeFromQueue(id: number): Promise<void> {
    await db.delete(queueItems).where(eq(queueItems.id, id));
  }

  async updateQueuePosition(id: number, position: number): Promise<void> {
    await db
      .update(queueItems)
      .set({ position })
      .where(eq(queueItems.id, id));
  }

  async clearQueue(): Promise<void> {
    await db.delete(queueItems);
  }

  async getChatMessages(limit = 50): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .orderBy(desc(chatMessages.timestamp))
      .limit(limit);
  }

  async addChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const [message] = await db
      .insert(chatMessages)
      .values(insertMessage)
      .returning();
    return message;
  }

  async getComments(limit = 50): Promise<Comment[]> {
    return await db
      .select()
      .from(comments)
      .orderBy(desc(comments.timestamp))
      .limit(limit);
  }

  async addComment(insertComment: InsertComment): Promise<Comment> {
    const [comment] = await db
      .insert(comments)
      .values(insertComment)
      .returning();
    return comment;
  }

  async likeComment(id: number): Promise<void> {
    const [comment] = await db.select().from(comments).where(eq(comments.id, id));
    if (comment) {
      await db
        .update(comments)
        .set({ likes: (comment.likes || 0) + 1 })
        .where(eq(comments.id, id));
    }
  }

  async getRadioState(): Promise<RadioState> {
    const [state] = await db.select().from(radioState).limit(1);
    
    if (!state) {
      // Create initial radio state if none exists
      const [newState] = await db
        .insert(radioState)
        .values({
          isPlaying: true,
          currentTrackId: null,
          volume: 75,
          listenerCount: 1247,
          ircConnected: true,
          ircChannel: "#neonwave-radio",
          ircUserCount: 23,
        })
        .returning();
      return newState;
    }
    
    return state;
  }

  async updateRadioState(state: Partial<InsertRadioState>): Promise<RadioState> {
    const currentState = await this.getRadioState();
    const [updatedState] = await db
      .update(radioState)
      .set(state)
      .where(eq(radioState.id, currentState.id))
      .returning();
    return updatedState;
  }

  // Users
  async getUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User> {
    const [updated] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // System Logs
  async getSystemLogs(limit = 100): Promise<SystemLog[]> {
    return await db
      .select()
      .from(systemLogs)
      .orderBy(desc(systemLogs.timestamp))
      .limit(limit);
  }

  async addSystemLog(insertLog: InsertSystemLog): Promise<SystemLog> {
    const [log] = await db
      .insert(systemLogs)
      .values(insertLog)
      .returning();
    return log;
  }

  async clearSystemLogs(): Promise<void> {
    await db.delete(systemLogs);
  }

  // Security Events
  async getSecurityEvents(limit = 100): Promise<SecurityEvent[]> {
    return await db
      .select()
      .from(securityEvents)
      .orderBy(desc(securityEvents.timestamp))
      .limit(limit);
  }

  async addSecurityEvent(insertEvent: InsertSecurityEvent): Promise<SecurityEvent> {
    const [event] = await db
      .insert(securityEvents)
      .values(insertEvent)
      .returning();
    return event;
  }

  // Station Settings
  async getStationSettings(): Promise<StationSettings> {
    const [settings] = await db.select().from(stationSettings).where(eq(stationSettings.id, 1));
    if (!settings) {
      // Create default settings if none exist
      const [newSettings] = await db
        .insert(stationSettings)
        .values({})
        .returning();
      return newSettings;
    }
    return settings;
  }

  async updateStationSettings(updates: Partial<InsertStationSettings>): Promise<StationSettings> {
    const [updated] = await db
      .update(stationSettings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(stationSettings.id, 1))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
