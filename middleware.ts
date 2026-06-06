import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    if (path.startsWith("/teacher") && token?.role !== "TEACHER") {
      return NextResponse.redirect(new URL("/student/home", req.url));
    }
    if (path.startsWith("/student") && token?.role === "TEACHER") {
      return NextResponse.redirect(new URL("/teacher/dashboard", req.url));
    }
    if (
      path.startsWith("/student") &&
      token?.role === "STUDENT" &&
      !token?.hasCompletedOnboarding &&
      !path.startsWith("/student/onboarding")
    ) {
      return NextResponse.redirect(new URL("/student/onboarding", req.url));
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const publicPaths = ["/login", "/register"];
        if (publicPaths.some((p) => req.nextUrl.pathname.startsWith(p))) {
          return true;
        }
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: ["/teacher/:path*", "/student/:path*", "/"],
};
