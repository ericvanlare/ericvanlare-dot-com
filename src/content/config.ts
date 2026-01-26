import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.string(),
    description: z.string(),
    featured: z.boolean().optional(),
    pinned: z.boolean().optional(),
  }),
});

export const collections = { blog };
