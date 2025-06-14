import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { QueueWithTrack } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { 
  Play, 
  Pause, 
  SkipForward, 
  Shuffle, 
  X, 
  ArrowUp, 
  ArrowDown, 
  List,
  Clock,
  Users
} from "lucide-react";

export default function Playlist() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: queue = [], isLoading } = useQuery<QueueWithTrack[]>({
    queryKey: ['/api/queue'],
  });

  const removeFromQueueMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/queue/${id}`),
    onSuccess: () => {
      toast({
        title: "Removed from Queue",
        description: "Track removed from playlist",
        duration: 3000,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/queue'] });
    },
  });

  const clearQueueMutation = useMutation({
    mutationFn: () => apiRequest('DELETE', '/api/queue'),
    onSuccess: () => {
      toast({
        title: "Queue Cleared",
        description: "All tracks removed from playlist",
        duration: 3000,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/queue'] });
    },
  });

  const handleRemoveTrack = (id: number) => {
    removeFromQueueMutation.mutate(id);
  };

  const handleClearQueue = () => {
    clearQueueMutation.mutate();
  };

  const getTotalDuration = () => {
    return queue.reduce((total, item) => {
      const [minutes, seconds] = item.track.duration.split(':').map(Number);
      return total + minutes * 60 + seconds;
    }, 0);
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading playlist...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold neon-glow">Current Playlist</h1>
            <p className="text-muted-foreground mt-1">Manage your radio station queue</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleClearQueue}
              disabled={queue.length === 0 || clearQueueMutation.isPending}
              className="border-red-500/50 text-red-400 hover:bg-red-500/10"
            >
              Clear All
            </Button>
            <Badge variant="secondary" className="bg-primary/20 text-primary">
              {queue.length} tracks queued
            </Badge>
          </div>
        </div>

        {/* Playlist Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="glass-morphism">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <List className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{queue.length}</p>
                  <p className="text-sm text-muted-foreground">Tracks in Queue</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-morphism">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Clock className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatDuration(getTotalDuration())}</p>
                  <p className="text-sm text-muted-foreground">Total Duration</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-morphism">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-pink-500/20 rounded-lg">
                  <Users className="h-6 w-6 text-pink-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{queue.filter(item => item.requestedBy).length}</p>
                  <p className="text-sm text-muted-foreground">IRC Requests</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Playlist Controls */}
        <Card className="glass-morphism neon-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Playlist Controls
            </CardTitle>
            <CardDescription>Manage playback and queue order</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Button className="bg-primary/20 text-primary hover:bg-primary/30">
                <Play className="h-4 w-4 mr-2" />
                Play Queue
              </Button>
              <Button variant="outline">
                <Shuffle className="h-4 w-4 mr-2" />
                Shuffle
              </Button>
              <Button variant="outline">
                <SkipForward className="h-4 w-4 mr-2" />
                Skip to Next
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Queue List */}
        <Card className="glass-morphism neon-border">
          <CardHeader>
            <CardTitle>Queue ({queue.length} tracks)</CardTitle>
            <CardDescription>Tracks will play in this order</CardDescription>
          </CardHeader>
          <CardContent>
            {queue.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <List className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No tracks in queue</h3>
                <p>Add tracks from the library or wait for IRC requests</p>
              </div>
            ) : (
              <div className="space-y-3">
                {queue.map((item: QueueWithTrack, index: number) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-4 rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    {/* Position */}
                    <div className="flex items-center justify-center w-8 h-8 rounded bg-muted text-sm font-medium">
                      {index + 1}
                    </div>

                    {/* Album Art */}
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={item.track.albumArt || "https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=100&h=100&fit=crop"}
                        alt="Album art"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    {/* Track Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{item.track.title}</h3>
                      <p className="text-sm text-primary truncate">{item.track.artist}</p>
                      <p className="text-xs text-muted-foreground truncate">{item.track.album}</p>
                      {item.requestedBy && (
                        <p className="text-xs text-pink-400 mt-1">
                          Requested by: {item.requestedBy}
                        </p>
                      )}
                    </div>
                    
                    {/* Duration & Genre */}
                    <div className="flex flex-col items-end gap-1 text-sm text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        {item.track.genre}
                      </Badge>
                      <span>{item.track.duration}</span>
                    </div>
                    
                    {/* Controls */}
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {index > 0 && (
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                          <ArrowUp className="h-4 w-4 text-primary" />
                        </Button>
                      )}
                      {index < queue.length - 1 && (
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                          <ArrowDown className="h-4 w-4 text-primary" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => handleRemoveTrack(item.id)}
                        disabled={removeFromQueueMutation.isPending}
                      >
                        <X className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}