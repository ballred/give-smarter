import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher(["/admin(.*)", "/api/admin(.*)"]);

export default clerkMiddleware(async (auth, request) => {
  if (isProtectedRoute(request)) {
    const { userId } = await auth();
    if (!userId) {
      return Response.redirect(new URL("/sign-in", request.url));
    }
  }
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/api(.*)"],
};
