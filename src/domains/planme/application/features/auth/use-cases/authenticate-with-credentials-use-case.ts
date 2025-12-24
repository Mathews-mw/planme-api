import bcrypt from 'bcryptjs';
import { inject, injectable } from 'tsyringe';

import { failure, Outcome, success } from '@/core/outcome';
import { User } from '@/domains/planme/models/entities/user';
import { UnauthorizedError } from '@/core/errors/unauthorized-error';
import { IUserRepository } from '../../users/repositories/user-repository';
import { DEPENDENCY_IDENTIFIERS } from '@/shared/di/containers/dependency-identifiers';

interface IRequest {
	email: string;
	password: string;
}

type Response = Outcome<UnauthorizedError, { user: User }>;

@injectable()
export class AuthenticateWithCredentialsUseCase {
	constructor(@inject(DEPENDENCY_IDENTIFIERS.USERS_REPOSITORY) private usersRepository: IUserRepository) {}

	async execute({ email, password }: IRequest): Promise<Response> {
		const user = await this.usersRepository.findByEmail(email);

		if (!user) {
			return failure(new UnauthorizedError('Invalid credentials!', 'AUTH_INVALID_CREDENTIALS_ERROR'));
		}

		if (!user.password) {
			return failure(
				new UnauthorizedError(
					'The type of credential you are trying to use does not match the one registered',
					'CREDENTIALS_TYPE_ERROR'
				)
			);
		}

		const isPasswordValid = await bcrypt.compare(password, user.password);

		if (!isPasswordValid) {
			return failure(new UnauthorizedError('Invalid credentials!', 'AUTH_INVALID_CREDENTIALS_ERROR'));
		}

		return success({
			user,
		});
	}
}
