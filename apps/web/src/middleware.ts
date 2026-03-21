import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAdmin = token?.isAdmin;
    const isAdminRoute = req.nextUrl.pathname.startsWith("/admin") || req.nextUrl.pathname.startsWith("/api/admin");

    if (isAdminRoute && !isAdmin) {
      if (req.nextUrl.pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const publicPaths = ["/", "/search", "/photo", "/video", "/discover", "/leaderboard", "/challenges", "/collections", "/license", "/terms", "/privacy", "/login", "/register"];
        const path = req.nextUrl.pathname;

        if (publicPaths.some(p => path === p || path.startsWith(p + "/"))) {
          return true;
        }
        if (path.startsWith("/profile/")) return true;
        if (path.startsWith("/api/") && !path.startsWith("/api/admin") && !path.startsWith("/api/internal/profile")) {
          return true;
        }

        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images|api/auth).*)",
  ],
};
