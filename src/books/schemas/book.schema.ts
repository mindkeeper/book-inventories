import z from 'zod';

export const BookSchema = z.object({
  title: z.string().min(1, { message: 'Title is required' }),
  author: z.string().min(1, { message: 'Author is required' }),
  published: z.coerce
    .number()
    .int()
    .min(1, { message: 'Published year is required' }),
  genreId: z.string().min(1, { message: 'Genre ID is required' }),
});

export type BookDto = z.infer<typeof BookSchema>;
