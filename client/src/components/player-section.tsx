import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RadioState } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/use-websocket";
import { apiRequest } from "@/lib/queryClient";
import WaveformCanvas from "@/components/waveform-canvas";
import SpectrumAnalyzer from "@/components/visualizers/spectrum-analyzer";
import Oscilloscope from "@/components/visualizers/oscilloscope";
import LevelMeters from "@/components/visualizers/level-meters";
import { 
  SkipBack, 
  Play, 
  Pause, 
  SkipForward, 
  Volume2, 
  VolumeX,
  MoveUp,
  ArrowDown01,
  TrendingUp,
  TrendingDown,
  Shuffle,
  Square,
  Radio,
  Zap
} from "lucide-react";

interface PlayerSectionProps {
  radioState: RadioState;
  setRadioState: (state: RadioState) => void;
}

export default function PlayerSection({ radioState, setRadioState }: PlayerSectionProps) {
  const [currentTime, setCurrentTime] = useState("1:23");
  const [totalTime, setTotalTime] = useState("3:42");
  const [progress, setProgress] = useState(35);
  const [visualizerType, setVisualizerType] = useState<'waveform' | 'spectrum' | 'oscilloscope' | 'levels'>('waveform');
  const [fadeInProgress, setFadeInProgress] = useState(false);
  const [fadeOutProgress, setFadeOutProgress] = useState(false);
  const [crossfadeProgress, setCrossfadeProgress] = useState(false);
  
  const { toast } = useToast();
  const ws = useWebSocket();
  const queryClient = useQueryClient();

  const currentTrack = {
    title: "Neon Dreams",
    artist: "Synthwave Collective",
    album: "Cyberpunk Chronicles",
    duration: "3:42",
    bitrate: "320 kbps",
    genre: "Synthwave",
    albumArt: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop"
  };

  // Mutations for stream control
  const updateRadioStateMutation = useMutation({
    mutationFn: (updates: Partial<RadioState>) => 
      apiRequest('PUT', '/api/radio-state', updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/radio-state'] });
    },
  });

  const handlePlayPause = () => {
    const newState = {
      ...radioState,
      isPlaying: !radioState.isPlaying
    };
    setRadioState(newState);
    updateRadioStateMutation.mutate({ isPlaying: !radioState.isPlaying });
    
    // Send via WebSocket for real-time updates
    ws.send({
      type: 'radio_state',
      data: { isPlaying: !radioState.isPlaying }
    });

    toast({
      title: newState.isPlaying ? "Stream Started" : "Stream Stopped",
      description: newState.isPlaying ? "Radio is now broadcasting live" : "Radio broadcast stopped",
      duration: 3000,
    });
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    const newState = {
      ...radioState,
      volume: newVolume
    };
    setRadioState(newState);
    updateRadioStateMutation.mutate({ volume: newVolume });
    
    ws.send({
      type: 'radio_state',
      data: { volume: newVolume }
    });
  };

  const handleFadeIn = () => {
    setFadeInProgress(true);
    toast({
      title: "Fade In",
      description: "Gradually increasing volume...",
      duration: 2000,
    });
    
    setTimeout(() => {
      setFadeInProgress(false);
      toast({
        title: "Fade In Complete",
        description: "Volume fade in finished",
        duration: 2000,
      });
    }, 3000);
  };

  const handleFadeOut = () => {
    setFadeOutProgress(true);
    toast({
      title: "Fade Out",
      description: "Gradually decreasing volume...",
      duration: 2000,
    });
    
    setTimeout(() => {
      setFadeOutProgress(false);
      toast({
        title: "Fade Out Complete",
        description: "Volume fade out finished",
        duration: 2000,
      });
    }, 3000);
  };

  const handleCrossfade = () => {
    setCrossfadeProgress(true);
    toast({
      title: "Crossfade",
      description: "Transitioning between tracks...",
      duration: 2000,
    });
    
    setTimeout(() => {
      setCrossfadeProgress(false);
      toast({
        title: "Crossfade Complete",
        description: "Track transition finished",
        duration: 2000,
      });
    }, 4000);
  };

  const handleEmergencyStop = () => {
    const newState = {
      ...radioState,
      isPlaying: false,
      volume: 0
    };
    setRadioState(newState);
    updateRadioStateMutation.mutate({ isPlaying: false, volume: 0 });
    
    ws.send({
      type: 'radio_state',
      data: { isPlaying: false, volume: 0 }
    });

    toast({
      title: "Emergency Stop Activated",
      description: "Stream stopped and volume muted",
      duration: 5000,
    });
  };

  const renderVisualizer = () => {
    switch (visualizerType) {
      case 'spectrum':
        return <SpectrumAnalyzer />;
      case 'oscilloscope':
        return <Oscilloscope />;
      case 'levels':
        return <LevelMeters />;
      default:
        return <WaveformCanvas />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Current Track */}
      <div className="glass-morphism rounded-xl p-6 neon-border">
        <div className="flex items-center space-x-6">
          {/* Album Art */}
          <div className="relative">
            <div className="w-32 h-32 rounded-xl overflow-hidden shadow-2xl">
              <img
                src={currentTrack.albumArt}
                alt="Current track album art"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-pink-500 rounded-xl opacity-75 blur-sm -z-10"></div>
          </div>

          {/* Track Info */}
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-foreground mb-1">{currentTrack.title}</h3>
            <p className="text-lg text-primary mb-1">{currentTrack.artist}</p>
            <p className="text-muted-foreground">{currentTrack.album}</p>
            <div className="mt-3 flex items-center space-x-4 text-sm text-muted-foreground">
              <span>{currentTrack.duration}</span>
              <span>•</span>
              <span>{currentTrack.bitrate}</span>
              <span>•</span>
              <span>{currentTrack.genre}</span>
            </div>
          </div>

          {/* Player Controls */}
          <div className="flex flex-col items-center space-y-4">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full">
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                className="w-16 h-16 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 neon-border"
                onClick={handlePlayPause}
              >
                {radioState.isPlaying ? (
                  <Pause className="h-6 w-6" />
                ) : (
                  <Play className="h-6 w-6 ml-1" />
                )}
              </Button>
              <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full">
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>

            {/* Volume Control */}
            <div className="flex items-center space-x-2">
              <VolumeX className="h-4 w-4" />
              <Slider
                value={[radioState.volume || 50]}
                onValueChange={handleVolumeChange}
                max={100}
                step={1}
                className="w-20"
              />
              <Volume2 className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
            <span>{currentTime}</span>
            <span>{totalTime}</span>
          </div>
          <div className="w-full bg-muted rounded-full h-1">
            <div
              className="bg-gradient-to-r from-primary to-pink-500 h-1 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Audio Visualization */}
      <div className="glass-morphism rounded-xl p-6 neon-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Audio Visualizer</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Peak:</span>
            <span className="text-sm text-green-400">-6.2 dB</span>
          </div>
        </div>

        <div className="bg-background rounded-lg p-4" style={{ height: '200px' }}>
          {renderVisualizer()}
        </div>

        {/* Visualization Controls */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button 
              size="sm" 
              variant={visualizerType === 'waveform' ? 'default' : 'ghost'}
              onClick={() => setVisualizerType('waveform')}
              className={visualizerType === 'waveform' ? 'bg-cyan-500 hover:bg-cyan-600 neon-border' : ''}
            >
              <Radio className="w-4 h-4 mr-1" />
              Waveform
            </Button>
            <Button 
              size="sm" 
              variant={visualizerType === 'spectrum' ? 'default' : 'ghost'}
              onClick={() => setVisualizerType('spectrum')}
              className={visualizerType === 'spectrum' ? 'bg-cyan-500 hover:bg-cyan-600 neon-border' : ''}
            >
              <TrendingUp className="w-4 h-4 mr-1" />
              Spectrum
            </Button>
            <Button 
              size="sm" 
              variant={visualizerType === 'oscilloscope' ? 'default' : 'ghost'}
              onClick={() => setVisualizerType('oscilloscope')}
              className={visualizerType === 'oscilloscope' ? 'bg-cyan-500 hover:bg-cyan-600 neon-border' : ''}
            >
              <Zap className="w-4 h-4 mr-1" />
              Oscilloscope
            </Button>
            <Button 
              size="sm" 
              variant={visualizerType === 'levels' ? 'default' : 'ghost'}
              onClick={() => setVisualizerType('levels')}
              className={visualizerType === 'levels' ? 'bg-cyan-500 hover:bg-cyan-600 neon-border' : ''}
            >
              <MoveUp className="w-4 h-4 mr-1" />
              Levels
            </Button>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <span className="text-muted-foreground">Gain:</span>
            <Slider
              defaultValue={[0]}
              min={-20}
              max={20}
              step={1}
              className="w-16"
            />
            <span className="text-primary">0 dB</span>
          </div>
        </div>
      </div>

      {/* Admin Controls */}
      <div className="glass-morphism rounded-xl p-6 neon-border">
        <h3 className="text-lg font-semibold mb-4">Stream Controls</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button 
            variant="ghost" 
            className={`flex flex-col items-center p-4 h-auto ${fadeInProgress ? 'bg-cyan-500/20 neon-border' : ''}`}
            onClick={handleFadeIn}
            disabled={updateRadioStateMutation.isPending || fadeInProgress}
          >
            <TrendingUp className="text-cyan-400 h-6 w-6 mb-2" />
            <span className="text-sm">{fadeInProgress ? 'Fading In...' : 'Fade In'}</span>
          </Button>
          <Button 
            variant="ghost" 
            className={`flex flex-col items-center p-4 h-auto ${fadeOutProgress ? 'bg-pink-500/20 neon-border' : ''}`}
            onClick={handleFadeOut}
            disabled={updateRadioStateMutation.isPending || fadeOutProgress}
          >
            <TrendingDown className="text-pink-500 h-6 w-6 mb-2" />
            <span className="text-sm">{fadeOutProgress ? 'Fading Out...' : 'Fade Out'}</span>
          </Button>
          <Button 
            variant="ghost" 
            className={`flex flex-col items-center p-4 h-auto ${crossfadeProgress ? 'bg-green-400/20 neon-border' : ''}`}
            onClick={handleCrossfade}
            disabled={updateRadioStateMutation.isPending || crossfadeProgress}
          >
            <Shuffle className="text-green-400 h-6 w-6 mb-2" />
            <span className="text-sm">{crossfadeProgress ? 'Crossfading...' : 'Crossfade'}</span>
          </Button>
          <Button 
            variant="ghost" 
            className="flex flex-col items-center p-4 h-auto hover:bg-red-500/20"
            onClick={handleEmergencyStop}
            disabled={updateRadioStateMutation.isPending}
          >
            <Square className="text-red-500 h-6 w-6 mb-2" />
            <span className="text-sm">Emergency</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
