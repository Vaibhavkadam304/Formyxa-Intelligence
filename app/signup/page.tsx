"use client"

import React, { useState } from "react"
import Link from "next/link"

export default function SignUpPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0a0a12 0%, #0f0f1e 50%, #0d0a1a 100%)",
        fontFamily: "'DM Sans', system-ui, sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 16px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&family=Sora:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; }

        .glow-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(90px);
          pointer-events: none;
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

        .input-field {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(139,120,255,0.2);
          border-radius: 14px;
          padding: 11px 16px;
          color: #f0eeff;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          outline: none;
          transition: all 0.2s ease;
        }
        .input-field::placeholder { color: rgba(160,150,210,0.45); }
        .input-field:focus {
          border-color: rgba(139,120,255,0.6);
          background: rgba(139,120,255,0.08);
          box-shadow: 0 0 0 3px rgba(139,120,255,0.12), 0 1px 2px rgba(0,0,0,0.3);
        }

        .label-text {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(180,170,230,0.7);
          margin-bottom: 8px;
          display: block;
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
        }
        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 14px 40px rgba(109,91,255,0.55), 0 1px 0 rgba(255,255,255,0.12) inset;
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
          width: 5px; height: 5px;
          border-radius: 50%;
          background: #8b78ff;
          box-shadow: 0 0 6px rgba(139,120,255,0.8);
        }

        .mockup-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(139,120,255,0.15);
          border-radius: 20px;
          padding: 16px;
          backdrop-filter: blur(12px);
        }

        .mockup-pane {
          border-radius: 12px;
          padding: 12px;
          font-size: 10px;
          line-height: 1.5;
        }

        .bullet-item {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          color: rgba(190,180,240,0.75);
        }
        .bullet-check {
          width: 20px; height: 20px;
          border-radius: 50%;
          background: rgba(109,91,255,0.2);
          border: 1px solid rgba(139,120,255,0.3);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          font-size: 10px;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-card { animation: fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) both; }
        .animate-left { animation: fadeUp 0.5s 0.1s cubic-bezier(0.22,1,0.36,1) both; }

        @media (max-width: 900px) {
          .left-panel { display: none !important; }
        }
      `}</style>

      <div className="noise-overlay" />

      {/* Ambient orbs */}
      <div className="glow-orb" style={{ width: 600, height: 600, top: -150, left: -100, background: "rgba(100,80,255,0.15)" }} />
      <div className="glow-orb" style={{ width: 400, height: 400, bottom: -80, right: -60, background: "rgba(168,85,247,0.12)" }} />
      <div className="glow-orb" style={{ width: 200, height: 200, top: "30%", left: "45%", background: "rgba(59,130,246,0.07)" }} />

      <div style={{ width: "100%", maxWidth: 940, display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 40, alignItems: "center", position: "relative", zIndex: 1 }}>

        {/* LEFT PANEL */}
        <div className="animate-left left-panel" style={{ display: "flex", flexDirection: "column", gap: 28, paddingRight: 8 }}>

          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
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
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <span className="badge" style={{ alignSelf: "flex-start" }}>
              <span className="badge-dot" />
              New here · Create your account
            </span>
            <h1 style={{
              fontFamily: "'Sora', sans-serif",
              fontSize: 30, fontWeight: 700,
              color: "#eeeaff", margin: 0,
              lineHeight: 1.25, letterSpacing: "-0.03em",
            }}>
              Sign up once, reuse letters for every visa, refund &amp; dispute.
            </h1>
            <p style={{ fontSize: 13, color: "rgba(170,160,220,0.65)", margin: 0, lineHeight: 1.7, maxWidth: 360 }}>
              Save your best letters as templates, duplicate for similar cases, and export clean DOCX any time.
            </p>
          </div>

          {/* Mockup */}
          <div className="mockup-card">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "rgba(160,150,210,0.6)" }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#34d399", display: "inline-block" }} />
                Formyxa editor
              </span>
              <span style={{
                background: "rgba(109,91,255,0.2)", border: "1px solid rgba(139,120,255,0.3)",
                borderRadius: 100, padding: "2px 10px", fontSize: 10, color: "rgba(180,165,255,0.9)", fontWeight: 500,
              }}>
                Export as DOCX
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div className="mockup-pane" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(160,150,210,0.7)" }}>
                <p style={{ fontSize: 10, fontWeight: 600, color: "rgba(180,170,230,0.8)", marginBottom: 6 }}>Raw story</p>
                <p style={{ margin: 0 }}>I booked a 12-month gym membership but the gym closed after 2 months. I'd like to request a full refund…</p>
              </div>
              <div className="mockup-pane" style={{ background: "linear-gradient(135deg, rgba(109,91,255,0.12), rgba(168,85,247,0.1))", border: "1px solid rgba(139,120,255,0.2)", color: "rgba(210,205,240,0.85)" }}>
                <p style={{ fontSize: 10, fontWeight: 600, color: "rgba(200,185,255,0.95)", marginBottom: 6 }}>Refund request letter</p>
                <p style={{ margin: 0 }}>I am writing to request a refund of the membership fees paid… The gym ceased operations after only two months…</p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12, fontSize: 10 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(150,140,200,0.6)" }}>
                <span style={{
                  display: "inline-flex", width: 18, height: 18,
                  borderRadius: "50%", background: "linear-gradient(135deg,#6d5bff,#a855f7)",
                  alignItems: "center", justifyContent: "center",
                  fontSize: 9, fontWeight: 700, color: "#fff",
                }}>AI</span>
                Auto-structured with the right tone &amp; format.
              </span>
              <span style={{ color: "rgba(139,120,255,0.9)", fontWeight: 600 }}>1 click → ready</span>
            </div>
          </div>

          {/* Bullets */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {["Save unlimited letters in one place", "Duplicate for similar visa or refund cases", "Export to DOCX whenever you need a copy"].map((text) => (
              <div key={text} className="bullet-item">
                <span className="bullet-check">✓</span>
                {text}
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Sign Up Card */}
        <div
          className="animate-card"
          style={{
            background: "linear-gradient(145deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.02) 100%)",
            border: "1px solid rgba(139,120,255,0.18)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            borderRadius: 28,
            padding: "36px 32px 32px",
          }}
        >
          {/* Logo (mobile only via CSS would need extra work, keep for all) */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "linear-gradient(135deg, #6d5bff, #a855f7)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 700, color: "#fff",
              fontFamily: "'Sora', sans-serif",
              boxShadow: "0 4px 12px rgba(109,91,255,0.45)",
            }}>F</div>
            <span style={{ fontFamily: "'Sora', sans-serif", fontSize: 14, fontWeight: 600, color: "#e8e4ff" }}>Formyxa</span>
          </div>

          <div style={{ marginBottom: 24 }}>
            <span className="badge" style={{ marginBottom: 12, display: "inline-flex" }}>
              <span className="badge-dot" />
              Create your account
            </span>
            <h2 style={{
              fontFamily: "'Sora', sans-serif",
              fontSize: 22, fontWeight: 700,
              color: "#eeeaff", margin: "10px 0 6px",
              letterSpacing: "-0.025em",
            }}>
              Sign up in under a minute.
            </h2>
            <p style={{ fontSize: 13, color: "rgba(160,150,210,0.65)", margin: 0, lineHeight: 1.6 }}>
              Access your saved letters, templates and DOCX exports from any device.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label htmlFor="name" className="label-text">Name</label>
              <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="input-field" required />
            </div>
            <div>
              <label htmlFor="email" className="label-text">Email</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="input-field" required />
            </div>
            <div>
              <label htmlFor="password" className="label-text">Password</label>
              <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="input-field" required />
            </div>
            <div style={{ marginTop: 4 }}>
              <button type="submit" className="btn-primary">Create account</button>
            </div>
          </form>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "18px 0" }}>
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

          <p style={{ textAlign: "center", fontSize: 12, color: "rgba(150,140,200,0.55)", marginTop: 18, marginBottom: 0 }}>
            Already have an account?{" "}
            <Link href="/signin" style={{ color: "rgba(139,120,255,0.9)", fontWeight: 600, textDecoration: "none" }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}