import { Session } from '@/domains/chat/models/entities/session';

export interface ISessionRepository {
	create(session: Session): Promise<Session>;
	update(session: Session): Promise<Session>;
	delete(session: Session): Promise<void>;
	findById(id: string): Promise<Session | null>;
	findByUserId(userId: string): Promise<Session | null>;
}
