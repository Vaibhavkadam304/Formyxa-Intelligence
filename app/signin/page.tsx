"use client"

import type React from "react"
import Link from "next/link"
import { useState } from "react"

export default function SignInPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [focused, setFocused] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
  }

  return (
    <main
      className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #0a0a12 0%, #0f0f1e 50%, #0d0a1a 100%)",
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&family=Sora:wght@300;400;500;600;700&display=swap');

        * { box-sizing: border-box; }

        .glow-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
        }

        .card-glass {
          background: linear-gradient(145deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.02) 100%);
          border: 1px solid rgba(139, 120, 255, 0.18);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
        }

        .input-field {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(139,120,255,0.2);
          border-radius: 14px;
          padding: 12px 16px;
          color: #f0eeff;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          outline: none;
          transition: all 0.2s ease;
        }

        .input-field::placeholder {
          color: rgba(160,150,210,0.45);
        }

        .input-field:focus {
          border-color: rgba(139,120,255,0.6);
          background: rgba(139,120,255,0.08);
          box-shadow: 0 0 0 3px rgba(139,120,255,0.12), 0 1px 2px rgba(0,0,0,0.3);
        }

        .btn-primary {
          width: 100%;
          padding: 13px 24px;
          border-radius: 100px;
          border: none;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 600;
          color: #fff;
          background: linear-gradient(135deg, #6d5bff 0%, #8b5cf6 50%, #a855f7 100%);
          box-shadow: 0 8px 32px rgba(109,91,255,0.45), 0 1px 0 rgba(255,255,255,0.1) inset;
          transition: all 0.2s ease;
          letter-spacing: 0.01em;
        }

        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 14px 40px rgba(109,91,255,0.55), 0 1px 0 rgba(255,255,255,0.12) inset;
        }

        .btn-primary:active {
          transform: translateY(0);
        }

        .btn-google {
          width: 100%;
          padding: 12px 24px;
          border-radius: 100px;
          border: 1px solid rgba(139,120,255,0.2);
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 500;
          color: rgba(220,215,255,0.85);
          background: rgba(255,255,255,0.04);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: all 0.2s ease;
        }

        .btn-google:hover {
          background: rgba(255,255,255,0.07);
          border-color: rgba(139,120,255,0.35);
        }

        .label-text {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(180,170,230,0.7);
          margin-bottom: 8px;
          display: block;
        }

        .divider-line {
          flex: 1;
          height: 1px;
          background: linear-gradient(to right, transparent, rgba(139,120,255,0.2), transparent);
        }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(109,91,255,0.15);
          border: 1px solid rgba(139,120,255,0.25);
          border-radius: 100px;
          padding: 4px 12px;
          font-size: 11px;
          font-weight: 500;
          color: rgba(180,165,255,0.9);
          letter-spacing: 0.02em;
        }

        .badge-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #8b78ff;
          box-shadow: 0 0 6px rgba(139,120,255,0.8);
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .animate-card {
          animation: fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) both;
        }

        .noise-overlay {
          position: fixed;
          inset: 0;
          opacity: 0.025;
          pointer-events: none;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
          background-size: 128px;
          z-index: 0;
        }
      `}</style>

      {/* Noise texture */}
      <div className="noise-overlay" />

      {/* Ambient glow orbs */}
      <div className="glow-orb" style={{ width: 500, height: 500, top: -120, left: -80, background: "rgba(100,80,255,0.18)" }} />
      <div className="glow-orb" style={{ width: 400, height: 400, bottom: -100, right: -60, background: "rgba(168,85,247,0.14)" }} />
      <div className="glow-orb" style={{ width: 250, height: 250, top: "40%", left: "60%", background: "rgba(59,130,246,0.08)" }} />

      {/* Card */}
      <div
        className="card-glass animate-card"
        style={{
          width: "100%",
          maxWidth: 420,
          borderRadius: 28,
          padding: "36px 36px 32px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 24 }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "linear-gradient(135deg, #6d5bff, #a855f7)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 15, fontWeight: 700, color: "#fff",
            fontFamily: "'Sora', sans-serif",
            boxShadow: "0 4px 16px rgba(109,91,255,0.5)",
          }}>F</div>
          <span style={{ fontFamily: "'Sora', sans-serif", fontSize: 15, fontWeight: 600, color: "#e8e4ff", letterSpacing: "-0.01em" }}>
            Formyxa
          </span>
        </div>

        {/* Heading */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
            <span className="badge">
              <span className="badge-dot" />
              Welcome back
            </span>
          </div>
          <h1 style={{
            fontFamily: "'Sora', sans-serif",
            fontSize: 26, fontWeight: 700,
            color: "#eeeaff",
            margin: "0 0 8px",
            letterSpacing: "-0.03em",
            lineHeight: 1.2,
          }}>
            Sign in to Formyxa
          </h1>
          <p style={{ fontSize: 13, color: "rgba(170,160,220,0.7)", margin: 0, lineHeight: 1.6 }}>
            Sign in for early access features.{" "}
            <span style={{ color: "rgba(170,160,220,0.5)" }}>No sign-up required to try the editor.</span>
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label htmlFor="email" className="label-text">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="input-field"
              required
            />
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <label htmlFor="password" className="label-text" style={{ margin: 0 }}>Password</label>
              <Link href="#" style={{ fontSize: 12, color: "rgba(139,120,255,0.85)", textDecoration: "none", fontWeight: 500 }}>
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input-field"
              required
            />
          </div>

          <div style={{ marginTop: 4 }}>
            <button type="submit" className="btn-primary">
              Sign in
            </button>
          </div>
        </form>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
          <div className="divider-line" />
          <span style={{ fontSize: 11, color: "rgba(140,130,190,0.5)", fontWeight: 500, letterSpacing: "0.06em" }}>OR</span>
          <div className="divider-line" />
        </div>

        {/* Google */}
        <button className="btn-google">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        {/* Sign up */}
        <p style={{ textAlign: "center", fontSize: 12, color: "rgba(150,140,200,0.55)", marginTop: 20, marginBottom: 0 }}>
          Don't have an account?{" "}
          <Link href="/signup" style={{ color: "rgba(139,120,255,0.9)", fontWeight: 600, textDecoration: "none" }}>
            Get started free
          </Link>
        </p>
      </div>
    </main>
  )
}