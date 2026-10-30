import type { Metadata } from "next";
import { Cinzel, Montserrat } from "next/font/google";
import "../globals.css";

const cinzel = Cinzel({ subsets: ["latin"], variable: "--font-cinzel", weight: ["400", "500", "600"] });
const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat", weight: ["400", "500", "600"] });

export const metadata: Metadata = { title: "Admin · Don Corte Fino", robots: { index: false, follow: false } };

export default function AdminRoot({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${cinzel.variable} ${montserrat.variable}`}>
      <body className="admin min-h-screen bg-noir">{children}</body>
    </html>
  );
}
