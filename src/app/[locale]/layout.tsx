import type { Metadata, Viewport } from "next";
import { Cinzel, Cormorant_Garamond, Montserrat } from "next/font/google";
import { notFound } from "next/navigation";
import "../globals.css";
import CartDrawer from "@/components/CartDrawer";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import WhatsAppFab from "@/components/WhatsAppFab";
import { CartProvider } from "@/lib/cart";
import { getDict, isLocale, LOCALES } from "@/lib/i18n";

const cinzel = Cinzel({ subsets: ["latin"], variable: "--font-cinzel", weight: ["400", "500", "600"] });
const cormorant = Cormorant_Garamond({ subsets: ["latin"], variable: "--font-cormorant", weight: ["400", "500"], style: ["normal", "italic"] });
const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat", weight: ["400", "500", "600"] });

export const generateStaticParams = () => LOCALES.map((locale) => ({ locale }));
export const dynamicParams = false;

export const viewport: Viewport = { themeColor: "#1D1D1C" };

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const es = locale === "es";
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://don-corte-fino.vercel.app"),
    title: {
      default: es ? "Don Corte Fino · Carnicería Wagyu Premium en Santa Cruz" : "Don Corte Fino · Premium Wagyu Butchery in Santa Cruz",
      template: "%s · Don Corte Fino",
    },
    description: es
      ? "Wagyu × Angus seleccionado y cortado a mano. Guía de cortes, tienda online y pedidos por WhatsApp con entrega en Santa Cruz de la Sierra."
      : "Hand-selected, hand-cut Wagyu × Angus. Cut guide, online shop and WhatsApp ordering with delivery across Santa Cruz de la Sierra.",
    alternates: { languages: { es: "/es", en: "/en" } },
    openGraph: { siteName: "Don Corte Fino", locale: es ? "es_BO" : "en_US", type: "website" },
  };
}

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const d = getDict(locale);
  return (
    <html lang={locale} className={`${cinzel.variable} ${cormorant.variable} ${montserrat.variable}`}>
      <body>
        <CartProvider>
          <Header locale={locale} nav={d.nav} />
          <main>{children}</main>
          <Footer locale={locale} />
          <CartDrawer locale={locale} />
          <WhatsAppFab />
        </CartProvider>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ButcherShop",
              name: "Don Corte Fino",
              telephone: "+59177665567",
              address: { "@type": "PostalAddress", addressLocality: "Santa Cruz de la Sierra", addressCountry: "BO" },
              priceRange: "$$$",
              servesCuisine: "Wagyu",
            }),
          }}
        />
      </body>
    </html>
  );
}
