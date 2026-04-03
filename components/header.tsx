"use client"

import Link from "next/link"
import ThemeToggle from "@/components/theme-toggle"

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 pt-4">
      <div className="mx-auto max-w-6xl">
        <nav
          className="
            flex items-center justify-between
            rounded-xl px-6 py-2
            bg-card/95
            backdrop-blur-md
            border border-border
          "
        >
          {/* Logo & Brand — still goes to / which redirects to /choose */}
          <Link href="/" className="flex items-center gap-2">
            <div
              className="
                flex h-8 w-8 items-center justify-center
                rounded-lg
                bg-primary
                text-primary-foreground
                text-sm font-semibold
                shadow-sm
              "
            >
              F
            </div>
            <span className="text-sm font-semibold text-foreground">
              Formyxa
            </span>
          </Link>

          {/* Center Navigation */}
          <div className="hidden md:flex items-center gap-5">
            {/* Home now points to /home */}
            <Link
              href="/home"
              className="
                relative text-sm font-semibold text-foreground
                after:absolute after:left-0 after:-bottom-1
                after:h-[2px] after:w-full
                after:bg-primary
                after:rounded-full
              "
            >
              Home
            </Link>

            {[
              ["#features", "Features"],
              ["#how-it-works", "How it works"],
              ["#pricing", "Pricing"],
            ].map(([href, label]) => (
              <Link
                key={label}
                href={href}
                className="
                  text-sm
                  text-muted-foreground
                  hover:text-foreground
                  transition-colors
                "
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <ThemeToggle />

            {/* Primary CTA */}
            <Link
              href="/templates/anti-scope-creep-sow"
              className="
                inline-flex items-center justify-center
                rounded-lg px-4 py-2
                text-sm font-medium
                bg-primary
                text-primary-foreground
                shadow-sm
                hover:bg-primary/90
                transition-colors
              "
            >
              Try the demo
            </Link>
            <Link
              href="/signin"
              className="
                text-sm
                text-foreground
                hover:text-foreground/80
                transition-colors
              "
            >
              Sign in
            </Link>
          </div>
        </nav>
      </div>
    </header>
  )
}