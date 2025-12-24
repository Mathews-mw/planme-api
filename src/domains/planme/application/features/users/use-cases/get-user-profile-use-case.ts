import { inject, injectable } from 'tsyringe';

import { failure, Outcome, success } from '@/core/outcome';
import { User } from '@/domains/planme/models/entities/user';
import { IUserRepository } from '../repositories/user-repository';
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error';
import { DEPENDENCY_IDENTIFIERS } from '@/shared/di/containers/dependency-identifiers';

interface IRequest {
	id: string;
}

type Response = Outcome<ResourceNotFoundError, { user: User }>;

@injectable()
export class GetUserProfileUseCase {
	constructor(@inject(DEPENDENCY_IDENTIFIERS.USERS_REPOSITORY) private usersRepository: IUserRepository) {}

	async execute({ id }: IRequest): Promise<Response> {
		const user = await this.usersRepository.findById(id);

		if (!user) {
			return failure(new ResourceNotFoundError('User not found', 'RESOURCE_NOT_FOUND_ERROR'));
		}

		return success({ user });
	}
}
