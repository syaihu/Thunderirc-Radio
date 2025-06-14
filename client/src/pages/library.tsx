import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Track, InsertTrack } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { Search, Play, Plus, Music, Clock, Disc3 } from "lucide-react";

export default function Library() {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tracks = [], isLoading } = useQuery<Track[]>({
    queryKey: ['/api/tracks'],
  });

  const { data: searchResults = [] } = useQuery<Track[]>({
    queryKey: ['/api/tracks/search', searchQuery],
    queryFn: () => searchQuery ? apiRequest('GET', `/api/tracks/search?q=${encodeURIComponent(searchQuery)}`) : Promise.resolve([]),
    enabled: !!searchQuery,
  });

  const addToQueueMutation = useMutation({
    mutationFn: (track: Track) => apiRequest('POST', '/api/queue', {
      trackId: track.id,
      position: Date.now(), // Simple position based on timestamp
      requestedBy: 'Web User'
    }),
    onSuccess: () => {
      toast({
        title: "Added to Queue",
        description: "Track added to playlist queue",
        duration: 3000,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/queue'] });
    },
  });

  const displayTracks = searchQuery ? searchResults : tracks;

  const handleAddToQueue = (track: Track) => {
    addToQueueMutation.mutate(track);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading music library...</p>
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
            <h1 className="text-3xl font-bold neon-glow">Music Library</h1>
            <p className="text-muted-foreground mt-1">Browse and manage your track collection</p>
          </div>
          <Badge variant="secondary" className="bg-primary/20 text-primary">
            {tracks.length} tracks available
          </Badge>
        </div>

        {/* Search */}
        <Card className="glass-morphism neon-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search Library
            </CardTitle>
            <CardDescription>Find tracks by title, artist, or album</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                placeholder="Search for tracks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-muted border-border focus:border-primary"
              />
              <Button variant="outline" onClick={() => setSearchQuery("")}>
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="glass-morphism">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <Music className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{tracks.length}</p>
                  <p className="text-sm text-muted-foreground">Total Tracks</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-morphism">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-pink-500/20 rounded-lg">
                  <Disc3 className="h-6 w-6 text-pink-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{new Set(tracks.map(t => t.artist)).size}</p>
                  <p className="text-sm text-muted-foreground">Artists</p>
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
                  <p className="text-2xl font-bold">{tracks.length * 4}min</p>
                  <p className="text-sm text-muted-foreground">Total Duration</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Track List */}
        <Card className="glass-morphism neon-border">
          <CardHeader>
            <CardTitle>
              {searchQuery ? `Search Results (${displayTracks.length})` : 'All Tracks'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {displayTracks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Music className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{searchQuery ? 'No tracks found matching your search' : 'No tracks in library'}</p>
                </div>
              ) : (
                displayTracks.map((track: Track) => (
                  <div
                    key={track.id}
                    className="flex items-center gap-4 p-4 rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={track.albumArt || "https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=100&h=100&fit=crop"}
                        alt="Album art"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{track.title}</h3>
                      <p className="text-sm text-primary truncate">{track.artist}</p>
                      <p className="text-xs text-muted-foreground truncate">{track.album}</p>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        {track.genre}
                      </Badge>
                      <span>{track.duration}</span>
                      <span>{track.bitrate}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        className="bg-primary/20 text-primary hover:bg-primary/30"
                        onClick={() => handleAddToQueue(track)}
                        disabled={addToQueueMutation.isPending}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Queue
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Play className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}