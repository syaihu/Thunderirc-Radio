import { useState } from "react";
import { ChatMessage } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { useWebSocket } from "@/hooks/use-websocket";
import { format } from "date-fns";

interface ChatPanelProps {
  messages: ChatMessage[];
}

export default function ChatPanel({ messages }: ChatPanelProps) {
  const [newMessage, setNewMessage] = useState("");
  const ws = useWebSocket();

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    ws.send({
      type: 'chat_message',
      data: {
        username: 'WebUser',
        message: newMessage,
      }
    });

    setNewMessage("");
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">IRC Channel</h3>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full live-indicator"></div>
            <span className="text-xs text-muted-foreground">23 users</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No messages yet</p>
            <p className="text-sm mt-1">IRC messages will appear here</p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="text-sm">
              <div className="flex items-center gap-2">
                <span className={`font-medium ${message.isBot ? 'text-pink-400' : 'text-primary'}`}>
                  {message.username}
                </span>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(message.timestamp), 'HH:mm')}
                </span>
              </div>
              <p className="text-foreground mt-1">{message.message}</p>
            </div>
          ))
        )}
      </div>

      <div className="p-4 border-t border-border">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-muted border-border focus:border-primary"
          />
          <Button type="submit" size="icon" className="bg-primary text-primary-foreground">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
