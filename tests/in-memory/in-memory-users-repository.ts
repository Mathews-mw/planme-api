import { User } from '@/domains/planme/models/entities/user';
import {
	IFindUniqueParams,
	IUserRepository,
} from '@/domains/planme/application/features/users/repositories/user-repository';

export class InMemoryUsersRepository implements IUserRepository {
	public items: Array<User> = [];

	async create(user: User): Promise<void> {
		this.items.push(user);
	}

	async update(user: User): Promise<void> {
		const userIndex = this.items.findIndex((item) => item.id.equals(user.id));

		if (userIndex === -1) {
			throw new Error('User not found');
		}

		this.items[userIndex] = user;
	}

	async delete(user: User): Promise<void> {
		const userIndex = this.items.findIndex((item) => item.id.equals(user.id));

		this.items.splice(userIndex, 1);
	}

	async findById(id: string): Promise<User | null> {
		const user = this.items.find((user) => user.id.toString() === id);

		if (!user) {
			return null;
		}

		return user;
	}

	async findByEmail(email: string): Promise<User | null> {
		const user = this.items.find((user) => user.email === email);

		if (!user) {
			return null;
		}

		return user;
	}

	async findUnique(params: IFindUniqueParams): Promise<User | null> {
		const user = this.items.find((user) => user.id.toString() === params.id || user.email === params.email);

		if (!user) {
			return null;
		}

		return user;
	}
}
