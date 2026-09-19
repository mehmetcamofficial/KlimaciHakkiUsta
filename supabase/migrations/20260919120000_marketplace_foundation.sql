-- Phase 1: Marketplace Foundation
-- Additive only. Does not drop or rename any existing table/column, and does
-- not delete any existing service_requests data.
--
-- This file is NOT applied automatically. Review it and apply it yourself,
-- e.g. with `supabase db push` or by running it in the Supabase SQL editor.
--
-- Until this migration is applied, the app falls back to a local seed
-- catalog for categories/service types (see services/categories.ts) and
-- inserts service_requests without the new marketplace columns (see
-- services/requests.ts), so nothing breaks in the meantime.

create extension if not exists pgcrypto;

create table if not exists service_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  icon_key text not null default 'help-circle',
  description text not null default '',
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists service_types (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references service_categories (id) on delete cascade,
  name text not null,
  slug text not null,
  description text not null default '',
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (category_id, slug)
);

-- Generalize service_requests to carry category/service-type information
-- without touching any existing column (brand, ac_type, problem_type, etc.
-- are left untouched for backward compatibility with the Klima flow).
alter table if exists service_requests
  add column if not exists category_id uuid references service_categories (id),
  add column if not exists category_slug text,
  add column if not exists service_type_id uuid references service_types (id),
  add column if not exists service_type_slug text;

-- Seed data. Re-runnable: existing rows are matched by slug and left
-- untouched (ON CONFLICT DO NOTHING), so this can be re-applied safely.
insert into service_categories (name, slug, icon_key, description, sort_order)
values
  ('Klima', 'klima', 'snow', 'Klima arızası, bakımı, montajı ve gaz dolumu.', 1),
  ('Elektrik', 'elektrik', 'flash', 'Elektrik arızası, pano, priz ve aydınlatma hizmetleri.', 2),
  ('Su Tesisatı', 'su-tesisati', 'water', 'Su kaçağı, tıkanıklık ve tesisat tamiri.', 3),
  ('Kombi / Doğalgaz', 'kombi-dogalgaz', 'flame', 'Kombi arızası, bakımı ve ısıtma sorunları.', 4),
  ('Çilingir', 'cilingir', 'key', 'Kapı açma, kilit değişimi ve anahtar sorunları.', 5),
  ('Beyaz Eşya', 'beyaz-esya', 'cube-outline', 'Buzdolabı, çamaşır ve bulaşık makinesi servisi.', 6),
  ('Boya / Tadilat', 'boya-tadilat', 'color-palette', 'Boya badana, küçük tadilat ve duvar tamiri.', 7),
  ('Mobilya / Montaj', 'mobilya-montaj', 'hammer', 'Mobilya montajı, tamiri ve duvar montajları.', 8),
  ('Temizlik', 'temizlik', 'sparkles', 'Ev, ofis ve özel temizlik hizmetleri.', 9),
  ('Bahçe / Peyzaj', 'bahce-peyzaj', 'leaf', 'Bahçe bakımı, budama ve peyzaj düzenlemesi.', 10)
on conflict (slug) do nothing;

