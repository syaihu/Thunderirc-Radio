import { QueueWithTrack } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { ArrowUp, X, Shuffle } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface QueuePanelProps {
  queue: QueueWithTrack[];
}

export default function QueuePanel({ queue }: QueuePanelProps) {
  const queryClient = useQueryClient();

  const removeFromQueueMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/queue/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/queue'] });
    },
  });

  const handleRemoveFromQueue = (id: number) => {
    removeFromQueueMutation.mutate(id);
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Upcoming Tracks</h3>
          <Button variant="ghost" size="icon">
            <Shuffle className="h-4 w-4 text-primary" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3">
        {queue.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Queue is empty</p>
            <p className="text-sm mt-1">Songs requested via IRC will appear here</p>
          </div>
        ) : (
          queue.map((item, index) => (
            <div
              key={item.id}
              className="flex items-center space-x-3 p-3 hover:bg-muted/50 rounded-lg transition-colors cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                <img
                  src={item.track.albumArt || "https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=100&h=100&fit=crop"}
                  alt="Track thumbnail"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{item.track.title}</p>
                <p className="text-sm text-muted-foreground truncate">{item.track.artist}</p>
                {item.requestedBy && (
                  <p className="text-xs text-muted-foreground">
                    Requested by: {item.requestedBy}
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {index > 0 && (
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <ArrowUp className="h-3 w-3 text-primary" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleRemoveFromQueue(item.id)}
                  disabled={removeFromQueueMutation.isPending}
                >
                  <X className="h-3 w-3 text-red-500" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
