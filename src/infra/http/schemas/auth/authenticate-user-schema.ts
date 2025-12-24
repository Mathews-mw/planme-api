import z from 'zod';
import { FastifySchema } from 'fastify/types/schema';

const bodySchema = z.object({
	email: z.email(),
	password: z.string(),
});

const responseSchema = z.object({
	token: z.string(),
});

export type AuthenticateUserRequest = z.infer<typeof bodySchema>;
export type AuthenticateUserResponse = z.infer<typeof responseSchema>;

export const authenticateUserSchema: FastifySchema = {
	tags: ['Auth'],
	summary: 'Authenticate with e-mail and password (JWT)',
	body: bodySchema,
	response: {
		200: responseSchema,
	},
};
