import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center gap-6 px-4 pt-24 text-center">
      <p className="font-display text-8xl text-wine">404</p>
      <p className="font-serif text-2xl text-steel">Este corte no existe · This cut doesn&apos;t exist</p>
      <Link href="/" className="btn-primary">Don Corte Fino</Link>
    </div>
  );
}
