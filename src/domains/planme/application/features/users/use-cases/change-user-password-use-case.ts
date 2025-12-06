import { compare, hash } from 'bcryptjs';

import { failure, Outcome, success } from '@/core/outcome';
import { User } from '@/domains/planme/models/entities/user';
import cryptographyConfig from '@/config/cryptography-config';
import { IUserRepository } from '../repositories/user-repository';
import { BadRequestError } from '@/core/errors/bad-request-errors';
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error';

interface IRequest {
	id: string;
	oldPassword: string;
	newPassword: string;
}

type Response = Outcome<ResourceNotFoundError | BadRequestError, { user: User }>;

export class ChangeUserPasswordUseCase {
	constructor(private usersRepository: IUserRepository) {}

	async execute({ id, newPassword, oldPassword }: IRequest): Promise<Response> {
		const user = await this.usersRepository.findById(id);

		if (!user) {
			return failure(new ResourceNotFoundError('User not found', 'RESOURCE_NOT_FOUND_ERROR'));
		}

		if (!user.password) {
			return failure(new BadRequestError('You do not have registered credentials', 'BAD_REQUEST_ERROR'));
		}

		const isOldPasswordMatches = compare(oldPassword, user.password);

		if (!isOldPasswordMatches) {
			return failure(new BadRequestError('Old password does not match', 'OLD_PASSWORD_NOT_MATCH_ERROR'));
		}

		const hashPassword = await hash(newPassword, cryptographyConfig.HASH_SALT_LENGTH);

		user.password = hashPassword;

		await this.usersRepository.update(user);

		return success({ user });
	}
}
