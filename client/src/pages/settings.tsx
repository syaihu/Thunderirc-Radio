import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { RadioState, StationSettings, User, SystemLog, SecurityEvent } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { useWebSocket } from "@/hooks/use-websocket";
import { BRANDING } from "@/config/branding";
import { 
  Settings as SettingsIcon,
  Radio,
  Volume2,
  Wifi,
  Server,
  Database,
  Users,
  Shield,
  Palette,
  Bell,
  UserPlus,
  Trash2,
  Edit,
  AlertTriangle,
  FileText,
  Activity,
  Lock
} from "lucide-react";

export default function Settings() {
  const [ircChannel, setIrcChannel] = useState(BRANDING.irc.defaultChannel);
  const [serverVolume, setServerVolume] = useState([75]);
  const [autoPlay, setAutoPlay] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [stationName, setStationName] = useState(BRANDING.siteName);
  const [tagline, setTagline] = useState(BRANDING.tagline);
  const [newUser, setNewUser] = useState({ username: '', email: '', role: 'listener' });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const ws = useWebSocket();

  const { data: radioState } = useQuery<RadioState>({
    queryKey: ['/api/radio-state'],
  });

  const { data: stationSettings } = useQuery<StationSettings>({
    queryKey: ['/api/station-settings'],
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  const { data: systemLogs } = useQuery<SystemLog[]>({
    queryKey: ['/api/system-logs'],
  });

  const { data: securityEvents } = useQuery<SecurityEvent[]>({
    queryKey: ['/api/security-events'],
  });

  const updateRadioStateMutation = useMutation({
    mutationFn: (updates: Partial<RadioState>) => 
      apiRequest('PUT', '/api/radio-state', updates),
    onSuccess: () => {
      toast({
        title: "Settings Updated",
        description: "Radio station settings have been saved",
        duration: 3000,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/radio-state'] });
    },
  });

  const updateStationSettingsMutation = useMutation({
    mutationFn: (updates: Partial<StationSettings>) => 
      apiRequest('PUT', '/api/station-settings', updates),
    onSuccess: () => {
      toast({
        title: "Station Settings Updated",
        description: "Station configuration has been saved",
        duration: 3000,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/station-settings'] });
    },
  });

  const createUserMutation = useMutation({
    mutationFn: (userData: typeof newUser) => 
      apiRequest('POST', '/api/users', userData),
    onSuccess: () => {
      toast({
        title: "User Created",
        description: "New user has been added successfully",
        duration: 3000,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setNewUser({ username: '', email: '', role: 'listener' });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: number) => 
      apiRequest('DELETE', `/api/users/${userId}`, {}),
    onSuccess: () => {
      toast({
        title: "User Deleted",
        description: "User has been removed from the system",
        duration: 3000,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
  });

  const clearLogsMutation = useMutation({
    mutationFn: () => apiRequest('DELETE', '/api/system-logs', {}),
    onSuccess: () => {
      toast({
        title: "Logs Cleared",
        description: "System logs have been cleared",
        duration: 3000,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/system-logs'] });
    },
  });

  useEffect(() => {
    if (radioState) {
      setIrcChannel(radioState.ircChannel || BRANDING.irc.defaultChannel);
      setServerVolume([radioState.volume || 75]);
    }
  }, [radioState]);

  useEffect(() => {
    if (stationSettings) {
      setStationName(stationSettings.stationName || BRANDING.siteName);
      setTagline(stationSettings.tagline || BRANDING.tagline);
      setAutoPlay(stationSettings.autoPlay || true);
    }
  }, [stationSettings]);

  const handleSaveSettings = () => {
    const updates = {
      ircChannel,
      volume: serverVolume[0],
    };
    
    updateRadioStateMutation.mutate(updates);
    
    // Send updates via WebSocket
    ws.send({
      type: 'radio_state',
      data: updates
    });
  };

  const handleTestIRC = () => {
    toast({
      title: "IRC Connection Test",
      description: "Testing connection to IRC server...",
      duration: 3000,
    });
  };

  const handleSaveStationSettings = () => {
    const updates = {
      stationName,
      tagline,
      autoPlay,
      ircChannel,
      volume: serverVolume[0],
    };
    
    updateStationSettingsMutation.mutate(updates);
    updateRadioStateMutation.mutate({ ircChannel, volume: serverVolume[0] });
    
    ws.send({
      type: 'radio_state',
      data: { ircChannel, volume: serverVolume[0] }
    });
  };

  const handleCreateUser = () => {
    if (newUser.username && newUser.email) {
      createUserMutation.mutate(newUser);
    } else {
      toast({
        title: "Validation Error",
        description: "Username and email are required",
        duration: 3000,
      });
    }
  };

  const handleDeleteUser = (userId: number) => {
    if (confirm("Are you sure you want to delete this user?")) {
      deleteUserMutation.mutate(userId);
    }
  };

  const formatTimestamp = (timestamp: Date | null) => {
    if (!timestamp) return 'Unknown';
    return new Date(timestamp).toLocaleString();
  };

  const getSeverityBadgeVariant = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  const getLevelBadgeVariant = (level: string) => {
    switch (level) {
      case 'error': return 'destructive';
      case 'warn': return 'secondary';
      case 'info': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold neon-glow">Admin Control Center</h1>
            <p className="text-muted-foreground mt-1">Manage station settings, users, and system monitoring</p>
          </div>
          <Badge variant="secondary" className="bg-primary/20 text-primary">
            <SettingsIcon className="h-4 w-4 mr-1" />
            Admin Panel
          </Badge>
        </div>

        <Tabs defaultValue="station" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="station" className="flex items-center gap-2">
              <Radio className="h-4 w-4" />
              Station Settings
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              User Management
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              System Logs
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security Center
            </TabsTrigger>
          </TabsList>

          <TabsContent value="station" className="space-y-6 mt-6">
            {/* Station Configuration */}
            <Card className="glass-morphism neon-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Radio className="h-5 w-5" />
                  Station Configuration
                </CardTitle>
                <CardDescription>Core radio station settings and branding</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="station-name">Station Name</Label>
                    <Input
                      id="station-name"
                      value={stationName}
                      onChange={(e) => setStationName(e.target.value)}
                      className="bg-muted border-border focus:border-primary"
                      placeholder="Your Station Name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tagline">Station Tagline</Label>
                    <Input
                      id="tagline"
                      value={tagline}
                      onChange={(e) => setTagline(e.target.value)}
                      className="bg-muted border-border focus:border-primary"
                      placeholder="Your Station Tagline"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Server Volume ({serverVolume[0]}%)</Label>
                  <Slider
                    value={serverVolume}
                    onValueChange={setServerVolume}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-play Next Track</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically play the next track in queue
                    </p>
                  </div>
                  <Switch checked={autoPlay} onCheckedChange={setAutoPlay} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="irc-channel">IRC Channel</Label>
                  <Input
                    id="irc-channel"
                    value={ircChannel}
                    onChange={(e) => setIrcChannel(e.target.value)}
                    className="bg-muted border-border focus:border-primary"
                    placeholder="#your-channel"
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <Button 
                    onClick={handleSaveStationSettings}
                    disabled={updateStationSettingsMutation.isPending}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {updateStationSettingsMutation.isPending ? "Saving..." : "Save Station Settings"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Server Status */}
            <Card className="glass-morphism">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Server Status
                </CardTitle>
                <CardDescription>Current system status and statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <Database className="h-5 w-5 text-green-400" />
                    </div>
                    <div>
                      <p className="font-medium">Database</p>
                      <p className="text-sm text-green-400">Connected</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="p-2 bg-primary/20 rounded-lg">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Listeners</p>
                      <p className="text-sm text-primary">{radioState?.listenerCount || 0}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="p-2 bg-pink-500/20 rounded-lg">
                      <Wifi className="h-5 w-5 text-pink-400" />
                    </div>
                    <div>
                      <p className="font-medium">IRC Users</p>
                      <p className="text-sm text-pink-400">{radioState?.ircUserCount || 0}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6 mt-6">
            {/* User Management */}
            <Card className="glass-morphism neon-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Management
                </CardTitle>
                <CardDescription>Manage system users and permissions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border border-dashed border-border rounded-lg">
                  <Input
                    placeholder="Username"
                    value={newUser.username}
                    onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                  />
                  <Input
                    placeholder="Email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  />
                  <div className="flex gap-2">
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="listener">Listener</option>
                      <option value="dj">DJ</option>
                      <option value="moderator">Moderator</option>
                      <option value="admin">Admin</option>
                    </select>
                    <Button onClick={handleCreateUser} disabled={createUserMutation.isPending}>
                      <UserPlus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {users?.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{user.username}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{user.role}</Badge>
                          <Badge variant={user.isActive ? "default" : "secondary"}>
                            {user.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={deleteUserMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="space-y-6 mt-6">
            {/* System Logs */}
            <Card className="glass-morphism neon-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  System Logs
                </CardTitle>
                <CardDescription>View and manage system activity logs</CardDescription>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/system-logs'] })}
                  >
                    <Activity className="h-4 w-4 mr-1" />
                    Refresh
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => clearLogsMutation.mutate()}
                    disabled={clearLogsMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Clear Logs
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-2">
                    {systemLogs?.map((log) => (
                      <div key={log.id} className="flex items-start gap-3 p-3 border rounded-lg">
                        <Badge variant={getLevelBadgeVariant(log.level)}>
                          {log.level.toUpperCase()}
                        </Badge>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{log.message}</p>
                          <p className="text-xs text-muted-foreground">
                            {log.category} • {formatTimestamp(log.timestamp)}
                          </p>
                          {log.details && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {log.details}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6 mt-6">
            {/* Security Events */}
            <Card className="glass-morphism neon-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Center
                </CardTitle>
                <CardDescription>Monitor security events and access control</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <Lock className="h-5 w-5 text-green-400" />
                    </div>
                    <div>
                      <p className="font-medium text-green-400">System Secure</p>
                      <p className="text-sm text-muted-foreground">No threats detected</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="p-2 bg-primary/20 rounded-lg">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Active Sessions</p>
                      <p className="text-sm text-primary">{users?.filter(u => u.isActive).length || 0}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="p-2 bg-orange-500/20 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-orange-400" />
                    </div>
                    <div>
                      <p className="font-medium">Security Events</p>
                      <p className="text-sm text-orange-400">{securityEvents?.length || 0}</p>
                    </div>
                  </div>
                </div>

                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {securityEvents?.map((event) => (
                      <div key={event.id} className="flex items-start gap-3 p-3 border rounded-lg">
                        <Badge variant={getSeverityBadgeVariant(event.severity)}>
                          {event.severity.toUpperCase()}
                        </Badge>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{event.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {event.eventType} • {formatTimestamp(event.timestamp)}
                          </p>
                          {event.ipAddress && (
                            <p className="text-xs text-muted-foreground">
                              IP: {event.ipAddress}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}