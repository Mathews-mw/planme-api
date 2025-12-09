import bcrypt from 'bcryptjs';

import { makeUser } from 'tests/factories/make-user';
import { BadRequestError } from '@/core/errors/bad-request-errors';
import { InMemoryUsersRepository } from 'tests/in-memory/in-memory-users-repository';
import { InMemoryAccountRepository } from 'tests/in-memory/in-memory-account-repository';
import { CreateUserUseCase } from '@/domains/planme/application/features/users/use-cases/create-user-use-case';

let usersRepository: InMemoryUsersRepository;
let accountRepository: InMemoryAccountRepository;
let createUserUseCase: CreateUserUseCase;

const DEFAULT_TIMEZONE = 'America/Sao_Paulo';

describe('Create User Use Case', () => {
	beforeEach(() => {
		usersRepository = new InMemoryUsersRepository();
		accountRepository = new InMemoryAccountRepository();
		createUserUseCase = new CreateUserUseCase(usersRepository, accountRepository);
	});

	test('Should be able to create a new user and validade default values (timezone, isActive and createdAt)', async () => {
		const password = 'johnDoe@231';

		const result = await createUserUseCase.execute({
			name: 'John Doe',
			email: 'joehndoe@example.com',
			password,
		});

		expect(result.isSuccess()).toBe(true);

		const storedUser = usersRepository.items[0];

		expect(result.value).toEqual({
			user: storedUser,
		});

		const passwordIsHashed = await bcrypt.compare(password, storedUser.password!);

		expect(passwordIsHashed).toBe(true);
		expect(storedUser.timezone).toEqual(DEFAULT_TIMEZONE);
		expect(storedUser.isActive).toBe(true);
		expect(storedUser.createdAt).toBeInstanceOf(Date);
	});

	test('Should not be able to create an user with same email', async () => {
		const user = makeUser({
			email: 'johndoe@example.com',
		});

		usersRepository.items.push(user);

		const result = await createUserUseCase.execute({
			email: 'johndoe@example.com',
			name: 'John Doe',
			password: 'john@Doe#123',
		});

		expect(result.isFalse()).toBe(true);
		expect(result.value).toBeInstanceOf(BadRequestError);
	});
});
