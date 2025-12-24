import { FastifyReply, FastifyRequest } from 'fastify';

import { env } from '@/env';

export async function signOutController(_request: FastifyRequest, reply: FastifyReply) {
	return reply.clearCookie(env.JWT_COOKIE_NAME).status(204).send();
}
