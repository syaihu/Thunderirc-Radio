import { RadioState } from "@shared/schema";
import { Home, Music, List, Settings, Radio } from "lucide-react";
import { Link, useLocation } from "wouter";

interface SidebarProps {
  radioState: RadioState;
}

export default function Sidebar({ radioState }: SidebarProps) {
  const [location] = useLocation();

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="w-64 bg-secondary/50 glass-morphism border-r border-border flex flex-col">
      {/* Station Branding */}
      <div className="p-6 border-b border-border">
        <Link href="/" className="block">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-pink-500 rounded-lg flex items-center justify-center">
              <Radio className="text-background h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold neon-glow">NeonWave</h1>
              <p className="text-sm text-muted-foreground">Radio Station</p>
            </div>
          </div>
        </Link>
        <div className="mt-4 flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full live-indicator"></div>
          <span className="text-xs text-green-400 font-medium">LIVE</span>
          <span className="text-xs text-muted-foreground">
            • {radioState.listenerCount} listeners
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        <Link
          href="/"
          className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
            isActive("/") 
              ? "bg-primary/20 text-primary neon-border" 
              : "hover:bg-muted"
          }`}
        >
          <Home className="w-5 h-5" />
          <span>Dashboard</span>
        </Link>
        <Link
          href="/library"
          className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
            isActive("/library") 
              ? "bg-primary/20 text-primary neon-border" 
              : "hover:bg-muted"
          }`}
        >
          <Music className="w-5 h-5" />
          <span>Library</span>
        </Link>
        <Link
          href="/playlist"
          className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
            isActive("/playlist") 
              ? "bg-primary/20 text-primary neon-border" 
              : "hover:bg-muted"
          }`}
        >
          <List className="w-5 h-5" />
          <span>Playlist</span>
        </Link>
        <Link
          href="/settings"
          className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
            isActive("/settings") 
              ? "bg-primary/20 text-primary neon-border" 
              : "hover:bg-muted"
          }`}
        >
          <Settings className="w-5 h-5" />
          <span>Settings</span>
        </Link>
      </nav>

      {/* IRC Status */}
      <div className="p-4 border-t border-border">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">IRC Bot Status</span>
            <div className={`w-2 h-2 rounded-full ${radioState.ircConnected ? 'bg-green-500 live-indicator' : 'bg-red-500'}`}></div>
          </div>
          <div className="text-xs text-muted-foreground space-y-1">
            <div>Server: irc.libera.chat</div>
            <div>Channel: {radioState.ircChannel}</div>
            <div>Users: {radioState.ircUserCount} online</div>
          </div>
        </div>
      </div>
    </div>
  );
}
