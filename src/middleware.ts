import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

async function adminGate(req: NextRequest) {
  let res = NextResponse.next({ request: req });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return res;
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => req.cookies.set(name, value));
        res = NextResponse.next({ request: req });
        list.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
      },
    },
  });
  // Refreshes the session cookie; also tells us whether anyone is signed in.
  const { data } = await supabase.auth.getUser();
  const isLogin = req.nextUrl.pathname.startsWith("/admin/login");
  if (!data.user && !isLogin) {
    const to = req.nextUrl.clone();
    to.pathname = "/admin/login";
    to.search = "";
    return NextResponse.redirect(to);
  }
  return res;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/admin")) return adminGate(req);
  if (pathname.startsWith("/api") || /^\/(es|en)(\/|$)/.test(pathname)) return;
  const saved = req.cookies.get("NEXT_LOCALE")?.value;
  const accept = req.headers.get("accept-language") ?? "";
  const locale = saved === "en" || saved === "es" ? saved : /^en\b/i.test(accept) ? "en" : "es";
  const url = req.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next|brand|media|icon|opengraph-image|favicon|robots|sitemap|.*\\..*).*)"],
};
