import { auth, clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// const isPublicRoutes = createRouteMatcher(["/","/site", "/site(.*)", "/agency", "/agency(.*)"]);
const publicRoutes = ['/', '/site', '/api/uploadthing'];

export default clerkMiddleware(async (auth, req) => {
  // if (publicRoutes.includes(req.nextUrl.pathname)) await auth.protect();

  const { nextUrl } = req;
  const searchParams = nextUrl.searchParams.toString();
  const hostname = req.headers.get("host");

  const pathWithSearchParams = `${nextUrl.pathname}${
    searchParams.length > 0 ? `?${searchParams}` : ""
  }`;

  // Check for subdomain
  const customSubDomain = hostname
    ?.split(process.env.NEXT_PUBLIC_DOMAIN!)
    .filter(Boolean)[0];

  if (customSubDomain) {
    return NextResponse.rewrite(
      new URL(`/${customSubDomain}${pathWithSearchParams}`, req.url)
    );
  }

  if (nextUrl.pathname === "/sign-in" || nextUrl.pathname === "/sign-up") {
    return NextResponse.redirect(new URL("/agency/sign-in", req.url));
  }

  if (
    nextUrl.pathname === "/" ||
    (nextUrl.pathname === "/site" && nextUrl.host === process.env.NEXT_PUBLIC_DOMAIN)
  ) {
    return NextResponse.rewrite(new URL("/site", req.url));
  }

  if (
    nextUrl.pathname.startsWith("/agency") ||
    nextUrl.pathname.startsWith("/subaccount")
  ) {
    return NextResponse.rewrite(new URL(pathWithSearchParams, req.url));
  }
});

export const config = {
  matcher: [
    '/((?!_next|favicon.ico|.*\\.(?:png|jpg|jpeg|webp|avif|gif|svg|css|js|json|txt|woff|woff2|ttf|eot)).*)',
  ],
}
;