import { Token } from '@/domains/planme/models/entities/token';
import { ITokenRepository } from '@/domains/planme/application/features/auth/repositories/token-repository';

export class InMemoryTokensRepository implements ITokenRepository {
	public items: Token[] = [];

	async create(token: Token): Promise<Token> {
		this.items.push(token);

		return token;
	}

	async update(token: Token): Promise<Token> {
		const tokenIndex = this.items.findIndex((item) => item.id === token.id);

		this.items[tokenIndex] = token;

		return token;
	}

	async delete(token: Token): Promise<void> {
		const tokenIndex = this.items.findIndex((item) => item.id === token.id);

		this.items.slice(tokenIndex, 1);
	}

	async findById(id: string): Promise<Token | null> {
		const token = this.items.find((item) => item.id.toString() === id);

		if (!token) {
			return null;
		}

		return token;
	}

	async findByUserId(userId: string): Promise<Token | null> {
		const token = this.items.find((item) => item.userId.toString() === userId);

		if (!token) {
			return null;
		}

		return token;
	}
}
