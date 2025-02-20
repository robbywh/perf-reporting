import {
  clerkMiddleware,
  createRouteMatcher,
  clerkClient,
} from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { API_KEY } from "./constants/server.constant";
import { Role, ROLE } from "./types/roles";

// Define which routes are public (no auth required)
const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/:path*",
]);

// Define manager roles (allowed to see team reporting at root)
const MANAGER_ROLES: Role[] = [
  ROLE.ENGINEERING_MANAGER,
  ROLE.CTO,
  ROLE.VP,
  ROLE.PM,
];

export default clerkMiddleware(async (auth, request) => {
  // Allow public routes without protection
  if (isPublicRoute(request)) {
    return;
  }

  await auth.protect();

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  const client = await clerkClient();
  const user = await client.users.getUser(userId);

  const username = user.username || userId;

  const apiUrl = `${request.nextUrl.origin}/api/roles?userId=${userId}`;
  const res = await fetch(apiUrl, {
    method: "GET",
    headers: {
      "x-api-key": API_KEY || "",
      "Content-Type": "application/json",
    },
  });

  // Ensure res.json() is only called once
  if (!res.ok) {
    return NextResponse.json(
      { error: "Failed to fetch role" },
      { status: 500 }
    );
  }

  const data = await res.json();
  const role = data.role ?? "se";

  // If user visits the root path "/"
  if (request.nextUrl.pathname === "/") {
    // Managers (and similar roles) remain on "/" for team reporting,
    // but software engineers are redirected to their own dashboard.
    if (role && !MANAGER_ROLES.includes(role)) {
      return NextResponse.redirect(
        new URL(`/engineer/${username}`, request.url)
      );
    }
  }

  // For /engineer routes:
  // If a software engineer accesses an engineer detail page with a username that doesn't match their own,
  // redirect them to their personal dashboard.
  if (request.nextUrl.pathname.startsWith("/engineer")) {
    const parts = request.nextUrl.pathname.split("/");
    const requestedUsername = parts[2]; // assuming the URL is /engineer/[username]

    if (role === ROLE.SOFTWARE_ENGINEER) {
      if (requestedUsername && requestedUsername !== username) {
        return NextResponse.redirect(
          new URL(`/engineer/${username}`, request.url)
        );
      }
    }

    // Optionally, if a manager navigates to /engineer without a username, redirect them to "/"
    if (MANAGER_ROLES.includes(role) && !requestedUsername) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Allow the request to continue if no redirection was needed.
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
