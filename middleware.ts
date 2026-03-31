// middleware.ts

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const hasVisited = request.cookies.get("hasVisited")

  if (!hasVisited && request.nextUrl.pathname === "/") {
    return NextResponse.redirect(new URL("/choose", request.url))
  }

  return NextResponse.next()
}
