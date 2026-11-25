import { SITE } from './site';
export const abs = (path: string) => new URL(path, SITE.url).toString();

export const organization = () => ({
  '@context': 'https://schema.org', '@type': 'Organization', '@id': abs('/#org'),
  name: 'Habon', url: abs('/'), logo: abs('/icon-512.png'),
  founder: { '@type': 'Person', name: SITE.developerName },
  sameAs: [SITE.appStoreUrl, SITE.developerUrl],
});
export const website = () => ({
  '@context': 'https://schema.org', '@type': 'WebSite', '@id': abs('/#website'), url: abs('/'), name: 'Habon', description: SITE.tagline, publisher: { '@id': abs('/#org') }, inLanguage: 'en-US',
});
/** Mobile app. No rating or review data is included: the listing has none yet. */
export const softwareApp = () => ({
  '@context': 'https://schema.org', '@type': 'SoftwareApplication', '@id': abs('/#app'),
  name: SITE.fullName, alternateName: 'Habon', description: 'Habon is a calm habit tracker and daily routine planner for iPhone, iPad and Apple Watch. Track yes/no, count and duration goals, build streaks that follow your schedule, and see honest insights. Free with optional Premium.',
  operatingSystem: `iOS ${SITE.minIos} or later`, applicationCategory: 'HealthApplication', applicationSubCategory: 'Habit tracker',
  url: SITE.appStoreUrl, downloadUrl: SITE.appStoreUrl, installUrl: SITE.appStoreUrl,
  image: abs('/icon-512.png'), datePublished: SITE.released, inLanguage: ['en', 'es'],
  author: { '@type': 'Person', name: SITE.developerName, url: SITE.developerUrl },
  publisher: { '@id': abs('/#org') },
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', availability: 'https://schema.org/InStock', description: 'Free to download with optional in-app Premium purchase' },
  featureList: ['Yes/No, count and duration goals', 'Limit goals for quitting habits', 'Streaks that follow your schedule', 'Morning, afternoon and evening routines', 'Week, month and year analytics', 'Apple Watch app', 'Apple Health read-only activity', 'Reminders with Mark done and Add one actions', 'Light and dark mode'],
});
export const webApp = (name: string, path: string, description: string, category = 'LifestyleApplication') => ({
  '@context': 'https://schema.org', '@type': 'WebApplication', name, url: abs(path), description,
  applicationCategory: category, operatingSystem: 'Any (modern web browser)', browserRequirements: 'Requires JavaScript and localStorage',
  isAccessibleForFree: true, offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }, publisher: { '@id': abs('/#org') }, inLanguage: 'en-US',
});
export const breadcrumb = (crumbs: { name: string; href: string }[]) => ({
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: [{ name: 'Home', href: '/' }, ...crumbs].map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: abs(c.href) })),
});
export const faqPage = (items: { q: string; a: string }[]) => ({
  '@context': 'https://schema.org', '@type': 'FAQPage',
  mainEntity: items.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a.replace(/<[^>]+>/g, '') } })),
});
export const article = (o: { title: string; description: string; path: string; published: Date; updated?: Date; image?: string }) => ({
  '@context': 'https://schema.org', '@type': 'Article', headline: o.title, description: o.description, mainEntityOfPage: abs(o.path),
  image: abs(o.image ?? '/og-default.png'), datePublished: o.published.toISOString(), dateModified: (o.updated ?? o.published).toISOString(),
  author: { '@type': 'Organization', name: 'Habon', url: abs('/') }, publisher: { '@id': abs('/#org') }, inLanguage: 'en-US',
});
