import z from 'zod';

export const UpdateBookSchema = z
  .object({
    title: z.string().min(1, { message: 'Title is required' }).optional(),
    author: z.string().min(1, { message: 'Author is required' }).optional(),
    published: z
      .number()
      .int()
      .min(1, { message: 'Published year is required' })
      .optional(),
    genreId: z.string().min(1, { message: 'Genre ID is required' }).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

export type UpdateBookDto = z.infer<typeof UpdateBookSchema>;
