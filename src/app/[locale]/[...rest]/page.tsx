import { notFound } from "next/navigation";

/** Unmatched paths under a locale render the branded [locale]/not-found page instead of Next's bare default. */
export default function CatchAll() {
  notFound();
}
