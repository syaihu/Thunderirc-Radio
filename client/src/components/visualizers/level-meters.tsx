import { useEffect, useRef } from "react";

export default function LevelMeters() {
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

    const drawLevelMeters = () => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      ctx.clearRect(0, 0, width, height);

      // Draw stereo level meters
      const meterWidth = 40;
      const meterHeight = height - 40;
      const leftMeterX = width / 2 - meterWidth - 10;
      const rightMeterX = width / 2 + 10;
      const meterY = 20;

      // Generate realistic audio levels
      const time = Date.now() * 0.001;
      const leftLevel = (Math.sin(time * 3) * 0.3 + Math.sin(time * 7) * 0.2 + 0.5) * 0.9;
      const rightLevel = (Math.sin(time * 2.8) * 0.3 + Math.sin(time * 6.5) * 0.2 + 0.5) * 0.85;

      // Draw meter backgrounds
      ctx.fillStyle = 'hsl(0, 0%, 10%)';
      ctx.fillRect(leftMeterX, meterY, meterWidth, meterHeight);
      ctx.fillRect(rightMeterX, meterY, meterWidth, meterHeight);

      // Draw level bars with color gradient
      const drawMeter = (x: number, level: number, label: string) => {
        const fillHeight = level * meterHeight;
        const segments = 20;
        const segmentHeight = meterHeight / segments;

        for (let i = 0; i < segments; i++) {
          const segmentY = meterY + meterHeight - (i + 1) * segmentHeight;
          const segmentLevel = i / segments;

          if (segmentLevel <= level) {
            // Color based on level: green -> yellow -> red
            let color;
            if (segmentLevel < 0.6) {
              color = 'hsl(120, 100%, 50%)'; // Green
            } else if (segmentLevel < 0.8) {
              color = 'hsl(60, 100%, 50%)'; // Yellow
            } else {
              color = 'hsl(0, 100%, 50%)'; // Red
            }

            ctx.fillStyle = color;
            ctx.fillRect(x + 2, segmentY + 1, meterWidth - 4, segmentHeight - 2);
          }
        }

        // Peak hold indicator
        const peakY = meterY + meterHeight - (level * meterHeight);
        ctx.fillStyle = 'hsl(180, 100%, 50%)';
        ctx.fillRect(x + 2, peakY - 1, meterWidth - 4, 2);

        // Label
        ctx.fillStyle = 'hsl(0, 0%, 70%)';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(label, x + meterWidth / 2, meterY + meterHeight + 15);
      };

      drawMeter(leftMeterX, leftLevel, 'L');
      drawMeter(rightMeterX, rightLevel, 'R');

      // Draw dB scale
      ctx.fillStyle = 'hsl(0, 0%, 50%)';
      ctx.font = '10px monospace';
      ctx.textAlign = 'right';

      const dbValues = [0, -6, -12, -18, -24, -30, -40, -60];
      dbValues.forEach((db, index) => {
        const y = meterY + (index / (dbValues.length - 1)) * meterHeight;
        ctx.fillText(`${db}`, leftMeterX - 5, y + 3);
      });

      // Draw numeric levels
      ctx.fillStyle = 'hsl(180, 100%, 50%)';
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`L: ${(leftLevel * 100).toFixed(0)}%`, leftMeterX + meterWidth / 2, height - 5);
      ctx.fillText(`R: ${(rightLevel * 100).toFixed(0)}%`, rightMeterX + meterWidth / 2, height - 5);

      animationRef.current = requestAnimationFrame(drawLevelMeters);
    };

    const handleResize = () => {
      resizeCanvas();
    };

    window.addEventListener('resize', handleResize);
    resizeCanvas();
    drawLevelMeters();

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