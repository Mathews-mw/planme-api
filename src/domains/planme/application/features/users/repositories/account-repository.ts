import { Account, AccountProvider } from '@/domains/planme/models/entities/account';

export interface IParams {
	userId: string;
	provider: AccountProvider;
}

export interface IAccountRepository {
	create(account: Account): Promise<void>;
	update(account: Account): Promise<void>;
	delete(account: Account): Promise<void>;
	findManyByUserId(userId: string): Promise<Account[]>;
	findById(id: string): Promise<Account | null>;
	findUniqueByProvider(params: IParams): Promise<Account | null>;
}
