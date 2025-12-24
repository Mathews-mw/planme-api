import dayjs from 'dayjs';
import { container } from 'tsyringe';
import { FastifyReply, FastifyRequest } from 'fastify';

import { env } from '@/env';
import { RegisterUserSessionUseCase } from '@/domains/planme/application/features/auth/use-cases/register-user-session-use-case';

export async function refreshTokenController(request: FastifyRequest, reply: FastifyReply) {
	await request.jwtVerify({ ignoreExpiration: true });

	const { sub } = request.user;

	const sessionService = container.resolve(RegisterUserSessionUseCase);

	const token = await reply.jwtSign(
		{
			sub,
		},
		{
			sign: {
				sub,
				expiresIn: '3d',
			},
		}
	);

	await sessionService.execute({
		userId: sub,
		sessionToken: token,
		expiresAt: dayjs().add(3, 'days').toDate(),
	});

	return reply
		.status(200)
		.setCookie(env.JWT_COOKIE_NAME, token, {
			path: '/',
			maxAge: 7 * 86400, // 7 days in seconds
			httpOnly: true,
			sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
			secure: env.NODE_ENV === 'production',
		})
		.send({
			token,
		});
}
