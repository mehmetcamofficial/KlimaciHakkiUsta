import type { ServiceCategory, ServiceType } from '@/types/domain';

/**
 * Local, hard-coded catalog. Acts as:
 *  - the seed data written into `supabase/migrations` for the real tables, and
 *  - the runtime fallback used by `services/categories.ts` whenever the
 *    `service_categories` / `service_types` Supabase tables are unavailable
 *    (e.g. the migration has not been applied yet).
 *
 * To add a category or service type, add an entry below — no UI code needs
 * to change (see README "Yeni kategori / hizmet tipi ekleme").
 */
export interface ServiceCatalogEntry {
  category: ServiceCategory;
  serviceTypes: ServiceType[];
}

function serviceType(
  categorySlug: string,
  name: string,
  slug: string,
  description: string,
  sortOrder: number
): ServiceType {
  return {
    id: `${categorySlug}:${slug}`,
    categoryId: categorySlug,
    categorySlug,
    name,
    slug,
    description,
    active: true,
    sortOrder,
  };
}

export const SERVICE_CATALOG: ServiceCatalogEntry[] = [
  {
    category: {
      id: 'klima',
      name: 'Klima',
      slug: 'klima',
      iconKey: 'snow',
      description: 'Klima arızası, bakımı, montajı ve gaz dolumu.',
      active: true,
      sortOrder: 1,
    },
    serviceTypes: [
      serviceType('klima', 'Klima Arızası', 'klima-arizasi', 'Soğutmuyor, su akıtıyor, ses yapıyor veya hata kodu veriyor.', 1),
      serviceType('klima', 'Klima Bakımı', 'klima-bakimi', 'Sezon öncesi klima temizliği ve kontrolü.', 2),
      serviceType('klima', 'Klima Montajı', 'klima-montaji', 'Yeni klima kurulumu veya yer değişimi.', 3),
      serviceType('klima', 'Klima Sökümü', 'klima-sokumu', 'Mevcut klimanın sökülmesi.', 4),
      serviceType('klima', 'Gaz Dolumu', 'gaz-dolumu', 'Soğutucu gaz dolumu ve basınç kontrolü.', 5),
    ],
  },
  {
    category: {
      id: 'elektrik',
      name: 'Elektrik',
      slug: 'elektrik',
      iconKey: 'flash',
      description: 'Elektrik arızası, pano, priz ve aydınlatma hizmetleri.',
      active: true,
      sortOrder: 2,
    },
    serviceTypes: [
      serviceType('elektrik', 'Elektrik Arızası', 'elektrik-arizasi', 'Elektrik kesintisi veya arıza tespiti.', 1),
      serviceType('elektrik', 'Sigorta / Pano', 'sigorta-pano', 'Sigorta atması ve pano bakımı.', 2),
      serviceType('elektrik', 'Priz / Anahtar', 'priz-anahtar', 'Priz ve anahtar değişimi/arızası.', 3),
      serviceType('elektrik', 'Aydınlatma', 'aydinlatma', 'Aydınlatma armatürü montaj ve arızası.', 4),
      serviceType('elektrik', 'Elektrik Tesisatı', 'elektrik-tesisati', 'Yeni veya mevcut elektrik tesisatı işleri.', 5),
    ],
  },
  {
    category: {
      id: 'su-tesisati',
      name: 'Su Tesisatı',
      slug: 'su-tesisati',
      iconKey: 'water',
      description: 'Su kaçağı, tıkanıklık ve tesisat tamiri.',
      active: true,
      sortOrder: 3,
    },
    serviceTypes: [
      serviceType('su-tesisati', 'Su Kaçağı', 'su-kacagi', 'Görünür veya gizli su kaçağı tespiti ve onarımı.', 1),
      serviceType('su-tesisati', 'Musluk Arızası', 'musluk-arizasi', 'Musluk damlatması veya arızası.', 2),
      serviceType('su-tesisati', 'Tıkanıklık', 'tikaniklik', 'Lavabo, gider veya kanalizasyon tıkanıklığı.', 3),
      serviceType('su-tesisati', 'Klozet / Rezervuar', 'klozet-rezervuar', 'Klozet ve rezervuar arızaları.', 4),
      serviceType('su-tesisati', 'Tesisat Tamiri', 'tesisat-tamiri', 'Genel su tesisatı tamiratı.', 5),
    ],
  },
  {
    category: {
      id: 'kombi-dogalgaz',
      name: 'Kombi / Doğalgaz',
      slug: 'kombi-dogalgaz',
      iconKey: 'flame',
      description: 'Kombi arızası, bakımı ve ısıtma sorunları.',
      active: true,
      sortOrder: 4,
    },
    serviceTypes: [
      serviceType('kombi-dogalgaz', 'Kombi Arızası', 'kombi-arizasi', 'Kombi çalışmıyor veya hata kodu veriyor.', 1),
      serviceType('kombi-dogalgaz', 'Kombi Bakımı', 'kombi-bakimi', 'Yıllık kombi bakımı ve temizliği.', 2),
      serviceType('kombi-dogalgaz', 'Petek Bakımı', 'petek-bakimi', 'Petek temizliği ve havasının alınması.', 3),
      serviceType('kombi-dogalgaz', 'Isıtma Sorunu', 'isitma-sorunu', 'Evin yeterince ısınmaması.', 4),
    ],
  },
  {
    category: {
      id: 'cilingir',
      name: 'Çilingir',
      slug: 'cilingir',
      iconKey: 'key',
      description: 'Kapı açma, kilit değişimi ve anahtar sorunları.',
      active: true,
      sortOrder: 5,
    },
    serviceTypes: [
      serviceType('cilingir', 'Kapı Açma', 'kapi-acma', 'Kapıda kalma / kilitli kapı açma.', 1),
      serviceType('cilingir', 'Kilit Değişimi', 'kilit-degisimi', 'Kapı kilidi değişimi.', 2),
      serviceType('cilingir', 'Anahtar Sorunu', 'anahtar-sorunu', 'Kaybolan veya kırılan anahtar.', 3),
    ],
  },
  {
    category: {
      id: 'beyaz-esya',
      name: 'Beyaz Eşya',
      slug: 'beyaz-esya',
      iconKey: 'cube-outline',
      description: 'Buzdolabı, çamaşır ve bulaşık makinesi servisi.',
      active: true,
      sortOrder: 6,
    },
    serviceTypes: [
      serviceType('beyaz-esya', 'Buzdolabı', 'buzdolabi', 'Buzdolabı arızası ve servisi.', 1),
      serviceType('beyaz-esya', 'Çamaşır Makinesi', 'camasir-makinesi', 'Çamaşır makinesi arızası ve servisi.', 2),
      serviceType('beyaz-esya', 'Bulaşık Makinesi', 'bulasik-makinesi', 'Bulaşık makinesi arızası ve servisi.', 3),
      serviceType('beyaz-esya', 'Fırın', 'firin', 'Fırın arızası ve servisi.', 4),
      serviceType('beyaz-esya', 'Kurutma Makinesi', 'kurutma-makinesi', 'Kurutma makinesi arızası ve servisi.', 5),
    ],
  },
  {
    category: {
      id: 'boya-tadilat',
      name: 'Boya / Tadilat',
      slug: 'boya-tadilat',
      iconKey: 'color-palette',
      description: 'Boya badana, küçük tadilat ve duvar tamiri.',
      active: true,
      sortOrder: 7,
    },
    serviceTypes: [
      serviceType('boya-tadilat', 'Boya / Badana', 'boya-badana', 'Ev veya ofis boyama.', 1),
      serviceType('boya-tadilat', 'Küçük Tadilat', 'kucuk-tadilat', 'Küçük çaplı tadilat işleri.', 2),
      serviceType('boya-tadilat', 'Alçı / Sıva', 'alci-siva', 'Alçı ve sıva işleri.', 3),
      serviceType('boya-tadilat', 'Duvar Tamiri', 'duvar-tamiri', 'Duvarda çatlak veya hasar onarımı.', 4),
    ],
  },
  {
    category: {
      id: 'mobilya-montaj',
      name: 'Mobilya / Montaj',
      slug: 'mobilya-montaj',
      iconKey: 'hammer',
      description: 'Mobilya montajı, tamiri ve duvar montajları.',
      active: true,
      sortOrder: 8,
    },
    serviceTypes: [
      serviceType('mobilya-montaj', 'Mobilya Montajı', 'mobilya-montaji', 'Yeni mobilya montajı.', 1),
      serviceType('mobilya-montaj', 'Mobilya Tamiri', 'mobilya-tamiri', 'Mevcut mobilya tamiri.', 2),
      serviceType('mobilya-montaj', 'TV Montajı', 'tv-montaji', 'Duvara TV askı montajı.', 3),
      serviceType('mobilya-montaj', 'Raf / Duvar Montajı', 'raf-duvar-montaji', 'Raf ve duvar aksesuarı montajı.', 4),
      serviceType('mobilya-montaj', 'Perde / Korniş', 'perde-kornis', 'Perde ve korniş montajı.', 5),
    ],
  },
  {
    category: {
      id: 'temizlik',
      name: 'Temizlik',
      slug: 'temizlik',
      iconKey: 'sparkles',
      description: 'Ev, ofis ve özel temizlik hizmetleri.',
      active: true,
      sortOrder: 9,
    },
    serviceTypes: [
      serviceType('temizlik', 'Ev Temizliği', 'ev-temizligi', 'Genel ev temizliği.', 1),
      serviceType('temizlik', 'Ofis Temizliği', 'ofis-temizligi', 'Ofis ve iş yeri temizliği.', 2),
      serviceType('temizlik', 'İnşaat Sonrası Temizlik', 'insaat-sonrasi-temizlik', 'İnşaat/tadilat sonrası ince temizlik.', 3),
      serviceType('temizlik', 'Koltuk / Yatak Temizliği', 'koltuk-yatak-temizligi', 'Koltuk ve yatak yıkama/temizliği.', 4),
    ],
  },
  {
    category: {
      id: 'bahce-peyzaj',
      name: 'Bahçe / Peyzaj',
      slug: 'bahce-peyzaj',
      iconKey: 'leaf',
      description: 'Bahçe bakımı, budama ve peyzaj düzenlemesi.',
      active: true,
      sortOrder: 10,
    },
    serviceTypes: [
      serviceType('bahce-peyzaj', 'Bahçe Bakımı', 'bahce-bakimi', 'Genel bahçe bakımı.', 1),
      serviceType('bahce-peyzaj', 'Budama', 'budama', 'Ağaç ve çalı budama.', 2),
      serviceType('bahce-peyzaj', 'Çim Bakımı', 'cim-bakimi', 'Çim biçme ve bakımı.', 3),
      serviceType('bahce-peyzaj', 'Peyzaj', 'peyzaj', 'Peyzaj tasarımı ve düzenlemesi.', 4),
      serviceType('bahce-peyzaj', 'Sulama Sistemi', 'sulama-sistemi', 'Otomatik sulama sistemi kurulumu ve arızası.', 5),
    ],
  },
];
