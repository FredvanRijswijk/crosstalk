import { NextRequest, NextResponse } from "next/server"

const WINDOW_MS = 60_000
const MAX_REQUESTS = 30

const hits = new Map<string, number[]>()

// cleanup stale entries every 5 min
let lastCleanup = Date.now()
function cleanup() {
  const now = Date.now()
  if (now - lastCleanup < 300_000) return
  lastCleanup = now
  const cutoff = now - WINDOW_MS
  for (const [ip, timestamps] of hits) {
    const fresh = timestamps.filter((t) => t > cutoff)
    if (fresh.length === 0) hits.delete(ip)
    else hits.set(ip, fresh)
  }
}

function getIP(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  )
}

export function proxy(req: NextRequest) {
  // only rate-limit API routes
  if (!req.nextUrl.pathname.startsWith("/api")) return NextResponse.next()

  // demo bypass via cookie
  const demoKey = process.env.DEMO_KEY
  const demoCookie = req.cookies.get("__demo")?.value
  if (demoKey && demoCookie === demoKey) return NextResponse.next()

  cleanup()

  const ip = getIP(req)
  const now = Date.now()
  const cutoff = now - WINDOW_MS
  const timestamps = (hits.get(ip) || []).filter((t) => t > cutoff)
  timestamps.push(now)
  hits.set(ip, timestamps)

  const remaining = Math.max(0, MAX_REQUESTS - timestamps.length)
  const headers = new Headers({
    "X-RateLimit-Limit": String(MAX_REQUESTS),
    "X-RateLimit-Remaining": String(remaining),
    "X-RateLimit-Window": "60",
  })

  if (timestamps.length > MAX_REQUESTS) {
    headers.set("Retry-After", "60")
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again later." },
      { status: 429, headers }
    )
  }

  const res = NextResponse.next()
  res.headers.set("X-RateLimit-Limit", String(MAX_REQUESTS))
  res.headers.set("X-RateLimit-Remaining", String(remaining))
  return res
}

export const config = {
  matcher: "/api/:path*",
}
