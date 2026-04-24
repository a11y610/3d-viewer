import { useEffect, useRef } from 'react';

/**
 * StarCanvas – renders an animated nakshatra star-field background.
 * Draws:
 *  • Multi-layered parallax stars (nakshtras) with individual twinkle cycles
 *  • Random constellation lines connecting nearby bright stars
 *  • Periodic shooting stars
 */
export default function StarCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animId;
    let W, H;

    /* ---------- resize ---------- */
    const resize = () => {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    /* ---------- generate stars (nakshtras) ---------- */
    const STAR_COUNT = 320;
    const stars = Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.6 + 0.3,
      speed: Math.random() * 0.0004 + 0.00008,
      phase: Math.random() * Math.PI * 2,
      // colour: white / violet / cyan / gold
      hue: [0, 270, 195, 50][Math.floor(Math.random() * 4)],
      sat: Math.random() > 0.6 ? Math.floor(Math.random() * 60 + 40) : 0,
      bright: Math.floor(Math.random() * 30 + 70),
    }));

    /* ---------- constellation pairs ---------- */
    const BRIGHT_STARS = stars.filter(s => s.r > 1.2).slice(0, 50);
    const PAIRS = [];
    for (let i = 0; i < BRIGHT_STARS.length; i++) {
      for (let j = i + 1; j < BRIGHT_STARS.length; j++) {
        const dx = (BRIGHT_STARS[i].x - BRIGHT_STARS[j].x);
        const dy = (BRIGHT_STARS[i].y - BRIGHT_STARS[j].y);
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 0.12 && PAIRS.length < 40) {
          PAIRS.push([BRIGHT_STARS[i], BRIGHT_STARS[j]]);
        }
      }
    }

    /* ---------- shooting stars ---------- */
    let shooters = [];
    const spawnShooter = () => {
      shooters.push({
        x: Math.random() * 0.8,
        y: Math.random() * 0.4,
        len: Math.random() * 120 + 80,
        speed: Math.random() * 5 + 6,
        angle: Math.PI / 4 + (Math.random() - 0.5) * 0.3,
        life: 1,
        alpha: 1,
      });
    };
    setInterval(spawnShooter, 3200);

    /* ---------- render loop ---------- */
    const draw = (t) => {
      ctx.clearRect(0, 0, W, H);

      /* constellation lines */
      PAIRS.forEach(([a, b]) => {
        const ax = a.x * W, ay = a.y * H;
        const bx = b.x * W, by = b.y * H;
        const grad = ctx.createLinearGradient(ax, ay, bx, by);
        grad.addColorStop(0, 'rgba(200,164,255,0.18)');
        grad.addColorStop(1, 'rgba(122,244,255,0.12)');
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 0.6;
        ctx.stroke();
      });

      /* stars */
      stars.forEach(s => {
        const twinkle = 0.5 + 0.5 * Math.sin(t * s.speed * 1000 + s.phase);
        const alpha = 0.4 + twinkle * 0.6;
        const px = s.x * W, py = s.y * H;

        // glow
        const glow = ctx.createRadialGradient(px, py, 0, px, py, s.r * 4);
        const color = s.sat > 0
          ? `hsla(${s.hue},${s.sat}%,${s.bright}%,`
          : `rgba(255,255,255,`;
        glow.addColorStop(0, color + (alpha * 0.5) + ')');
        glow.addColorStop(1, color + '0)');
        ctx.beginPath();
        ctx.arc(px, py, s.r * 4, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        // core
        ctx.beginPath();
        ctx.arc(px, py, s.r, 0, Math.PI * 2);
        ctx.fillStyle = color + alpha + ')';
        ctx.fill();
      });

      /* shooting stars */
      shooters = shooters.filter(sh => sh.alpha > 0);
      shooters.forEach(sh => {
        sh.x += Math.cos(sh.angle) * sh.speed / W;
        sh.y += Math.sin(sh.angle) * sh.speed / H;
        sh.life -= 0.018;
        sh.alpha = Math.max(0, sh.life);

        const sx = sh.x * W, sy = sh.y * H;
        const ex = sx - Math.cos(sh.angle) * sh.len;
        const ey = sy - Math.sin(sh.angle) * sh.len;

        const grad = ctx.createLinearGradient(ex, ey, sx, sy);
        grad.addColorStop(0, `rgba(255,255,255,0)`);
        grad.addColorStop(0.6, `rgba(200,164,255,${sh.alpha * 0.5})`);
        grad.addColorStop(1, `rgba(255,255,255,${sh.alpha})`);

        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(sx, sy);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });

      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        display: 'block',
      }}
    />
  );
}
