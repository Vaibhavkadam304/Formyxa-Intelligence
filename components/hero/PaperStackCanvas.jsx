"use client";

import { useEffect, useRef } from "react";

const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const lerp = (a, b, t) => a + (b - a) * t;

export default function PaperStackCanvas({
  className = "",
  density = 5, // 3–6 looks best
}) {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  const pointerRef = useRef({
    x: 0.5,
    y: 0.5,
    tx: 0.5,
    ty: 0.5,
    active: false,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let mounted = true;

    const state = {
      t: 0,
      w: 0,
      h: 0,
      dpr: 1,
      paused: false,
    };

    // Sheets
    const sheets = [];

    function rand(min, max) {
      return min + Math.random() * (max - min);
    }

    function makeSheets() {
      sheets.length = 0;

      // place the stack towards the right (behind mockup)
      // but still looks nice behind hero text too
      const baseX = 0.68;
      const baseY = 0.46;

      for (let i = 0; i < density; i++) {
        const z = i / Math.max(1, density - 1); // 0..1 depth
        sheets.push({
          id: i,
          z,
          // paper size varies slightly
          w: rand(260, 340),
          h: rand(170, 220),
          // position around base
          x: baseX + rand(-0.06, 0.05),
          y: baseY + rand(-0.08, 0.08),
          // rotation base
          r: rand(-0.12, 0.12),
          // float speed
          s: rand(0.6, 1.2),
          // offset phase
          p: rand(0, Math.PI * 2),

          // “UI details”
          hasSelection: Math.random() > 0.45,
          hasComment: Math.random() > 0.55,
          accent: Math.random() > 0.5 ? "indigo" : "violet",
        });
      }

      // sort back-to-front
      sheets.sort((a, b) => a.z - b.z);
    }

    function resize() {
      const parent = canvas.parentElement;
      const cssW = parent ? parent.clientWidth : 1200;
      const cssH = parent ? parent.clientHeight : 520;

      const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      state.dpr = dpr;

      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      canvas.width = Math.floor(cssW * dpr);
      canvas.height = Math.floor(cssH * dpr);

      state.w = canvas.width;
      state.h = canvas.height;

      makeSheets();
    }

    function roundRect(x, y, w, h, r) {
      const rr = Math.min(r, w / 2, h / 2);
      ctx.beginPath();
      ctx.moveTo(x + rr, y);
      ctx.arcTo(x + w, y, x + w, y + h, rr);
      ctx.arcTo(x + w, y + h, x, y + h, rr);
      ctx.arcTo(x, y + h, x, y, rr);
      ctx.arcTo(x, y, x + w, y, rr);
      ctx.closePath();
    }

    function drawPaperDetails(px, py, pw, ph, seed, accent, pop, alpha) {
      // header line
      ctx.save();
      ctx.globalAlpha = alpha;

      const line = (y, w, a) => {
        ctx.globalAlpha = alpha * a;
        ctx.beginPath();
        ctx.moveTo(px + 18 * state.dpr, y);
        ctx.lineTo(px + 18 * state.dpr + w, y);
        ctx.stroke();
      };

      ctx.strokeStyle = "rgba(15, 23, 42, 0.14)";
      ctx.lineWidth = 1 * state.dpr;
      line(py + 26 * state.dpr, pw * 0.38, 0.75);

      // paragraph lines
      ctx.strokeStyle = "rgba(15, 23, 42, 0.10)";
      for (let i = 0; i < 6; i++) {
        const yy = py + (52 + i * 18) * state.dpr;
        const ww = pw * (0.65 - i * 0.04) * (0.85 + (seed % 7) * 0.02);
        line(yy, ww, 0.65);
      }

      // selection highlight
      const indigo = "rgba(99,102,241,0.18)";
      const violet = "rgba(139,92,246,0.18)";
      if (Math.random() > 0.2) {
        ctx.globalAlpha = alpha * 0.9;
        ctx.fillStyle = accent === "indigo" ? indigo : violet;
        const sx = px + 22 * state.dpr;
        const sy = py + (92 + (seed % 3) * 18) * state.dpr;
        const sw = pw * 0.46;
        const sh = 10 * state.dpr;
        roundRect(sx, sy, sw, sh, 6 * state.dpr);
        ctx.fill();
      }

      // comment bubble
      if (seed % 2 === 0) {
        ctx.globalAlpha = alpha * 0.95;
        const bx = px + pw - 62 * state.dpr;
        const by = py + 22 * state.dpr;
        roundRect(bx, by, 44 * state.dpr, 20 * state.dpr, 10 * state.dpr);
        ctx.fillStyle =
          accent === "indigo"
            ? "rgba(99,102,241,0.14)"
            : "rgba(139,92,246,0.14)";
        ctx.fill();

        // little dot(s)
        ctx.fillStyle =
          accent === "indigo"
            ? "rgba(99,102,241,0.55)"
            : "rgba(139,92,246,0.55)";
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.arc(
            bx + (14 + i * 10) * state.dpr,
            by + 10 * state.dpr,
            1.6 * state.dpr,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
      }

      // gentle “shine” pass
      ctx.globalAlpha = alpha * 0.15 * pop;
      const grad = ctx.createLinearGradient(px, py, px + pw, py);
      grad.addColorStop(0, "rgba(255,255,255,0)");
      grad.addColorStop(0.5, "rgba(255,255,255,0.8)");
      grad.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = grad;
      roundRect(px + 6 * state.dpr, py + 6 * state.dpr, pw - 12 * state.dpr, 26 * state.dpr, 14 * state.dpr);
      ctx.fill();

      ctx.restore();
    }

    function drawSheet(sheet, parX, parY) {
      // depth parallax factor (front moves more)
      const depth = lerp(0.35, 1.0, 1 - sheet.z);

      // float
      const floatY = Math.sin(state.t * 0.012 * sheet.s + sheet.p) * (10 * state.dpr);
      const floatX = Math.cos(state.t * 0.010 * sheet.s + sheet.p) * (6 * state.dpr);

      // base position in pixels
      const cx = sheet.x * state.w + (parX * 34 * state.dpr) * depth + floatX;
      const cy = sheet.y * state.h + (parY * 26 * state.dpr) * depth + floatY;

      const w = sheet.w * state.dpr;
      const h = sheet.h * state.dpr;

      const rot = sheet.r + parX * 0.10 * depth + Math.sin(state.t * 0.007 + sheet.p) * 0.02;

      // “pop” shine occasionally
      const pop = 0.5 + 0.5 * Math.sin(state.t * 0.01 + sheet.p * 2);

      // fade edges so it blends as a background
      const alpha = 0.42 - sheet.z * 0.16; // back papers lighter
      const borderAlpha = 0.12 - sheet.z * 0.05;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rot);

      // shadow (small, not blurry fog)
      ctx.globalAlpha = alpha * 0.55;
      ctx.fillStyle = "rgba(15, 23, 42, 0.08)";
      roundRect(-w / 2 + 3 * state.dpr, -h / 2 + 6 * state.dpr, w, h, 20 * state.dpr);
      ctx.fill();

      // paper
      ctx.globalAlpha = alpha;
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      roundRect(-w / 2, -h / 2, w, h, 20 * state.dpr);
      ctx.fill();

      // border (crisp)
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = `rgba(15,23,42,${borderAlpha})`;
      ctx.lineWidth = 1 * state.dpr;
      ctx.stroke();

      // inner “content”
      drawPaperDetails(-w / 2, -h / 2, w, h, sheet.id + 3, sheet.accent, pop, alpha);

      ctx.restore();
    }

    function clear() {
      ctx.clearRect(0, 0, state.w, state.h);

      // subtle radial fade (not blur): keeps attention on text
      const g = ctx.createRadialGradient(
        state.w * 0.18,
        state.h * 0.45,
        60 * state.dpr,
        state.w * 0.55,
        state.h * 0.45,
        state.w * 0.75
      );
      g.addColorStop(0, "rgba(255,255,255,0)");
      g.addColorStop(1, "rgba(255,255,255,0.65)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, state.w, state.h);
    }

    function frame() {
      if (!mounted) return;

      state.t += 1;

      // smooth pointer
      const p = pointerRef.current;
      p.x = lerp(p.x, p.tx, 0.08);
      p.y = lerp(p.y, p.ty, 0.08);

      const parX = (p.x - 0.5) * 2; // -1..1
      const parY = (p.y - 0.5) * 2;

      ctx.clearRect(0, 0, state.w, state.h);

      // draw papers back-to-front
      for (const s of sheets) {
        drawSheet(s, parX, parY);
      }

      // gentle fade overlay so background never fights text
      clear();

      rafRef.current = requestAnimationFrame(frame);
    }

    function onMove(e) {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      pointerRef.current.tx = clamp(x, 0, 1);
      pointerRef.current.ty = clamp(y, 0, 1);
      pointerRef.current.active = true;
    }

    function onLeave() {
      pointerRef.current.active = false;
      pointerRef.current.tx = 0.5;
      pointerRef.current.ty = 0.5;
    }

    function onVis() {
      state.paused = document.visibilityState !== "visible";
      if (!state.paused) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(frame);
      }
    }

    const tick = () => {
      if (!mounted) return;
      if (state.paused) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      frame();
    };

    resize();
    rafRef.current = requestAnimationFrame(tick);

    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);

    return () => {
      mounted = false;
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
    };
  }, [density]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden="true"
    />
  );
}
