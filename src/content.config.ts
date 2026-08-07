import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

export const collections = {
	work: defineCollection({
		// Load Markdown files in the src/content/work directory.
		loader: glob({ base: './src/content/work', pattern: '**/*.md' }),
		schema: z.object({
			title: z.string(),
			description: z.string(),
			publishDate: z.coerce.date(),
			category: z.enum(['ai', 'finance']),
			status: z.string().optional(),
			order: z.number().default(0),
			tags: z.array(z.string()),
			img: z.string().optional(),
			img_alt: z.string().optional(),
		}),
	}),
};
