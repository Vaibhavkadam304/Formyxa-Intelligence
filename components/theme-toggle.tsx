"use client"

import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const [theme, setTheme] = useState<"light" | "dark">("light")

  useEffect(() => {
    setMounted(true)

    const saved = localStorage.getItem("theme") as "light" | "dark" | null

    if (saved) {
      setTheme(saved)
      document.documentElement.classList.toggle("dark", saved === "dark")
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      if (prefersDark) {
        setTheme("dark")
        document.documentElement.classList.add("dark")
      }
    }
  }, [])

  const toggle = () => {
    const next = theme === "light" ? "dark" : "light"
    setTheme(next)
    document.documentElement.classList.toggle("dark", next === "dark")
    localStorage.setItem("theme", next)
  }

  if (!mounted) return null

  return (
    <button
      onClick={toggle}
      className="
        p-2 rounded-lg
        text-muted-foreground
        hover:text-foreground
        hover:bg-accent
        transition-colors
      "
      aria-label="Toggle theme"
    >
      {theme === "light" ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Sun className="h-4 w-4" />
      )}
    </button>
  )
}
