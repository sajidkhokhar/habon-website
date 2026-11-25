import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const posts = (await getCollection('blog')).sort((a, b) => b.data.published.getTime() - a.data.published.getTime());
  return rss({
    title: 'Habon blog: habit tracking, routines and goals',
    description: 'Practical, researched guides on tracking habits, building routines and staying consistent.',
    site: context.site!,
    items: posts.map((p) => ({ title: p.data.title, description: p.data.description, pubDate: p.data.published, link: `/blog/${p.id}/` })),
    customData: '<language>en-us</language>',
  });
}
