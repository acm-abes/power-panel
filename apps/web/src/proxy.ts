/** @format */
/** @format */

import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { RoleName } from "@power/db";

const ROUTES: Record<string, RoleName[]> = {
  "/dashboard": [
    RoleName.ADMIN,
    RoleName.JUDGE,
    RoleName.MENTOR,
    RoleName.PARTICIPANT,
  ],
  "/admin": [RoleName.ADMIN],
  "/judge": [RoleName.JUDGE],
  "/mentor": [RoleName.MENTOR],
  "/participant": [RoleName.PARTICIPANT],
};

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Public routes that don't require authentication
  const publicRoutes = ["/sign-in", "/sign-up"];
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route),
  );

  // Allow API auth routes
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Check if user is authenticated
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  // If not authenticated and trying to access protected route, redirect to sign-in
  if (!session && !isPublicRoute) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // If authenticated and trying to access sign-in/sign-up, redirect to home
  if (session && isPublicRoute) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const userRoles = session?.user.userRoles.map((ur) => ur.role.name) || [];

  const requiredRoles = Object.entries(ROUTES).find(([route]) =>
    pathname.startsWith(route),
  )?.[1];

  if (
    requiredRoles &&
    !requiredRoles.some((role) => userRoles.includes(role))
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
