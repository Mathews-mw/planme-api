import { faker } from '@faker-js/faker';

import { UniqueEntityId } from '@/core/entities/unique-entity-id';
import { IUserProps, User } from '@/domains/planme/models/entities/user';

export function makeUser(override: Partial<IUserProps> = {}, id?: UniqueEntityId) {
	const user = User.create(
		{
			name: faker.person.fullName(),
			email: faker.internet.email(),
			password: faker.internet.password(),
			...override,
		},
		id
	);

	return user;
}
