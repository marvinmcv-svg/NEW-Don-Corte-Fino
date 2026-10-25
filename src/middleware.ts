import { NextResponse, type NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (/^\/(es|en)(\/|$)/.test(pathname)) return;
  const saved = req.cookies.get("NEXT_LOCALE")?.value;
  const accept = req.headers.get("accept-language") ?? "";
  const locale = saved === "en" || saved === "es" ? saved : /^en\b/i.test(accept) ? "en" : "es";
  const url = req.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next|brand|api|icon|opengraph-image|favicon|robots|sitemap|.*\\..*).*)"],
};
