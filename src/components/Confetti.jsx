import React, { useEffect, useRef } from 'react';

export default function Confetti({ active }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W = window.innerWidth;
    let H = window.innerHeight;
    let particles = [];
    let running = false;

    const colors = [
      '#ff595e', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93', '#ff7ab6'
    ];

    function resize() {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W;
      canvas.height = H;
    }

    function rand(min, max) {
      return Math.random() * (max - min) + min;
    }

    function initBurst() {
      particles = [];
      const countPerSide = Math.floor(60 + Math.random() * 40); // 60-100 per corner
      const spreadX = 40;
      const startY = H + 20;

      // left corner burst (shooting to the right/up)
      for (let i = 0; i < countPerSide; i++) {
        particles.push({
          x: rand(-40, spreadX),
          y: startY + rand(-10, 40),
          vx: rand(4, 16), // more horizontal push to the right
          vy: rand(-18, -10), // shoot upward
          size: rand(12, 26),
          color: colors[Math.floor(Math.random() * colors.length)],
          angle: rand(0, Math.PI * 2),
          spin: rand(-0.15, 0.15),
          ttl: Math.floor(400 + Math.random() * 120),
        });
      }

      // right corner burst (shooting to the left/up)
      for (let i = 0; i < countPerSide; i++) {
        particles.push({
          x: W - rand(-40, spreadX),
          y: startY + rand(-10, 40),
          vx: -rand(4, 16), // push to the left
          vy: rand(-18, -10),
          size: rand(12, 26),
          color: colors[Math.floor(Math.random() * colors.length)],
          angle: rand(0, Math.PI * 2),
          spin: rand(-0.15, 0.15),
          ttl: Math.floor(400 + Math.random() * 120),
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      }
    }

    function update() {
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.vy += 0.15    ; // gravity
        p.vx *= 0.995; // slight air drag
        p.x += p.vx;
        p.y += p.vy;
        p.angle += p.spin;
        p.ttl -= 1;
        // remove when out of view or expired
        if (p.y > H + 120 || p.ttl <= 0) {
          particles.splice(i, 1);
        }
      }
    }

    function loop() {
      if (!running) return;
      update();
      draw();
      if (particles.length > 0) {
        rafRef.current = requestAnimationFrame(loop);
      } else {
        running = false;
        // clear canvas once finished
        ctx.clearRect(0, 0, W, H);
      }
    }

    function start() {
      if (running) return;
      running = true;
      resize();
      initBurst();
      loop();
      // safety stop after 5s
      setTimeout(() => {
        particles = [];
      }, 5000);
    }

    function handleResize() {
      resize();
    }

    window.addEventListener('resize', handleResize);
    resize();

    if (active) start();

    return () => {
      window.removeEventListener('resize', handleResize);
      running = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    />
  );
}
