import { hash } from 'bcryptjs';
import { injectable } from 'tsyringe';
import { randomUUID } from 'node:crypto';

import { failure, Outcome, success } from '@/core/outcome';
import { User } from '@/domains/planme/models/entities/user';
import cryptographyConfig from '@/config/cryptography-config';
import { IUserRepository } from '../repositories/user-repository';
import { BadRequestError } from '@/core/errors/bad-request-errors';
import { Account } from '@/domains/planme/models/entities/account';
import { IAccountRepository } from '../repositories/account-repository';

interface IRequest {
	name: string;
	email: string;
	password: string;
	avatarUrl?: string;
	timezone?: string;
}

type Response = Outcome<BadRequestError, { user: User }>;

@injectable()
export class CreateUserUseCase {
	constructor(
		private usersRepository: IUserRepository,
		private accountsRepository: IAccountRepository
	) {}

	async execute({ name, email, password, avatarUrl, timezone }: IRequest): Promise<Response> {
		const userWithSameEmail = await this.usersRepository.findByEmail(email);

		if (userWithSameEmail) {
			return failure(new BadRequestError('User with same e-mail already exists', 'SAME_EMAIL_ERROR'));
		}

		const hashPassword = await hash(password, cryptographyConfig.HASH_SALT_LENGTH);

		const newUser = User.create({
			name,
			email,
			password: hashPassword,
			avatarUrl,
			timezone,
		});

		const newAccount = Account.create({
			userId: newUser.id,
			provider: 'CREDENTIALS',
			providerAccountId: randomUUID(),
		});

		await this.usersRepository.create(newUser);
		await this.accountsRepository.create(newAccount);

		return success({ user: newUser });
	}
}
