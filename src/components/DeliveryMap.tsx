import type { Locale } from "@/lib/catalog";

/**
 * Google Maps embed for the delivery area. Centres on the store when Admin → Ajustes has its
 * coordinates, otherwise on Santa Cruz de la Sierra. No API key needed for the basic embed.
 */
export default function DeliveryMap({ locale, origin, label, open }: { locale: Locale; origin: { lat: number; lng: number } | null; label: string; open: string }) {
  const q = origin ? `${origin.lat},${origin.lng}` : "Santa Cruz de la Sierra, Bolivia";
  const zoom = origin ? 14 : 12;
  const embed = `https://maps.google.com/maps?q=${encodeURIComponent(q)}&z=${zoom}&hl=${locale}&output=embed`;
  const link = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;

  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden border border-champagne/15 bg-coal md:aspect-[3/4]">
      <iframe
        src={embed}
        title={label}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
        // night-mode the light Google tiles so the map sits in the dark palette
        className="absolute inset-0 h-full w-full border-0 [filter:invert(0.92)_hue-rotate(180deg)_saturate(0.55)_brightness(0.9)_contrast(0.95)]"
      />
      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_80px_rgba(0,0,0,0.65)]" />
      <div className="pointer-events-none absolute left-4 top-4 border border-champagne/30 bg-noir/80 px-4 py-3 backdrop-blur">
        <p className="label text-[0.6rem]">📍 {label}</p>
        <p className="mt-1 font-display text-lg text-bone">Santa Cruz de la Sierra</p>
      </div>
      <a href={link} target="_blank" rel="noopener" className="btn-ghost absolute bottom-4 right-4 bg-noir/70 backdrop-blur">
        {open} ↗
      </a>
    </div>
  );
}
