import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    // サイトのルートからの URL（前後のスラッシュなし）
    path: z.string(),
    description: z.string().optional(),
  }),
});

// お知らせ（旧サイトの投稿。URL は旧サイトと同じくルート直下）
const news = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/news' }),
  schema: z.object({
    title: z.string(),
    path: z.string(),
    date: z.coerce.date(),
    description: z.string().optional(),
  }),
});

export const collections = { pages, news };
