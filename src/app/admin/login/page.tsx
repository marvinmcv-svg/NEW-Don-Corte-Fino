"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Field, Input } from "@/components/admin/ui";
import { supabaseBrowser } from "@/lib/supabase/browser";

export default function Login() {
  const router = useRouter();
  const [mode, setMode] = useState<"in" | "up" | "reset">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok?: boolean }>();
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(undefined);
    const db = supabaseBrowser();
    if (mode === "in") {
      // Staff can sign in with their username (e.g. DonCorteFino) or their email.
      let login = email.trim();
      if (!login.includes("@")) {
        const { data } = await db.rpc("login_email", { p_username: login });
        login = typeof data === "string" ? data : "";
      }
      const { error } = login
        ? await db.auth.signInWithPassword({ email: login, password })
        : { error: { message: "Invalid login credentials" } };
      if (error) setMsg({ text: error.message === "Invalid login credentials" ? "Usuario o contraseña incorrectos." : error.message });
      else {
        router.replace("/admin");
        router.refresh();
      }
    } else if (mode === "up") {
      const { error } = await db.auth.signUp({ email, password, options: { emailRedirectTo: `${location.origin}/admin` } });
      setMsg(error ? { text: error.message } : { text: "Cuenta creada. Revisa tu correo para confirmarla y luego inicia sesión.", ok: true });
    } else {
      const { error } = await db.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/admin/cuenta` });
      setMsg(error ? { text: error.message } : { text: "Te enviamos un enlace para cambiar tu contraseña.", ok: true });
    }
    setBusy(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-champagne/10 bg-coal/70 p-8">
        <div className="mb-8 flex flex-col items-center text-center">
          <Image src="/brand/mark.webp" alt="" width={64} height={64} />
          <h1 className="mt-4 font-display text-xl tracking-[0.15em] text-bone">DON CORTE FINO</h1>
          <p className="mt-1 text-xs uppercase tracking-[0.3em] text-champagne">Panel de administración</p>
        </div>
        <div className="space-y-4">
          <Field label={mode === "in" ? "Usuario o correo" : "Correo"}>
            <Input
              type={mode === "in" ? "text" : "email"}
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete={mode === "in" ? "username" : "email"}
              autoCapitalize="none"
              spellCheck={false}
            />
          </Field>
          {mode !== "reset" && (
            <Field label="Contraseña" hint={mode === "up" ? "Mínimo 8 caracteres." : undefined}>
              <div className="relative">
                <Input
                  type={show ? "text" : "password"}
                  required
                  minLength={mode === "up" ? 8 : 1}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === "up" ? "new-password" : "current-password"}
                  className="pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
                  aria-pressed={show}
                  title={show ? "Ocultar contraseña" : "Mostrar contraseña"}
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-ash transition hover:text-champagne"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
                    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
                    <circle cx="12" cy="12" r="3" />
                    {show && <path d="M4 4l16 16" />}
                  </svg>
                </button>
              </div>
            </Field>
          )}
          {msg && <p className={`text-sm ${msg.ok ? "text-emerald-300" : "text-red-300"}`}>{msg.text}</p>}
          <Button disabled={busy} className="w-full">
            {busy ? "…" : mode === "in" ? "Ingresar" : mode === "up" ? "Crear cuenta" : "Enviar enlace"}
          </Button>
        </div>
        <div className="mt-6 flex justify-between text-xs text-ash">
          {mode === "in" ? (
            <>
              <button type="button" onClick={() => setMode("up")} className="hover:text-bone">Crear cuenta</button>
              <button type="button" onClick={() => setMode("reset")} className="hover:text-bone">Olvidé mi contraseña</button>
            </>
          ) : (
            <button type="button" onClick={() => setMode("in")} className="hover:text-bone">← Volver a ingresar</button>
          )}
        </div>
        {mode === "up" && <p className="mt-4 text-[0.7rem] leading-relaxed text-ash">Las cuentas nuevas no tienen acceso hasta que el dueño les asigne un rol en Equipo.</p>}
      </form>
    </div>
  );
}
