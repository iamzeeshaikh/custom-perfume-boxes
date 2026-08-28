/**
 * Resource loader. Reference documents live as markdown in src/data/resources/;
 * the filename (minus .md) is the slug.
 *
 * Unlike the blog, these are ordered by an explicit `order` field rather than
 * by date, because they form a reading sequence rather than a feed. Every
 * resource carries its own FAQs in frontmatter so each page can emit FAQPage
 * schema that matches what is actually visible on it.
 */
export interface ResourceModule {
  frontmatter: {
    title: string;
    metaTitle: string;
    metaDescription: string;
    summary: string;
    order: number;
    updated: string;
    readingMinutes: number;
    faqs: { q: string; a: string }[];
  };
  Content: any;
}

const files = import.meta.glob<ResourceModule>('../data/resources/*.md', { eager: true });

export const RESOURCES = Object.entries(files)
  .map(([path, mod]) => {
    const slug = path.split('/').pop()!.replace(/\.md$/, '');
    return { slug, url: `/resources/${slug}/`, ...mod.frontmatter, Content: mod.Content };
  })
  .sort((a, b) => a.order - b.order || a.slug.localeCompare(b.slug));

export const getResource = (slug: string) => RESOURCES.find((r) => r.slug === slug);
