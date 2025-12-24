import { Token } from '@/domains/planme/models/entities/token';

export interface ITokenRepository {
	create(token: Token): Promise<Token>;
	update(token: Token): Promise<Token>;
	delete(token: Token): Promise<void>;
	findById(id: string): Promise<Token | null>;
	findByUserId(userId: string): Promise<Token | null>;
}
