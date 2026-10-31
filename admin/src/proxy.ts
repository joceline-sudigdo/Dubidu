import { NextResponse, type NextRequest } from "next/server";

// Cek cepat (optimistic): ada cookie sesi atau tidak. Validasi tanda tangan & akun tetap di DAL.
const SESSION_COOKIE = "dubidu_admin_session";

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSession = request.cookies.has(SESSION_COOKIE);
  // halaman /login sendiri yang mengalihkan admin yang sesinya masih valid (cookie kedaluwarsa tidak bikin loop)
  if (!hasSession && pathname !== "/login") {
    const url = new URL("/login", request.url);
    if (pathname !== "/") url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)"],
};