insert into service_types (category_id, name, slug, description, sort_order)
select c.id, v.name, v.slug, v.description, v.sort_order
from (
  values
    ('klima', 'Klima Arızası', 'klima-arizasi', 'Soğutmuyor, su akıtıyor, ses yapıyor veya hata kodu veriyor.', 1),
    ('klima', 'Klima Bakımı', 'klima-bakimi', 'Sezon öncesi klima temizliği ve kontrolü.', 2),
    ('klima', 'Klima Montajı', 'klima-montaji', 'Yeni klima kurulumu veya yer değişimi.', 3),
    ('klima', 'Klima Sökümü', 'klima-sokumu', 'Mevcut klimanın sökülmesi.', 4),
    ('klima', 'Gaz Dolumu', 'gaz-dolumu', 'Soğutucu gaz dolumu ve basınç kontrolü.', 5),

    ('elektrik', 'Elektrik Arızası', 'elektrik-arizasi', 'Elektrik kesintisi veya arıza tespiti.', 1),
    ('elektrik', 'Sigorta / Pano', 'sigorta-pano', 'Sigorta atması ve pano bakımı.', 2),
    ('elektrik', 'Priz / Anahtar', 'priz-anahtar', 'Priz ve anahtar değişimi/arızası.', 3),
    ('elektrik', 'Aydınlatma', 'aydinlatma', 'Aydınlatma armatürü montaj ve arızası.', 4),
    ('elektrik', 'Elektrik Tesisatı', 'elektrik-tesisati', 'Yeni veya mevcut elektrik tesisatı işleri.', 5),

    ('su-tesisati', 'Su Kaçağı', 'su-kacagi', 'Görünür veya gizli su kaçağı tespiti ve onarımı.', 1),
    ('su-tesisati', 'Musluk Arızası', 'musluk-arizasi', 'Musluk damlatması veya arızası.', 2),
    ('su-tesisati', 'Tıkanıklık', 'tikaniklik', 'Lavabo, gider veya kanalizasyon tıkanıklığı.', 3),
    ('su-tesisati', 'Klozet / Rezervuar', 'klozet-rezervuar', 'Klozet ve rezervuar arızaları.', 4),
    ('su-tesisati', 'Tesisat Tamiri', 'tesisat-tamiri', 'Genel su tesisatı tamiratı.', 5),

    ('kombi-dogalgaz', 'Kombi Arızası', 'kombi-arizasi', 'Kombi çalışmıyor veya hata kodu veriyor.', 1),
    ('kombi-dogalgaz', 'Kombi Bakımı', 'kombi-bakimi', 'Yıllık kombi bakımı ve temizliği.', 2),
    ('kombi-dogalgaz', 'Petek Bakımı', 'petek-bakimi', 'Petek temizliği ve havasının alınması.', 3),
    ('kombi-dogalgaz', 'Isıtma Sorunu', 'isitma-sorunu', 'Evin yeterince ısınmaması.', 4),

    ('cilingir', 'Kapı Açma', 'kapi-acma', 'Kapıda kalma / kilitli kapı açma.', 1),
    ('cilingir', 'Kilit Değişimi', 'kilit-degisimi', 'Kapı kilidi değişimi.', 2),
    ('cilingir', 'Anahtar Sorunu', 'anahtar-sorunu', 'Kaybolan veya kırılan anahtar.', 3),

    ('beyaz-esya', 'Buzdolabı', 'buzdolabi', 'Buzdolabı arızası ve servisi.', 1),
    ('beyaz-esya', 'Çamaşır Makinesi', 'camasir-makinesi', 'Çamaşır makinesi arızası ve servisi.', 2),
    ('beyaz-esya', 'Bulaşık Makinesi', 'bulasik-makinesi', 'Bulaşık makinesi arızası ve servisi.', 3),
    ('beyaz-esya', 'Fırın', 'firin', 'Fırın arızası ve servisi.', 4),
    ('beyaz-esya', 'Kurutma Makinesi', 'kurutma-makinesi', 'Kurutma makinesi arızası ve servisi.', 5),

    ('boya-tadilat', 'Boya / Badana', 'boya-badana', 'Ev veya ofis boyama.', 1),
    ('boya-tadilat', 'Küçük Tadilat', 'kucuk-tadilat', 'Küçük çaplı tadilat işleri.', 2),
    ('boya-tadilat', 'Alçı / Sıva', 'alci-siva', 'Alçı ve sıva işleri.', 3),
    ('boya-tadilat', 'Duvar Tamiri', 'duvar-tamiri', 'Duvarda çatlak veya hasar onarımı.', 4),

    ('mobilya-montaj', 'Mobilya Montajı', 'mobilya-montaji', 'Yeni mobilya montajı.', 1),
    ('mobilya-montaj', 'Mobilya Tamiri', 'mobilya-tamiri', 'Mevcut mobilya tamiri.', 2),
    ('mobilya-montaj', 'TV Montajı', 'tv-montaji', 'Duvara TV askı montajı.', 3),
    ('mobilya-montaj', 'Raf / Duvar Montajı', 'raf-duvar-montaji', 'Raf ve duvar aksesuarı montajı.', 4),
    ('mobilya-montaj', 'Perde / Korniş', 'perde-kornis', 'Perde ve korniş montajı.', 5),

    ('temizlik', 'Ev Temizliği', 'ev-temizligi', 'Genel ev temizliği.', 1),
    ('temizlik', 'Ofis Temizliği', 'ofis-temizligi', 'Ofis ve iş yeri temizliği.', 2),
    ('temizlik', 'İnşaat Sonrası Temizlik', 'insaat-sonrasi-temizlik', 'İnşaat/tadilat sonrası ince temizlik.', 3),
    ('temizlik', 'Koltuk / Yatak Temizliği', 'koltuk-yatak-temizligi', 'Koltuk ve yatak yıkama/temizliği.', 4),

    ('bahce-peyzaj', 'Bahçe Bakımı', 'bahce-bakimi', 'Genel bahçe bakımı.', 1),
    ('bahce-peyzaj', 'Budama', 'budama', 'Ağaç ve çalı budama.', 2),
    ('bahce-peyzaj', 'Çim Bakımı', 'cim-bakimi', 'Çim biçme ve bakımı.', 3),
    ('bahce-peyzaj', 'Peyzaj', 'peyzaj', 'Peyzaj tasarımı ve düzenlemesi.', 4),
    ('bahce-peyzaj', 'Sulama Sistemi', 'sulama-sistemi', 'Otomatik sulama sistemi kurulumu ve arızası.', 5)
) as v(category_slug, name, slug, description, sort_order)
join service_categories c on c.slug = v.category_slug
on conflict (category_id, slug) do nothing;
