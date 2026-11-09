import type { Metadata } from "next";
import "../globals.css";
import { cinzel, montserrat } from "@/lib/fonts";

export const metadata: Metadata = { title: "Admin · Don Corte Fino", robots: { index: false, follow: false } };

export default function AdminRoot({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${cinzel.variable} ${montserrat.variable}`}>
      <body className="admin min-h-screen bg-noir">{children}</body>
    </html>
  );
}
