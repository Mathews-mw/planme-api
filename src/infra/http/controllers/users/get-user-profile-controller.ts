import { container } from 'tsyringe';
import { FastifyReply, FastifyRequest } from 'fastify';

import { UserPresenter } from '../../presenters/users/user-presenter';
import { GetUniqueUserUseCase } from '@/domains/planme/application/features/users/use-cases/get-unique-user-use-case';

export async function getUserProfileController(request: FastifyRequest, reply: FastifyReply) {
	const { sub: userId } = request.user;

	const service = container.resolve(GetUniqueUserUseCase);

	const result = await service.execute({
		id: userId,
	});

	if (result.isFalse()) {
		throw result.value;
	}

	return reply.status(200).send(UserPresenter.toHTTP(result.value.user));
}
