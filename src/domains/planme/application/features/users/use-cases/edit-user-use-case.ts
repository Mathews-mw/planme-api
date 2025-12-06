import { failure, Outcome, success } from '@/core/outcome';
import { User } from '@/domains/planme/models/entities/user';
import { IUserRepository } from '../repositories/user-repository';
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error';

interface IRequest {
	id: string;
	name: string;
	email: string;
	avatarUrl?: string;
}

type Response = Outcome<ResourceNotFoundError, { user: User }>;

export class EditUserUseCase {
	constructor(private usersRepository: IUserRepository) {}

	async execute({ id, name, email, avatarUrl }: IRequest): Promise<Response> {
		const user = await this.usersRepository.findById(id);

		if (!user) {
			return failure(new ResourceNotFoundError('User not found', 'RESOURCE_NOT_FOUND_ERROR'));
		}

		user.name = name ?? user.name;
		user.email = email ?? user.email;
		user.avatarUrl = avatarUrl ?? user.avatarUrl;

		await this.usersRepository.update(user);

		return success({ user });
	}
}
