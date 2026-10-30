# Supabase

Project: `don-corte-fino` (ref `nfikjlyhmjbjledglxwo`, region sa-east-1).

Schema, triggers, RLS and the `place_order` / `check_promo` functions were applied as migrations
(`core_schema`, `logic_and_rls`, `media_bucket`, `settings_nullable_realtime`); see them in the
Supabase dashboard under Database → Migrations. Seed data came from `data/seed/catalog.json`.

Environment variables (set in Vercel and `.env.local`):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (publishable key; access is limited by row-level security)

Roles: `owner` (everything), `staff` (orders, inventory, customers), `editor` (products, offers).
New sign-ups have no role until the owner assigns one in Admin → Equipo.
