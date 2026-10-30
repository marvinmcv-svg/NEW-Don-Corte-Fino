"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { Button, Field, Input, PageHeader, Panel, useToast } from "./ui";

export default function Account() {
  const toast = useToast();
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 8) return toast("Mínimo 8 caracteres", "err");
    setBusy(true);
    const { error } = await supabaseBrowser().auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return toast(error.message, "err");
    setPw("");
    toast("Contraseña actualizada");
  };
  return (
    <div>
      <PageHeader title="Mi cuenta" />
      <Panel title="Cambiar contraseña" className="max-w-md">
        <form onSubmit={save} className="space-y-4">
          <Field label="Nueva contraseña"><Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" /></Field>
          <Button disabled={busy}>Guardar</Button>
        </form>
      </Panel>
    </div>
  );
}
