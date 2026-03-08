import { defineCollection, z } from 'astro:content';

const jobs = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    company: z.string(),
    location: z.string(),
    date_posted: z.date(),
  })
});

export const collections = { jobs };
