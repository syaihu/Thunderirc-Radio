import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Bell, 
  Music, 
  Users, 
  MessageCircle, 
  Settings,
  X,
  Clock,
  CheckCircle
} from "lucide-react";
import { format } from "date-fns";

interface Notification {
  id: string;
  type: 'song_request' | 'new_listener' | 'chat_message' | 'system' | 'admin';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
}

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationsPanel({ isOpen, onClose }: NotificationsPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'song_request',
      title: 'New Song Request',
      message: 'CyberFan_92 requested "Electric Dreams" by Neon Synth',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      read: false,
      priority: 'medium'
    },
    {
      id: '2',
      type: 'new_listener',
      title: 'New Listener',
      message: '5 new listeners joined the station',
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      read: false,
      priority: 'low'
    },
    {
      id: '3',
      type: 'chat_message',
      title: 'IRC Activity',
      message: 'High activity in #neonwave-radio (23 messages)',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      read: true,
      priority: 'low'
    },
    {
      id: '4',
      type: 'system',
      title: 'System Status',
      message: 'Database backup completed successfully',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      read: true,
      priority: 'low'
    },
    {
      id: '5',
      type: 'admin',
      title: 'Admin Alert',
      message: 'IRC bot reconnected after brief disconnection',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      read: false,
      priority: 'high'
    }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'song_request':
        return <Music className="h-4 w-4 text-primary" />;
      case 'new_listener':
        return <Users className="h-4 w-4 text-green-400" />;
      case 'chat_message':
        return <MessageCircle className="h-4 w-4 text-blue-400" />;
      case 'system':
        return <Settings className="h-4 w-4 text-muted-foreground" />;
      case 'admin':
        return <Bell className="h-4 w-4 text-red-400" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'medium':
        return 'bg-primary/20 text-primary border-primary/50';
      case 'low':
        return 'bg-muted/50 text-muted-foreground border-border';
      default:
        return 'bg-muted/50 text-muted-foreground border-border';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed right-4 top-16 w-96 max-h-[80vh] bg-background border border-border rounded-lg shadow-2xl">
        <Card className="glass-morphism neon-border h-full">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                <CardTitle>Notifications</CardTitle>
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="bg-primary/20 text-primary">
                    {unreadCount}
                  </Badge>
                )}
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription>Station activity and system alerts</CardDescription>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
                className="self-start mt-2"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Mark all as read
              </Button>
            )}
          </CardHeader>

          <CardContent className="p-0">
            <ScrollArea className="h-96">
              <div className="space-y-1 p-4">
                {notifications.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No notifications</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div key={notification.id}>
                      <div
                        className={`flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group ${
                          !notification.read ? 'bg-primary/5' : ''
                        }`}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className={`text-sm font-medium ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></div>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {format(notification.timestamp, 'HH:mm')}
                            </div>
                            <Badge
                              variant="outline"
                              className={`text-xs ${getPriorityColor(notification.priority)}`}
                            >
                              {notification.priority}
                            </Badge>
                          </div>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeNotification(notification.id);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <Separator className="my-1" />
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}