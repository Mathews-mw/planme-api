import { UnauthorizedError } from '@/core/errors/unauthorized-error';
import { InMemoryUsersRepository } from 'tests/in-memory/in-memory-users-repository';
import { InMemoryAccountRepository } from 'tests/in-memory/in-memory-account-repository';
import { CreateUserUseCase } from '@/domains/planme/application/features/users/use-cases/create-user-use-case';
import { AuthenticateWithCredentialsUseCase } from '@/domains/planme/application/features/auth/use-cases/authenticate-with-credentials-use-case';

let createUserUseCase: CreateUserUseCase;
let accountRepository: InMemoryAccountRepository;
let usersRepository: InMemoryUsersRepository;
let authenticateUserUseCase: AuthenticateWithCredentialsUseCase;

describe('Authenticate User With Credentials Use Case', () => {
	beforeAll(() => {
		usersRepository = new InMemoryUsersRepository();
		accountRepository = new InMemoryAccountRepository();
		createUserUseCase = new CreateUserUseCase(usersRepository, accountRepository);
		authenticateUserUseCase = new AuthenticateWithCredentialsUseCase(usersRepository);
	});

	test('Should be able to authenticate an existing user', async () => {
		await createUserUseCase.execute({
			email: 'johndoe@example.com',
			name: 'John Doe',
			password: '123456',
		});

		const result = await authenticateUserUseCase.execute({
			email: 'johndoe@example.com',
			password: '123456',
		});

		expect(result.isSuccess()).toBe(true);
		expect(result.value).toEqual({
			user: usersRepository.items[0],
		});
	});

	test('Should no be able to authenticate a nonexisting user', async () => {
		const result = await authenticateUserUseCase.execute({
			email: 'bo@aj.nc',
			password: '123456789',
		});

		expect(result.isFalse()).toBe(true);
		expect(result.value).toBeInstanceOf(UnauthorizedError);
	});
});
