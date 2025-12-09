import { makeUser } from 'tests/factories/make-user';
import { InMemoryUsersRepository } from 'tests/in-memory/in-memory-users-repository';
import { EditUserUseCase } from '@/domains/planme/application/features/users/use-cases/edit-user-use-case';

let usersRepository: InMemoryUsersRepository;
let editUserUseCase: EditUserUseCase;

describe('Edit User Use Case', () => {
	beforeEach(() => {
		usersRepository = new InMemoryUsersRepository();
		editUserUseCase = new EditUserUseCase(usersRepository);
	});

	test('Should be able to update a existing user', async () => {
		const user = makeUser();

		usersRepository.items.push(user);

		const result = await editUserUseCase.execute({
			id: user.id.toString(),
			name: 'John Doe',
			email: 'newuseremail@example.com',
			avatarUrl: 'https://avatar.com',
			timezone: 'America_Toronto',
		});

		expect(result.isSuccess()).toBe(true);

		const storedUser = usersRepository.items[0];

		expect(storedUser.name).toEqual('John Doe');
		expect(storedUser.updatedAt).toBeInstanceOf(Date);
	});
});
