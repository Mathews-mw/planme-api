import { inject, injectable } from 'tsyringe';

import { failure, Outcome, success } from '@/core/outcome';
import { Token } from '@/domains/planme/models/entities/token';
import { ITokenRepository } from '../repositories/token-repository';
import { IUserRepository } from '../../users/repositories/user-repository';
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error';
import { DEPENDENCY_IDENTIFIERS } from '@/shared/di/containers/dependency-identifiers';

interface IRequest {
	id: string;
}

type Response = Outcome<ResourceNotFoundError, { token: Token }>;

@injectable()
export class RequestPasswordRecoverUseCase {
	constructor(
		@inject(DEPENDENCY_IDENTIFIERS.USERS_REPOSITORY) private usersRepository: IUserRepository,
		private tokenRepository: ITokenRepository
	) {}

	async execute({ id }: IRequest): Promise<Response> {
		const user = await this.usersRepository.findById(id);

		if (!user) {
			return failure(new ResourceNotFoundError('User not found'));
		}

		const newToken = Token.create({
			userId: user.id,
			type: 'PASSWORD_RESET',
		});

		await this.tokenRepository.create(newToken);

		return success({ token: newToken });
	}
}
