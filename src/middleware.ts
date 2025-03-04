import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
// Define which routes are public (no auth required)
const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/api/:path*"]);

export default clerkMiddleware(async (auth, request) => {
  const authenticatedUser = await auth();
  if (!(await authenticatedUser.userId) && !isPublicRoute(request)) {
    return authenticatedUser.redirectToSignIn();
  }

  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
