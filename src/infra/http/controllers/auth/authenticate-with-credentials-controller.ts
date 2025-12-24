import dayjs from 'dayjs';
import { container } from 'tsyringe';
import { FastifyReply, FastifyRequest } from 'fastify';

import { env } from '@/env';
import { AuthenticateUserRequest } from '../../schemas/auth/authenticate-user-schema';
import { RegisterUserSessionUseCase } from '@/domains/planme/application/features/auth/use-cases/register-user-session-use-case';
import { AuthenticateWithCredentialsUseCase } from '@/domains/planme/application/features/auth/use-cases/authenticate-with-credentials-use-case';

export async function authenticateWithCredentialsController(request: FastifyRequest, reply: FastifyReply) {
	const { email, password } = request.body as AuthenticateUserRequest;

	const authService = container.resolve(AuthenticateWithCredentialsUseCase);
	const sessionService = container.resolve(RegisterUserSessionUseCase);

	const result = await authService.execute({
		email,
		password,
	});

	if (result.isFalse()) {
		throw result.value;
	}

	const { user } = result.value;

	const token = await reply.jwtSign(
		{
			sub: user.id.toString(),
		},
		{
			sign: {
				sub: user.id.toString(),
				expiresIn: '1d',
			},
		}
	);

	await sessionService.execute({
		sessionToken: token,
		userId: user.id.toString(),
		expiresAt: dayjs().add(1, 'days').toDate(),
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
