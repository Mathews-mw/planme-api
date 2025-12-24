import { z } from 'zod';

export const userSchema = z.object({
	id: z.uuid(),
	name: z.string(),
	email: z.email(),
	avatar_url: z.url().nullable(),
	timezone: z.string(),
	is_active: z.boolean(),
	created_at: z.coerce.date(),
});

export type UserResponseSchema = z.infer<typeof userSchema>;
