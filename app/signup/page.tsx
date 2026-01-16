"use client"

import React, { useState } from "react"
import Link from "next/link"

export default function SignUpPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: hook up to your auth backend later
  }

  return (
    <main
      className="
        min-h-screen
        bg-[radial-gradient(circle_at_top,_rgba(129,140,248,0.18),_transparent_60%)]
        from-white to-slate-50
        flex items-center justify-center
        px-4
      "
    >
      <div className="mx-auto grid w-full max-w-5xl gap-10 lg:grid-cols-[1.1fr_minmax(0,1fr)] items-center">
        {/* LEFT: Why Formatly / Formyxa */}
        <section className="hidden lg:flex flex-col gap-6 pr-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500 text-xs font-semibold text-white">
              F
            </div>
            <span className="text-sm font-semibold text-slate-800">
              Formyxa
            </span>
          </div>

          <div className="space-y-3">
            <p className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-indigo-700">
              New here? · Create your account
            </p>

            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              Sign up once, reuse letters for every visa, refund & dispute.
            </h1>

            <p className="text-sm text-slate-600 max-w-md">
              Save your best letters as templates, duplicate them for similar
              cases, and export clean DOCX any time you need a fresh copy.
            </p>
          </div>

          {/* Tiny editor mockup */}
          <div
            className="
              relative mt-2 rounded-3xl border border-indigo-100 bg-white/80
              shadow-[0_18px_60px_rgba(15,23,42,0.18)] backdrop-blur-sm
              p-4 max-w-md
            "
          >
            <div className="mb-3 flex items-center justify-between text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Formyxa editor
              </span>
              <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-600">
                Export as DOCX
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-[10px] leading-snug">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 text-slate-500">
                <p className="mb-1 text-[10px] font-semibold text-slate-600">
                  Raw story
                </p>
                <p className="line-clamp-4">
                  I booked a 12-month gym membership but the gym closed after 2
                  months. I&apos;d like to request a full refund…
                </p>
              </div>
              <div className="rounded-2xl border border-indigo-100 bg-gradient-to-b from-indigo-50 to-violet-50 p-3 text-slate-700">
                <p className="mb-1 text-[10px] font-semibold">
                  Refund request letter
                </p>
                <p className="line-clamp-4">
                  I am writing to request a refund of the membership fees
                  paid… The gym ceased operations after only two months…
                </p>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500">
              <span className="inline-flex items-center gap-1">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-[11px] font-semibold text-white">
                  AI
                </span>
                Auto-structured with the right tone &amp; format.
              </span>
              <span className="font-medium text-indigo-600">
                1 click → ready to send
              </span>
            </div>
          </div>

          {/* bullets */}
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            <li>✅ Save unlimited letters in one place</li>
            <li>✅ Duplicate for similar visa or refund cases</li>
            <li>✅ Export to DOCX whenever you need a copy</li>
          </ul>
        </section>

        {/* RIGHT: Sign up card */}
        <section
          className="
            relative
            rounded-3xl border border-slate-100 bg-white/90
            shadow-[0_22px_70px_rgba(15,23,42,0.18)]
            px-6 py-8 sm:px-8 sm:py-10
            backdrop-blur-md
          "
        >
          {/* small glow behind card on mobile */}
          <div className="pointer-events-none absolute inset-x-10 -top-6 h-10 bg-[radial-gradient(circle,_rgba(129,140,248,0.28),_transparent_60%)]" />

          {/* brand chip */}
          <div className="mb-4 flex items-center justify-center gap-2 sm:justify-start">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500 text-xs font-semibold text-white">
              F
            </div>
            <span className="text-sm font-semibold text-slate-800">
              Formyxa
            </span>
          </div>

          <div className="space-y-2 text-center sm:text-left">
            <p className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-medium text-indigo-700">
              Create your Formatly account
            </p>
            <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">
              Sign up in under a minute.
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Access your saved letters, templates and DOCX exports from any
              device.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
              <label
                htmlFor="name"
                className="text-xs font-medium text-slate-700"
              >
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="
                  mt-1 w-full rounded-lg border border-slate-200 bg-slate-50/80
                  px-3 py-2 text-sm text-slate-900
                  placeholder:text-slate-400
                  focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                "
                required
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-xs font-medium text-slate-700"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="
                  mt-1 w-full rounded-lg border border-slate-200 bg-slate-50/80
                  px-3 py-2 text-sm text-slate-900
                  placeholder:text-slate-400
                  focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                "
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="text-xs font-medium text-slate-700"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="
                  mt-1 w-full rounded-lg border border-slate-200 bg-slate-50/80
                  px-3 py-2 text-sm text-slate-900
                  placeholder:text-slate-400
                  focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                "
                required
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="
                mt-2 w-full rounded-lg
                bg-gradient-to-r from-indigo-500 to-violet-500
                px-4 py-2.5 text-sm font-medium text-white
                shadow-[0_16px_38px_rgba(99,102,241,0.45)]
                hover:from-indigo-500 hover:to-indigo-600
                transition-colors
              "
            >
              Create account
            </button>
          </form>

          {/* OR divider */}
          <div className="mt-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-100" />
            <span className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
              or
            </span>
            <div className="h-px flex-1 bg-slate-100" />
          </div>

          {/* Google button */}
          <button
            type="button"
            className="
              mt-4 w-full rounded-lg border border-slate-200
              bg-white px-4 py-2.5 text-sm
              text-slate-700 shadow-sm
              hover:bg-slate-50 transition-colors
              flex items-center justify-center gap-2
            "
          >
            <div className="h-4 w-4 rounded-sm bg-slate-300" />
            Continue with Google
          </button>

          {/* Already have account */}
          <p className="mt-4 text-center text-xs text-slate-500">
            Already have an account?{" "}
            <Link
              href="/signin"
              className="font-medium text-indigo-600 hover:text-indigo-700"
            >
              Sign in
            </Link>
          </p>
        </section>
      </div>
    </main>
  )
}
