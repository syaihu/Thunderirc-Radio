import { useEffect, useRef } from "react";

export default function SpectrumAnalyzer() {
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

    const drawSpectrum = () => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      ctx.clearRect(0, 0, width, height);

      // Generate spectrum data with frequency-based distribution
      const barCount = 64;
      const barWidth = width / barCount;

      for (let i = 0; i < barCount; i++) {
        // Create frequency spectrum simulation (bass heavier on left)
        const frequency = i / barCount;
        const bassBoost = Math.exp(-frequency * 3) * 0.8;
        const randomVariation = Math.random() * 0.6;
        const normalizedHeight = (bassBoost + randomVariation * (1 - bassBoost)) * 0.9;
        const barHeight = normalizedHeight * height;
        
        const x = i * barWidth;
        
        // Create frequency-based gradient (red for bass, blue for treble)
        const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
        const hue = 180 + frequency * 120; // Cyan to magenta spectrum
        gradient.addColorStop(0, `hsl(${hue}, 100%, 50%)`);
        gradient.addColorStop(1, `hsl(${hue + 30}, 100%, 70%)`);

        ctx.fillStyle = gradient;
        ctx.fillRect(x, height - barHeight, barWidth - 2, barHeight);
      }

      animationRef.current = requestAnimationFrame(drawSpectrum);
    };

    const handleResize = () => {
      resizeCanvas();
    };

    window.addEventListener('resize', handleResize);
    resizeCanvas();
    drawSpectrum();

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