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
    <main className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="bg-card text-card-foreground rounded-2xl shadow-lg border border-border max-w-md w-full p-8 space-y-6">
        {/* Logo and Brand */}
        <div className="flex items-center justify-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
            F
          </div>
          <span className="text-sm font-semibold text-foreground">Formatly</span>
        </div>

        {/* Page Title */}
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-foreground">Sign in to Formatly</h1>
          <p className="text-sm text-muted-foreground">
            Access your saved documents and keep formatting where you left off.
          </p>
        </div>

        {/* Sign In Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field */}
          <div className="space-y-1">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>

          {/* Password Field */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
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
              className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            className="w-full mt-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-lg px-4 py-2 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            Sign in
          </button>
        </form>

        {/* Google Sign In */}
        <button className="w-full border border-border bg-card hover:bg-muted text-foreground text-sm rounded-lg px-4 py-2 flex items-center justify-center gap-2 transition-colors">
          <div className="w-4 h-4 rounded-full bg-muted-foreground/60" />
          Continue with Google
        </button>

        {/* Sign Up Link */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/new"
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
