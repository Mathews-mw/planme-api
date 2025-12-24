import { UniqueEntityId } from '@/core/entities/unique-entity-id';
import { Session } from '@/domains/planme/models/entities/session';
import { Session as PrismaSession } from '@/generated/prisma/client';

export class SessionMapper {
	static toDomain(data: PrismaSession): Session {
		return Session.create(
			{
				userId: new UniqueEntityId(data.userId),
				sessionToken: data.sessionToken,
				expiresAt: data.expiresAt,
				registerAt: data.registerAt,
			},
			new UniqueEntityId(data.id)
		);
	}

	static toPrisma(data: Session): PrismaSession {
		return {
			id: data.id.toString(),
			userId: data.userId.toString(),
			sessionToken: data.sessionToken,
			expiresAt: data.expiresAt,
			registerAt: data.registerAt,
		};
	}
}
