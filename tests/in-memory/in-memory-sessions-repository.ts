import { Session } from '@/domains/planme/models/entities/session';
import { ISessionRepository } from '@/domains/planme/application/features/users/repositories/session-repository';

export class InMemorySessionsRepository implements ISessionRepository {
	public items: Session[] = [];

	async create(session: Session): Promise<Session> {
		this.items.push(session);

		return session;
	}

	async update(session: Session): Promise<Session> {
		const sessionIndex = this.items.findIndex((item) => item.id === session.id);

		this.items[sessionIndex] = session;

		return session;
	}

	async delete(session: Session): Promise<void> {
		const sessionIndex = this.items.findIndex((item) => item.id === session.id);

		this.items.slice(sessionIndex, 1);
	}

	async findById(id: string): Promise<Session | null> {
		const session = this.items.find((item) => item.id.toString() === id);

		if (!session) {
			return null;
		}

		return session;
	}

	async findByUserId(userId: string): Promise<Session | null> {
		const session = this.items.find((item) => item.userId.toString() === userId);

		if (!session) {
			return null;
		}

		return session;
	}
}
