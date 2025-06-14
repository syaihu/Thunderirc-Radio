import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useWebSocket } from "@/hooks/use-websocket";
import { useToast } from "@/hooks/use-toast";
import { RadioState, QueueWithTrack, ChatMessage, Comment } from "@shared/schema";
import Sidebar from "@/components/sidebar";
import PlayerSection from "@/components/player-section";
import QueuePanel from "@/components/queue-panel";
import ChatPanel from "@/components/chat-panel";
import CommentsPanel from "@/components/comments-panel";
import NotificationsPanel from "@/components/notifications-panel";
import AdminPanel from "@/components/admin-panel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, UserCircle } from "lucide-react";

export default function RadioDashboard() {
  const [activeTab, setActiveTab] = useState<'queue' | 'chat' | 'comments'>('queue');
  const [radioState, setRadioState] = useState<RadioState | null>(null);
  const [queue, setQueue] = useState<QueueWithTrack[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(3);
  
  const { toast } = useToast();
  const ws = useWebSocket();

  const { data: initialRadioState } = useQuery({
    queryKey: ['/api/radio-state'],
  });

  const { data: initialQueue } = useQuery({
    queryKey: ['/api/queue'],
  });

  const { data: initialChat } = useQuery({
    queryKey: ['/api/chat'],
  });

  const { data: initialComments } = useQuery({
    queryKey: ['/api/comments'],
  });

  useEffect(() => {
    if (initialRadioState) setRadioState(initialRadioState);
    if (initialQueue) setQueue(initialQueue);
    if (initialChat) setChatMessages(initialChat);
    if (initialComments) setComments(initialComments);
  }, [initialRadioState, initialQueue, initialChat, initialComments]);

  useEffect(() => {
    // WebSocket event listeners
    ws.on('radio_state', (data: RadioState) => {
      setRadioState(data);
    });

    ws.on('queue_update', (data: QueueWithTrack[]) => {
      setQueue(data);
    });

    ws.on('chat_message', (data: ChatMessage | ChatMessage[]) => {
      if (Array.isArray(data)) {
        setChatMessages(data);
      } else {
        setChatMessages(prev => [...prev, data]);
      }
    });

    ws.on('comments', (data: Comment[]) => {
      setComments(data);
    });

    ws.on('track_request', (data: { username: string; track: string; artist: string }) => {
      toast({
        title: "New Song Request",
        description: `${data.username} requested "${data.track}" by ${data.artist}`,
        duration: 5000,
      });
      
      // Increment unread notifications
      setUnreadNotifications(prev => prev + 1);
    });

    return () => {
      ws.off('radio_state', () => {});
      ws.off('queue_update', () => {});
      ws.off('chat_message', () => {});
      ws.off('comments', () => {});
      ws.off('track_request', () => {});
    };
  }, [ws, toast]);

  if (!radioState) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading radio dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar radioState={radioState} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-secondary/50 glass-morphism border-b border-border p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-bold">Radio Control Panel</h2>
            <div className="flex items-center space-x-2">
              <span className="text-sm bg-pink-500/20 text-pink-400 px-2 py-1 rounded">
                OpenBSD 7.6
              </span>
              <span className="text-sm bg-primary/20 text-primary px-2 py-1 rounded">
                Icecast Server
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative"
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowAdminPanel(false);
              }}
            >
              <Bell className="h-4 w-4" />
              {unreadNotifications > 0 && (
                <Badge 
                  variant="secondary" 
                  className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs"
                >
                  {unreadNotifications}
                </Badge>
              )}
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => {
                setShowAdminPanel(!showAdminPanel);
                setShowNotifications(false);
              }}
            >
              <UserCircle className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Main Player Section */}
        <div className="flex-1 flex overflow-hidden">
          {/* Player & Waveform */}
          <div className="flex-1">
            <PlayerSection radioState={radioState} setRadioState={setRadioState} />
          </div>

          {/* Right Sidebar */}
          <div className="w-96 bg-secondary/50 glass-morphism border-l border-border flex flex-col">
            {/* Tabs */}
            <div className="border-b border-border">
              <div className="flex">
                <button
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === 'queue'
                      ? 'bg-primary/20 text-primary border-b-2 border-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setActiveTab('queue')}
                >
                  Queue ({queue.length})
                </button>
                <button
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === 'chat'
                      ? 'bg-primary/20 text-primary border-b-2 border-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setActiveTab('chat')}
                >
                  IRC Chat
                </button>
                <button
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === 'comments'
                      ? 'bg-primary/20 text-primary border-b-2 border-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setActiveTab('comments')}
                >
                  Comments
                </button>
              </div>
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-hidden">
              {activeTab === 'queue' && <QueuePanel queue={queue} />}
              {activeTab === 'chat' && <ChatPanel messages={chatMessages} />}
              {activeTab === 'comments' && <CommentsPanel comments={comments} />}
            </div>
          </div>
        </div>
      </div>

      {/* Notification Panel */}
      <NotificationsPanel 
        isOpen={showNotifications} 
        onClose={() => {
          setShowNotifications(false);
          setUnreadNotifications(0);
        }} 
      />

      {/* Admin Panel */}
      <AdminPanel 
        isOpen={showAdminPanel} 
        onClose={() => setShowAdminPanel(false)} 
      />
    </div>
  );
}
