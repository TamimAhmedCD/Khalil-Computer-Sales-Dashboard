import { NextResponse } from "next/server";
import { auth } from "./auth";

export default auth((req) => {
  const user = req.auth?.user;
  const { pathname } = req.nextUrl;

  // Not logged in
  if (!user) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // ---------------- ADMIN ----------------
  // admin + superAdmin both can access
  if (
    pathname.startsWith("/admin") &&
    user.role !== "admin" &&
    user.role !== "superAdmin"
  ) {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  // ---------------- EMPLOYEE ----------------
  if (
    pathname.startsWith("/employee") &&
    user.role !== "employee" &&
    user.role !== "superAdmin"
  ) {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  // ---------------- SUPER ADMIN ----------------
  // only superAdmin
  if (pathname.startsWith("/super-admin") && user.role !== "superAdmin") {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }
});

export const config = {
  matcher: ["/admin/:path*", "/employee/:path*", "/super-admin/:path*"],
};
