import { Account } from '@/domains/planme/models/entities/account';
import {
	IAccountRepository,
	IParams,
} from '@/domains/planme/application/features/users/repositories/account-repository';

export class InMemoryAccountRepository implements IAccountRepository {
	public items: Array<Account> = [];

	async create(account: Account): Promise<void> {
		this.items.push(account);
	}

	async update(account: Account): Promise<void> {
		const accountIndex = this.items.findIndex((item) => item.id.equals(account.id));

		if (accountIndex === -1) {
			throw new Error('Account not found');
		}

		this.items[accountIndex] = account;
	}

	async delete(account: Account): Promise<void> {
		const accountIndex = this.items.findIndex((item) => item.id.equals(account.id));

		this.items.splice(accountIndex, 1);
	}

	async findManyByUserId(userId: string): Promise<Account[]> {
		const accounts = this.items.filter((account) => account.userId.toString() === userId);

		return accounts;
	}

	async findById(id: string): Promise<Account | null> {
		const account = this.items.find((account) => account.id.toString() === id);

		if (!account) {
			return null;
		}

		return account;
	}

	async findUniqueByProvider(params: IParams): Promise<Account | null> {
		const account = this.items.find(
			(account) => account.userId.toString() === params.userId && account.provider === params.provider
		);

		if (!account) {
			return null;
		}

		return account;
	}
}
