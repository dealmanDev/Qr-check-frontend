import { useEffect, useRef } from 'react';

export const HeroGrid = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let mouseX = 0.5;
    let mouseY = 0.5;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    };
    resize();
    window.addEventListener('resize', resize);

    const handleMouse = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = (e.clientX - rect.left) / rect.width;
      mouseY = (e.clientY - rect.top) / rect.height;
    };
    canvas.addEventListener('mousemove', handleMouse);

    const cols = 40;
    const rows = 25;

    const draw = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const w = canvas.width / cols;
      const h = canvas.height / rows;

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * w + w / 2;
          const y = j * h + h / 2;
          const dx = (i / cols) - mouseX;
          const dy = (j / rows) - mouseY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const wave = Math.sin(time * 0.001 + dist * 8) * 0.5 + 0.5;
          const size = 1.5 + wave * 2;
          const alpha = 0.08 + wave * 0.15;

          ctx.beginPath();
          ctx.arc(x, y, size * window.devicePixelRatio, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(37, 99, 235, ${alpha})`;
          ctx.fill();
        }
      }
      animationId = requestAnimationFrame(draw);
    };
    animationId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', handleMouse);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
};
