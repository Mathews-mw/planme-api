import z from 'zod';
import { FastifySchema } from 'fastify/types/schema';

const responseSchema = z.object({
	token: z.string(),
});

export type RefreshTokenResponse = z.infer<typeof responseSchema>;

export const refreshTokenSchema: FastifySchema = {
	tags: ['Auth'],
	security: [{ bearerAuth: [] }],
	summary: 'Refresh token (JWT)',
	response: {
		200: responseSchema,
	},
};
