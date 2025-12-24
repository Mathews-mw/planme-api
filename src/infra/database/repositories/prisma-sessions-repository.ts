import { prisma } from '../prisma';
import { SessionMapper } from '../mappers/user/session-mapper';
import { Session } from '@/domains/planme/models/entities/session';
import { ISessionRepository } from '@/domains/planme/application/features/users/repositories/session-repository';

export class PrismaSessionsRepository implements ISessionRepository {
	async create(session: Session) {
		const data = SessionMapper.toPrisma(session);

		await prisma.session.create({
			data,
		});

		return session;
	}

	async update(session: Session) {
		const data = SessionMapper.toPrisma(session);

		await prisma.session.update({
			data,
			where: {
				id: data.id,
			},
		});

		return session;
	}

	async delete(session: Session) {
		await prisma.session.delete({
			where: {
				id: session.id.toString(),
			},
		});
	}

	async findById(id: string) {
		const session = await prisma.session.findUnique({
			where: {
				id,
			},
		});

		if (!session) {
			return null;
		}

		return SessionMapper.toDomain(session);
	}

	async findByUserId(userId: string) {
		const session = await prisma.session.findUnique({
			where: {
				userId,
			},
		});

		if (!session) {
			return null;
		}

		return SessionMapper.toDomain(session);
	}
}
