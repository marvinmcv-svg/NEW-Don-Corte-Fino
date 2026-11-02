-- BBQ bundles (parrillada) and the add-ons they include.
-- Safe to run more than once: existing rows are left untouched.

begin;

insert into products (slug, cut, name, description, sale_type, price_unit, price, status, sort)
values ('llajua', null, '{"es": "Llajua de la Casa", "en": "House Llajua"}'::jsonb, '{"es": "Locoto, tomate y quirquiña, molidos en batán · 250 ml", "en": "Locoto chilli, tomato and quirquiña, stone-ground · 250 ml"}'::jsonb, 'addon', 'unit', 35, 'active', 230)
on conflict (slug) do nothing;

insert into products (slug, cut, name, description, sale_type, price_unit, price, status, sort)
values ('aji-locoto', null, '{"es": "Ají de Locoto Ahumado", "en": "Smoked Locoto Chilli Sauce"}'::jsonb, '{"es": "Picante ahumado para la carne · 200 ml", "en": "Smoky heat for the meat · 200 ml"}'::jsonb, 'addon', 'unit', 38, 'active', 231)
on conflict (slug) do nothing;

insert into products (slug, cut, name, description, sale_type, price_unit, price, status, sort)
values ('kit-encendido', null, '{"es": "Kit de Encendido", "en": "Fire-Starter Kit"}'::jsonb, '{"es": "Iniciadores naturales + fósforos largos", "en": "Natural fire-lighters + long matches"}'::jsonb, 'addon', 'unit', 25, 'active', 232)
on conflict (slug) do nothing;

insert into launch_offers (key, active, data, sort)
values ('parrillada-clasica', true, '{"option": "P1", "name": {"es": "Parrillada Clásica", "en": "Classic Parrillada"}, "pitch": {"es": "El asado de domingo, completo: tres cortes de parrilla, carbón, llajua y chimichurri. Solo pon el fuego.", "en": "The full Sunday asado: three grill cuts, charcoal, llajua and chimichurri. Just bring the fire."}, "serves": {"es": "4–6 personas", "en": "Serves 4–6"}, "type": "bundle", "items": [{"product": "tira-de-asado", "est_kg": 1.0, "units": null, "value": 200}, {"product": "vacio", "est_kg": 1.0, "units": null, "value": 220}, {"product": "picana", "est_kg": 1.0, "units": null, "value": 300}, {"product": "chimichurri", "est_kg": null, "units": 1, "value": 45}, {"product": "llajua", "est_kg": null, "units": 1, "value": 35}, {"product": "carbon", "est_kg": null, "units": 1, "value": 40}, {"product": "sal-en-escamas", "est_kg": null, "units": 1, "value": 35}], "regular_value": 875, "launch_price": 789, "limit": null, "ends_after_days": null, "includes_extra": {"es": "Guía de parrilla con tiempos y temperaturas", "en": "Grill guide with times and temperatures"}}'::jsonb, -10)
on conflict (key) do nothing;

insert into launch_offers (key, active, data, sort)
values ('noche-de-bifes', true, '{"option": "P2", "name": {"es": "Noche de Bifes", "en": "Steak Night for Two"}, "pitch": {"es": "Dos bifes gruesos para una cena a la brasa: ojo de bife y bife angosto, con ají de locoto ahumado.", "en": "Two thick steaks for a dinner over the coals: ribeye and striploin, with smoked locoto chilli."}, "serves": {"es": "2 personas", "en": "Serves 2"}, "type": "bundle", "items": [{"product": "ojo-de-bife", "est_kg": 0.5, "units": null, "value": 190}, {"product": "bife-angosto", "est_kg": 0.5, "units": null, "value": 170}, {"product": "aji-locoto", "est_kg": null, "units": 1, "value": 38}, {"product": "chimichurri", "est_kg": null, "units": 1, "value": 45}, {"product": "sal-en-escamas", "est_kg": null, "units": 1, "value": 35}, {"product": "carbon", "est_kg": null, "units": 1, "value": 40}], "regular_value": 518, "launch_price": 469, "limit": null, "ends_after_days": null, "includes_extra": {"es": "Cortados a 3 cm y sellados al vacío", "en": "Cut 3 cm thick and vacuum sealed"}}'::jsonb, -9)
on conflict (key) do nothing;

insert into launch_offers (key, active, data, sort)
values ('asado-de-amigos', true, '{"option": "P3", "name": {"es": "Asado de Amigos", "en": "Friends'' Asado"}, "pitch": {"es": "Para la parrilla grande: cuatro cortes, hamburguesas para los chicos, doble carbón, llajua, ají y chimichurri.", "en": "For the big grill: four cuts, burgers for the kids, double charcoal, llajua, chilli and chimichurri."}, "serves": {"es": "8–10 personas", "en": "Serves 8–10"}, "type": "bundle", "items": [{"product": "tira-de-asado", "est_kg": 1.5, "units": null, "value": 300}, {"product": "vacio", "est_kg": 1.5, "units": null, "value": 330}, {"product": "picana", "est_kg": 1.2, "units": null, "value": 360}, {"product": "entrana", "est_kg": 1.0, "units": null, "value": 280}, {"product": "hamburguesas-x6", "est_kg": null, "units": 1, "value": 200}, {"product": "chimichurri", "est_kg": null, "units": 2, "value": 90}, {"product": "llajua", "est_kg": null, "units": 2, "value": 70}, {"product": "aji-locoto", "est_kg": null, "units": 1, "value": 38}, {"product": "carbon", "est_kg": null, "units": 2, "value": 80}, {"product": "kit-encendido", "est_kg": null, "units": 1, "value": 25}, {"product": "sal-en-escamas", "est_kg": null, "units": 1, "value": 35}], "regular_value": 1808, "launch_price": 1590, "limit": null, "ends_after_days": null, "includes_extra": {"es": "Entrega gratis dentro del 4to anillo", "en": "Free delivery inside the 4th ring"}}'::jsonb, -8)
on conflict (key) do nothing;

commit;
