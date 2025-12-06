import { User } from '@/domains/planme/models/entities/user';

export interface IUserQuerySearch {
	search?: string;
}

export interface IFindUniqueParams {
	id?: string;
	email?: string;
}

export interface IUserRepository {
	create(user: User): Promise<void>;
	update(user: User): Promise<void>;
	delete(user: User): Promise<void>;
	findById(id: string): Promise<User | null>;
	findByEmail(email: string): Promise<User | null>;
	findUnique(params: IFindUniqueParams): Promise<User | null>;
}
