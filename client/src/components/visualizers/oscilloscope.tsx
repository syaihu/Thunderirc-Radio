import { useEffect, useRef } from "react";

export default function Oscilloscope() {
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

    const drawOscilloscope = () => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      ctx.clearRect(0, 0, width, height);

      // Generate oscilloscope waveform
      const samples = 200;
      const time = Date.now() * 0.001;
      
      ctx.strokeStyle = 'hsl(180, 100%, 50%)';
      ctx.lineWidth = 2;
      ctx.beginPath();

      for (let i = 0; i < samples; i++) {
        const x = (i / samples) * width;
        
        // Create complex waveform with multiple frequencies
        const baseFreq = 2 + Math.sin(time * 0.5) * 0.5;
        const harmonic1 = Math.sin(i * 0.1 * baseFreq + time * 3) * 0.6;
        const harmonic2 = Math.sin(i * 0.2 * baseFreq + time * 2) * 0.3;
        const harmonic3 = Math.sin(i * 0.05 * baseFreq + time * 4) * 0.2;
        
        const amplitude = (harmonic1 + harmonic2 + harmonic3) * 0.4;
        const y = height / 2 + amplitude * height / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.stroke();

      // Add grid lines
      ctx.strokeStyle = 'hsl(180, 50%, 25%)';
      ctx.lineWidth = 1;
      
      // Horizontal grid lines
      for (let i = 1; i < 4; i++) {
        const y = (i / 4) * height;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Vertical grid lines
      for (let i = 1; i < 8; i++) {
        const x = (i / 8) * width;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      animationRef.current = requestAnimationFrame(drawOscilloscope);
    };

    const handleResize = () => {
      resizeCanvas();
    };

    window.addEventListener('resize', handleResize);
    resizeCanvas();
    drawOscilloscope();

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