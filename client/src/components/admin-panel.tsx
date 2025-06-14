import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  UserCircle, 
  Settings, 
  Shield, 
  Activity, 
  Users, 
  Database,
  Server,
  X,
  LogOut,
  Key,
  Monitor,
  Headphones
} from "lucide-react";
import { RadioState } from "@shared/schema";

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminPanel({ isOpen, onClose }: AdminPanelProps) {
  const [currentUser] = useState({
    name: "Admin",
    email: "admin@neonwave.radio",
    role: "Super Admin",
    avatar: "A",
    lastLogin: new Date(),
    permissions: ["station_control", "user_management", "system_config"]
  });

  const { data: radioState } = useQuery<RadioState>({
    queryKey: ['/api/radio-state'],
  });

  const [systemStats] = useState({
    uptime: "24h 15m",
    cpu_usage: "45%",
    memory_usage: "62%",
    disk_usage: "78%",
    active_connections: 1247,
    total_tracks: 6,
    queue_length: 0
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed right-4 top-16 w-80 max-h-[80vh] bg-background border border-border rounded-lg shadow-2xl">
        <Card className="glass-morphism neon-border h-full">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCircle className="h-5 w-5 text-primary" />
                <CardTitle>Admin Panel</CardTitle>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription>System administration and user management</CardDescription>
          </CardHeader>

          <CardContent className="p-0">
            <ScrollArea className="h-96">
              <div className="p-4 space-y-4">
                {/* User Profile */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {currentUser.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold">{currentUser.name}</h3>
                    <p className="text-sm text-muted-foreground">{currentUser.email}</p>
                    <Badge variant="secondary" className="text-xs mt-1 bg-primary/20 text-primary">
                      {currentUser.role}
                    </Badge>
                  </div>
                </div>

                <Separator />

                {/* Quick Actions */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium mb-3">Quick Actions</h4>
                  
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={onClose}
                  >
                    <Settings className="h-4 w-4" />
                    Station Settings
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                  >
                    <Users className="h-4 w-4" />
                    User Management
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                  >
                    <Activity className="h-4 w-4" />
                    System Logs
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                  >
                    <Shield className="h-4 w-4" />
                    Security Center
                  </Button>
                </div>

                <Separator />

                {/* System Status */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">System Status</h4>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
                      <Monitor className="h-3 w-3 text-green-400" />
                      <div>
                        <p className="text-muted-foreground">Uptime</p>
                        <p className="font-medium">{systemStats.uptime}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
                      <Server className="h-3 w-3 text-blue-400" />
                      <div>
                        <p className="text-muted-foreground">CPU</p>
                        <p className="font-medium">{systemStats.cpu_usage}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
                      <Database className="h-3 w-3 text-primary" />
                      <div>
                        <p className="text-muted-foreground">Memory</p>
                        <p className="font-medium">{systemStats.memory_usage}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
                      <Headphones className="h-3 w-3 text-pink-400" />
                      <div>
                        <p className="text-muted-foreground">Listeners</p>
                        <p className="font-medium">{radioState?.listenerCount || 0}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Radio Station Info */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Station Info</h4>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                        {radioState?.isPlaying ? 'LIVE' : 'OFFLINE'}
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">IRC Bot:</span>
                      <Badge variant="secondary" className={radioState?.ircConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                        {radioState?.ircConnected ? 'Connected' : 'Disconnected'}
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">IRC Channel:</span>
                      <span className="font-mono text-xs">{radioState?.ircChannel}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">IRC Users:</span>
                      <span>{radioState?.ircUserCount || 0}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Volume:</span>
                      <span>{radioState?.volume || 0}%</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Permissions */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Permissions</h4>
                  <div className="flex flex-wrap gap-1">
                    {currentUser.permissions.map((permission) => (
                      <Badge key={permission} variant="outline" className="text-xs">
                        {permission.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Account Actions */}
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                  >
                    <Key className="h-4 w-4" />
                    Change Password
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2 text-red-400 border-red-500/50 hover:bg-red-500/10"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}