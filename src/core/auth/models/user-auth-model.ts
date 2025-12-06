import z from 'zod';

export const userAuthSchema = z.object({
	id: z.string(),
});

export type UserAuth = z.infer<typeof userAuthSchema>;
