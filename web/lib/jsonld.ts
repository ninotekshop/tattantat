// Dữ liệu có cấu trúc schema.org (JSON-LD) cho toàn site và trang chủ.
import { APP_LINKS, APP_NAME, COMPANY, SAME_AS, SITE_DESCRIPTION, SITE_NAME, SITE_SLOGAN } from './site-info';

export const orgId = (site: string) => `${site}/#organization`;
export const websiteId = (site: string) => `${site}/#website`;

const NUMERIC_PRICE = /^\d+(\.0+)?$/;

/** Gồm: Organization (có địa chỉ, liên hệ, sameAs), WebSite (có ô tìm kiếm) và 2 ứng dụng di động. */
export function siteGraph(site: string) {
  const app = (os: 'ANDROID' | 'IOS', url: string) => ({
    '@type': 'MobileApplication',
    '@id': `${site}/#${os.toLowerCase()}-app`,
    name: APP_NAME,
    operatingSystem: os,
    applicationCategory: 'ShoppingApplication',
    url,
    inLanguage: 'vi',
    offers: { '@type': 'Offer', price: 0, priceCurrency: 'VND' },
    publisher: { '@id': orgId(site) },
  });
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': orgId(site),
        name: SITE_NAME,
        legalName: COMPANY.legalName,
        url: `${site}/`,
        logo: { '@type': 'ImageObject', url: `${site}/assets/logo.png` },
        image: `${site}/og-image.jpg`,
        description: SITE_DESCRIPTION,
        slogan: SITE_SLOGAN,
        email: COMPANY.email,
        telephone: COMPANY.phone,
        address: { '@type': 'PostalAddress', streetAddress: COMPANY.street, addressLocality: COMPANY.locality, addressRegion: COMPANY.region, addressCountry: COMPANY.country },
        areaServed: { '@type': 'Country', name: 'Việt Nam' },
        contactPoint: [{ '@type': 'ContactPoint', contactType: 'customer support', email: COMPANY.email, telephone: COMPANY.phone, availableLanguage: ['vi'], areaServed: COMPANY.country, url: `${site}/contact` }],
        sameAs: SAME_AS,
      },
      {
        '@type': 'WebSite',
        '@id': websiteId(site),
        url: `${site}/`,
        name: SITE_NAME,
        description: SITE_DESCRIPTION,
        inLanguage: 'vi',
        publisher: { '@id': orgId(site) },
        potentialAction: { '@type': 'SearchAction', target: { '@type': 'EntryPoint', urlTemplate: `${site}/?q={search_term_string}` }, 'query-input': 'required name=search_term_string' },
      },
      app('ANDROID', APP_LINKS.android),
      app('IOS', APP_LINKS.ios),
    ],
  };
}

export type OfferItem = { id: string; title: string; price: string; imageUrl?: string; priceMode?: string };

const abs = (site: string, u?: string | null) => (u ? (/^https?:\/\//i.test(u) ? u : site + (u.startsWith('/') ? '' : '/') + u) : undefined);

/** Danh sách tin kèm Product + Offer (giá và đơn vị tiền tệ) để agent đọc được giá mà không cần JavaScript. */
export function listingsItemList(site: string, items: OfferItem[], name: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    numberOfItems: items.length,
    itemListElement: items.map((p, i) => {
      const url = `${site}/products/${p.id}`;
      const priced = NUMERIC_PRICE.test(p.price);
      return {
        '@type': 'ListItem',
        position: i + 1,
        url,
        item: {
          '@type': 'Product',
          name: p.title,
          url,
          image: abs(site, p.imageUrl),
          ...(priced ? { offers: { '@type': 'Offer', price: Number(p.price), priceCurrency: 'VND', availability: 'https://schema.org/InStock', url } } : {}),
        },
      };
    }),
  };
}

export function contactPageNode(site: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: `Liên hệ ${SITE_NAME}`,
    url: `${site}/contact`,
    isPartOf: { '@id': websiteId(site) },
    mainEntity: { '@id': orgId(site) },
  };
}

export const jsonLdString = (data: unknown) => JSON.stringify(data).replace(/</g, '\\u003c');
