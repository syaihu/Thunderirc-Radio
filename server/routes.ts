import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertQueueItemSchema, insertChatMessageSchema, insertCommentSchema, type WSMessage, type TrackRequest } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket server for real-time communication
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws',
    clientTracking: true 
  });

  const clients = new Set<WebSocket>();

  wss.on('connection', (ws) => {
    clients.add(ws);
    console.log('WebSocket client connected');

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString()) as WSMessage;
        console.log('Received message:', message);

        switch (message.type) {
          case 'chat_message':
            const chatMessage = await storage.addChatMessage({
              username: message.data.username,
              message: message.data.message,
              isBot: false
            });
            broadcast({
              type: 'chat_message',
              data: chatMessage
            });
            break;

          case 'radio_state':
            const updatedState = await storage.updateRadioState(message.data);
            broadcast({
              type: 'radio_state',
              data: updatedState
            });
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      clients.delete(ws);
      console.log('WebSocket client disconnected');
    });

    // Send initial data
    sendInitialData(ws);
  });

  function broadcast(message: WSMessage) {
    const data = JSON.stringify(message);
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }

  async function sendInitialData(ws: WebSocket) {
    try {
      const [radioState, queue, chatMessages, comments] = await Promise.all([
        storage.getRadioState(),
        storage.getQueue(),
        storage.getChatMessages(),
        storage.getComments()
      ]);

      ws.send(JSON.stringify({ type: 'radio_state', data: radioState }));
      ws.send(JSON.stringify({ type: 'queue_update', data: queue }));
      ws.send(JSON.stringify({ type: 'chat_message', data: chatMessages }));
      ws.send(JSON.stringify({ type: 'comments', data: comments }));
    } catch (error) {
      console.error('Error sending initial data:', error);
    }
  }

  // REST API Routes
  app.get("/api/tracks", async (req, res) => {
    try {
      const tracks = await storage.getTracks();
      res.json(tracks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tracks" });
    }
  });

  app.get("/api/tracks/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ error: "Search query is required" });
      }
      const tracks = await storage.searchTracks(query);
      res.json(tracks);
    } catch (error) {
      res.status(500).json({ error: "Failed to search tracks" });
    }
  });

  app.get("/api/queue", async (req, res) => {
    try {
      const queue = await storage.getQueue();
      res.json(queue);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch queue" });
    }
  });

  app.post("/api/queue", async (req, res) => {
    try {
      const validatedData = insertQueueItemSchema.parse(req.body);
      const queueItem = await storage.addToQueue(validatedData);
      const queue = await storage.getQueue();
      
      // Broadcast queue update
      broadcast({
        type: 'queue_update',
        data: queue
      });

      res.json(queueItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to add to queue" });
      }
    }
  });

  app.delete("/api/queue/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.removeFromQueue(id);
      const queue = await storage.getQueue();
      
      broadcast({
        type: 'queue_update',
        data: queue
      });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to remove from queue" });
    }
  });

  app.delete("/api/queue", async (req, res) => {
    try {
      await storage.clearQueue();
      const queue = await storage.getQueue();
      
      broadcast({
        type: 'queue_update',
        data: queue
      });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to clear queue" });
    }
  });

  app.get("/api/chat", async (req, res) => {
    try {
      const messages = await storage.getChatMessages();
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch chat messages" });
    }
  });

  app.post("/api/comments", async (req, res) => {
    try {
      const validatedData = insertCommentSchema.parse(req.body);
      const comment = await storage.addComment(validatedData);
      
      broadcast({
        type: 'comments',
        data: await storage.getComments()
      });

      res.json(comment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to add comment" });
      }
    }
  });

  app.get("/api/comments", async (req, res) => {
    try {
      const comments = await storage.getComments();
      res.json(comments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch comments" });
    }
  });

  app.post("/api/comments/:id/like", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.likeComment(id);
      
      broadcast({
        type: 'comments',
        data: await storage.getComments()
      });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to like comment" });
    }
  });

  app.get("/api/radio-state", async (req, res) => {
    try {
      const state = await storage.getRadioState();
      res.json(state);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch radio state" });
    }
  });

  // Handle IRC bot requests
  app.post("/api/irc/request", async (req, res) => {
    try {
      const { username, query } = req.body as TrackRequest;
      
      // Search for the requested track
      const tracks = await storage.searchTracks(query);
      
      if (tracks.length === 0) {
        // Send IRC message back through WebSocket
        broadcast({
          type: 'chat_message',
          data: {
            username: 'radioBot',
            message: `❌ Sorry ${username}, no tracks found for "${query}"`,
            isBot: true,
            timestamp: new Date()
          }
        });
        return res.json({ success: false, message: "No tracks found" });
      }

      // Add first matching track to queue
      const track = tracks[0];
      const queueLength = (await storage.getQueue()).length;
      
      await storage.addToQueue({
        trackId: track.id,
        position: queueLength + 1,
        requestedBy: username
      });

      // Add confirmation message to chat
      const chatMessage = await storage.addChatMessage({
        username: 'radioBot',
        message: `✅ Added "${track.title}" by ${track.artist} to the queue! (Requested by ${username})`,
        isBot: true
      });

      // Broadcast updates
      const queue = await storage.getQueue();
      broadcast({
        type: 'queue_update',
        data: queue
      });

      broadcast({
        type: 'chat_message',
        data: chatMessage
      });

      // Send toast notification
      broadcast({
        type: 'track_request',
        data: {
          username,
          track: track.title,
          artist: track.artist
        }
      });

      res.json({ success: true, track });
    } catch (error) {
      console.error('IRC request error:', error);
      res.status(500).json({ error: "Failed to process request" });
    }
  });

  return httpServer;
}
