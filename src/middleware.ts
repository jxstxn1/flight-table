import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  // Only apply to the main page
  if (request.nextUrl.pathname === "/") {
    const token = request.nextUrl.searchParams.get("token");
    const expectedToken = process.env.WEBSOCKET_TOKEN; // Server-side only token

    // If no token or invalid token, redirect to Google
    if (!token || token !== expectedToken) {
      return NextResponse.redirect("https://www.google.com");
    }

    // If token is valid, allow access to the page
    // The token will be available in the URL for the client to use
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/",
};
