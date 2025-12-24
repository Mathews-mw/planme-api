import z from 'zod';

export const paginationResponseSchema = z.object({
	page: z.coerce.number(),
	per_page: z.coerce.number(),
	total_occurrences: z.coerce.number(),
	total_pages: z.coerce.number(),
});

export type PaginationSchemaResponse = z.infer<typeof paginationResponseSchema>;

export const cursorQuerySchema = z.object({
	limit: z.coerce.number(),
	cursor: z.optional(z.string()),
	skip: z.optional(z.coerce.number()),
});

export const cursorResponseSchema = z.object({
	next_cursor: z.optional(z.string()),
	previous_cursor: z.optional(z.string()),
	has_more: z.coerce.boolean(),
});

export type CursorSchemaQuery = z.infer<typeof cursorQuerySchema>;
export type CursorSchemaResponse = z.infer<typeof cursorResponseSchema>;
