"use client"

import type React from "react"

import Link from "next/link"
import { useState } from "react"

export default function SignInPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Backend auth will be wired later
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-background via-background to-muted">
      {/* background glow */}
      <div className="pointer-events-none absolute inset-x-0 -top-40 -z-10 h-72 bg-[radial-gradient(circle_at_top,_rgba(129,140,248,0.32),_transparent_60%)]" />

      <div
        className="
          w-full max-w-md
          rounded-3xl border border-indigo-100/80
          bg-card/90 backdrop-blur-md
          shadow-[0_22px_70px_rgba(15,23,42,0.2)]
          px-6 py-8 sm:px-8 sm:py-10
          space-y-6
          animate-in fade-in-0 zoom-in-95 duration-500
        "
      >
        {/* Logo and Brand */}
        <div className="flex items-center justify-center gap-2">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-primary-foreground flex items-center justify-center text-sm font-semibold">
            F
          </div>
          <span className="text-sm font-semibold text-foreground">Formyxa</span>
        </div>

        {/* Page Title */}
        <div className="space-y-2 text-center">
          <p className="inline-flex items-center justify-center rounded-full border border-indigo-100 bg-indigo-50/70 px-3 py-1 text-[11px] font-medium text-indigo-700">
            Welcome back
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">
            Sign in to Formyxa
          </h1>
          <p className="text-sm text-muted-foreground">
            Sign in for early access features. No sign-up required to try the editor.
          </p>
        </div>

        {/* Sign In Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field */}
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="text-xs font-semibold text-foreground uppercase tracking-[0.16em]"
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
                mt-1 w-full rounded-xl border border-border bg-input
                px-3.5 py-2.5 text-sm text-foreground
                placeholder:text-muted-foreground
                shadow-[0_1px_2px_rgba(15,23,42,0.04)]
                focus:outline-none
                focus:ring-2 focus:ring-primary/60 focus:border-primary
              "
              required
            />
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="text-xs font-semibold text-foreground uppercase tracking-[0.16em]"
              >
                Password
              </label>
              <Link
                href="#"
                className="text-xs text-primary hover:text-primary/90 transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="
                mt-1 w-full rounded-xl border border-border bg-input
                px-3.5 py-2.5 text-sm text-foreground
                placeholder:text-muted-foreground
                shadow-[0_1px_2px_rgba(15,23,42,0.04)]
                focus:outline-none
                focus:ring-2 focus:ring-primary/60 focus:border-primary
              "
              required
            />
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            className="
              w-full mt-2 rounded-full px-4 py-2
              bg-gradient-to-r from-indigo-500 to-violet-500
              text-sm font-medium text-primary-foreground
              flex items-center justify-center gap-2
              shadow-[0_14px_30px_rgba(99,102,241,0.35)]
              hover:from-indigo-500 hover:to-indigo-600
              disabled:opacity-60 disabled:cursor-not-allowed
              transition-all
            "
          >
            Sign in
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <div className="h-px flex-1 bg-border" />
          <span>or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Google Sign In */}
        <button
          className="
            w-full rounded-full border border-border
            bg-card/80 hover:bg-muted
            text-foreground text-sm
            px-4 py-2.5
            flex items-center justify-center gap-2
            transition-colors
          "
        >
          <div className="w-4 h-4 rounded-[4px] bg-gradient-to-br from-indigo-500 via-emerald-400 to-orange-400" />
          Continue with Google
        </button>

        {/* Sign Up Link */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="text-primary hover:text-primary/90 font-medium transition-colors"
            >
              Get started free
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
