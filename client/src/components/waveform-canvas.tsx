import { useEffect, useRef } from "react";

export default function WaveformCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    const drawWaveform = () => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      ctx.clearRect(0, 0, width, height);

      // Generate mock waveform data
      const barCount = 100;
      const barWidth = width / barCount;

      for (let i = 0; i < barCount; i++) {
        // Create more realistic waveform with some rhythm
        const baseHeight = Math.sin(i * 0.1) * 0.3 + 0.5;
        const randomVariation = Math.random() * 0.4;
        const barHeight = (baseHeight + randomVariation) * height * 0.8;
        
        const x = i * barWidth;
        
        // Create gradient from cyan to magenta
        const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
        gradient.addColorStop(0, 'hsl(180, 100%, 50%)');
        gradient.addColorStop(1, 'hsl(300, 100%, 50%)');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);
      }

      animationRef.current = requestAnimationFrame(drawWaveform);
    };

    const handleResize = () => {
      resizeCanvas();
    };

    window.addEventListener('resize', handleResize);
    resizeCanvas();
    drawWaveform();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ width: '100%', height: '100%' }}
    />
  );
}
