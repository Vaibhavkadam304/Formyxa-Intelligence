"use client";

import { useEffect, useRef } from "react";

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

export default function FormyxaCanvasDemo({
  className = "",
  height = 260, // you can override
}) {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  const pointerRef = useRef({ x: 0.5, y: 0.5, active: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let mounted = true;

    // Scene config
    const state = {
      t: 0,
      w: 0,
      h: 0,
      dpr: 1,
      scanX: 0,
      pause: false,
    };

    // Build pseudo “text blocks”
    // left: messy rows, right: formatted rows
    const blocks = [];

    const rand = (min, max) => min + Math.random() * (max - min);

    function buildBlocks() {
      blocks.length = 0;

      const padding = 18;
      const midGap = 18;

      const leftX = padding;
      const rightX = Math.floor(state.w * 0.52) + midGap;

      const leftW = Math.floor(state.w * 0.46) - padding;
      const rightW = state.w - rightX - padding;

      // Header rows
      blocks.push({
        side: "left",
        x: leftX,
        y: 34,
        w: Math.min(leftW, 160),
        h: 10,
        messy: true,
        key: "left-title",
      });
      blocks.push({
        side: "right",
        x: rightX,
        y: 34,
        w: Math.min(rightW, 190),
        h: 10,
        messy: false,
        key: "right-title",
      });

      // Paragraph-ish lines
      let y = 62;
      for (let i = 0; i < 9; i++) {
        const h = i % 3 === 0 ? 10 : 8;
        const lw = clamp(leftW * rand(0.55, 0.95), 80, leftW);
        const rw = clamp(rightW * rand(0.55, 0.98), 90, rightW);

        blocks.push({
          side: "left",
          x: leftX,
          y,
          w: lw,
          h,
          messy: true,
          key: `l-${i}`,
        });

        blocks.push({
          side: "right",
          x: rightX,
          y,
          w: rw,
          h,
          messy: false,
          key: `r-${i}`,
        });

        y += 18;
      }

      // Bullet rows on right
      let by = y + 6;
      for (let i = 0; i < 3; i++) {
        blocks.push({
          side: "right",
          x: rightX + 16,
          y: by,
          w: clamp(rightW * rand(0.55, 0.85), 120, rightW - 16),
          h: 8,
          messy: false,
          bullet: true,
          key: `rb-${i}`,
        });
        by += 16;
      }
    }

    function resize() {
      const parent = canvas.parentElement;
      const cssW = parent ? parent.clientWidth : 520;
      const cssH = height;

      const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      state.dpr = dpr;

      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;

      canvas.width = Math.floor(cssW * dpr);
      canvas.height = Math.floor(cssH * dpr);

      state.w = Math.floor(cssW * dpr);
      state.h = Math.floor(cssH * dpr);

      buildBlocks();
    }

    function roundedRect(x, y, w, h, r) {
      const rr = Math.min(r, w / 2, h / 2);
      ctx.beginPath();
      ctx.moveTo(x + rr, y);
      ctx.arcTo(x + w, y, x + w, y + h, rr);
      ctx.arcTo(x + w, y + h, x, y + h, rr);
      ctx.arcTo(x, y + h, x, y, rr);
      ctx.arcTo(x, y, x + w, y, rr);
      ctx.closePath();
    }

    function drawBackground() {
      ctx.clearRect(0, 0, state.w, state.h);

      // Subtle card-like surface (no blur)
      const pad = 10 * state.dpr;
      const r = 18 * state.dpr;

      ctx.save();
      ctx.globalAlpha = 1;

      // Card
      roundedRect(pad, pad, state.w - pad * 2, state.h - pad * 2, r);
      ctx.fillStyle = "rgba(255,255,255,1)";
      ctx.fill();

      // Crisp border
      ctx.strokeStyle = "rgba(15,23,42,0.08)";
      ctx.lineWidth = 1 * state.dpr;
      ctx.stroke();

      // Divider line
      const dividerX = Math.floor(state.w * 0.5);
      ctx.beginPath();
      ctx.moveTo(dividerX, pad + 18 * state.dpr);
      ctx.lineTo(dividerX, state.h - pad - 18 * state.dpr);
      ctx.strokeStyle = "rgba(15,23,42,0.06)";
      ctx.stroke();

      // Tiny labels
      ctx.fillStyle = "rgba(100,116,139,0.85)";
      ctx.font = `${11 * state.dpr}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto`;
      ctx.fillText("Your input", 24 * state.dpr, 26 * state.dpr);
      ctx.fillText("After · formatted", dividerX + 16 * state.dpr, 26 * state.dpr);

      ctx.restore();
    }

    function drawBlock(b, scanX) {
      const reveal = b.side === "right" ? 1 : 0; // right is “clean”
      const x = b.x * state.dpr;
      const y = b.y * state.dpr;
      const w = b.w * state.dpr;
      const h = b.h * state.dpr;

      // How far scanline has reached this x
      const progress = clamp((scanX - x) / (state.w * 0.08), 0, 1);

      // Left side transitions from messy->clean after scan passes
      // Right side is already clean but “brightens” when scan passes
      const k = b.side === "left" ? progress : progress * 0.6;

      // Colors (kept neutral + slight indigo accent)
      const messyFill = "rgba(148,163,184,0.35)";
      const cleanFill = "rgba(99,102,241,0.12)";
      const cleanStroke = "rgba(99,102,241,0.18)";
      const neutralFill = "rgba(148,163,184,0.20)";

      const fill =
        b.side === "left"
          ? `rgba(148,163,184,${0.30 - 0.16 * k})` // fades a bit
          : `rgba(99,102,241,${0.10 + 0.04 * k})`;

      // Base rect
      roundedRect(x, y, w, h, 7 * state.dpr);
      ctx.fillStyle = b.side === "left" ? messyFill : cleanFill;
      ctx.fill();

      // Overlay “reformat” effect
      roundedRect(x, y, w, h, 7 * state.dpr);
      ctx.fillStyle = fill;
      ctx.fill();

      // Slight stroke for right blocks
      if (b.side === "right") {
        ctx.strokeStyle = cleanStroke;
        ctx.lineWidth = 1 * state.dpr;
        ctx.stroke();
      }

      // Messy jitter lines on left (pre-scan)
      if (b.side === "left") {
        const pre = 1 - progress;
        if (pre > 0.05) {
          ctx.save();
          ctx.globalAlpha = 0.5 * pre;
          ctx.strokeStyle = "rgba(100,116,139,0.35)";
          ctx.lineWidth = 1 * state.dpr;
          const lines = 2;
          for (let i = 0; i < lines; i++) {
            const yy = y + (h * (i + 1)) / (lines + 1);
            ctx.beginPath();
            ctx.moveTo(x + 6 * state.dpr, yy + rand(-1, 1) * state.dpr);
            ctx.lineTo(
              x + w - 6 * state.dpr,
              yy + rand(-1, 1) * state.dpr
            );
            ctx.stroke();
          }
          ctx.restore();
        }
      }

      // Bullet dot
      if (b.bullet) {
        ctx.beginPath();
        ctx.arc(
          (x - 10 * state.dpr),
          y + h / 2,
          2.2 * state.dpr,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = "rgba(99,102,241,0.55)";
        ctx.fill();
      }
    }

    function drawScanline(scanX) {
      // Scan glow band (no big blur)
      const bandW = state.w * 0.07;
      const x0 = scanX - bandW / 2;

      ctx.save();

      // Thin core line
      ctx.beginPath();
      ctx.moveTo(scanX, 26 * state.dpr);
      ctx.lineTo(scanX, state.h - 26 * state.dpr);
      ctx.strokeStyle = "rgba(99,102,241,0.35)";
      ctx.lineWidth = 1.25 * state.dpr;
      ctx.stroke();

      // Gradient band
      const grad = ctx.createLinearGradient(x0, 0, x0 + bandW, 0);
      grad.addColorStop(0, "rgba(99,102,241,0)");
      grad.addColorStop(0.5, "rgba(99,102,241,0.18)");
      grad.addColorStop(1, "rgba(99,102,241,0)");

      ctx.fillStyle = grad;
      ctx.fillRect(x0, 18 * state.dpr, bandW, state.h - 36 * state.dpr);

      ctx.restore();
    }

    function drawSparkles(scanX) {
      // Tiny sparkles near scanline; keep it subtle
      const p = pointerRef.current;
      const focusX = scanX + (p.active ? (p.x - 0.5) * state.w * 0.06 : 0);
      const focusY = state.h * (0.45 + (p.active ? (p.y - 0.5) * 0.2 : 0));

      ctx.save();
      ctx.globalAlpha = 0.9;

      for (let i = 0; i < 6; i++) {
        const a = (state.t * 0.02 + i) % 1;
        const r = (1.2 + i * 0.15) * state.dpr;
        const x = focusX + Math.cos(i * 1.7 + state.t * 0.01) * 22 * state.dpr;
        const y = focusY + Math.sin(i * 1.3 + state.t * 0.012) * 14 * state.dpr;

        ctx.beginPath();
        ctx.arc(x, y, r + a * 0.6 * state.dpr, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(99,102,241,0.22)";
        ctx.fill();
      }

      ctx.restore();
    }

    function frame() {
      if (!mounted) return;
      if (state.pause) {
        rafRef.current = requestAnimationFrame(frame);
        return;
      }

      state.t += 1;

      // Scanline moves left -> right, loops
      const speed = 2.2 * state.dpr;
      state.scanX += speed;

      const leftBound = 18 * state.dpr;
      const rightBound = state.w - 18 * state.dpr;

      if (state.scanX < leftBound) state.scanX = leftBound;
      if (state.scanX > rightBound) state.scanX = leftBound;

      drawBackground();

      // Draw blocks
      for (const b of blocks) drawBlock(b, state.scanX);

      drawScanline(state.scanX);
      drawSparkles(state.scanX);

      rafRef.current = requestAnimationFrame(frame);
    }

    // Pointer interaction (subtle)
    function onMove(e) {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      pointerRef.current = { x: clamp(x, 0, 1), y: clamp(y, 0, 1), active: true };
    }
    function onLeave() {
      pointerRef.current.active = false;
    }

    // Pause when tab hidden
    function onVis() {
      state.pause = document.visibilityState !== "visible";
    }

    resize();
    state.scanX = 18 * state.dpr;

    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVis);
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseleave", onLeave);

    rafRef.current = requestAnimationFrame(frame);

    return () => {
      mounted = false;
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVis);
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(rafRef.current);
    };
  }, [height]);

  return (
    <div className={className}>
      <canvas ref={canvasRef} className="block w-full" />
    </div>
  );
}
