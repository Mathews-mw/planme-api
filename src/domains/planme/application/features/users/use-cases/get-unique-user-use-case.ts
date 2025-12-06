import { injectable } from 'tsyringe';

import { failure, Outcome, success } from '@/core/outcome';
import { User } from '@/domains/planme/models/entities/user';
import { IUserRepository } from '../repositories/user-repository';
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error';

interface IRequest {
	id?: string;
	email?: string;
}

type Response = Outcome<ResourceNotFoundError, { user: User }>;

@injectable()
export class GetUniqueUserUseCase {
	constructor(private usersRepository: IUserRepository) {}

	async execute({ id, email }: IRequest): Promise<Response> {
		const user = await this.usersRepository.findUnique({ id, email });

		if (!user) {
			return failure(new ResourceNotFoundError('User not found', 'RESOURCE_NOT_FOUND_ERROR'));
		}

		return success({ user });
	}
}
