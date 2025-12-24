import { inject, injectable } from 'tsyringe';

import { Outcome, success } from '@/core/outcome';
import { UniqueEntityId } from '@/core/entities/unique-entity-id';
import { Session } from '@/domains/planme/models/entities/session';
import { UnauthorizedError } from '@/core/errors/unauthorized-error';
import { ISessionRepository } from '../../users/repositories/session-repository';
import { DEPENDENCY_IDENTIFIERS } from '@/shared/di/containers/dependency-identifiers';

interface IRequest {
	userId: string;
	sessionToken: string;
	socketId?: string;
	expiresAt: Date;
}

type Response = Outcome<UnauthorizedError, { message: string }>;

@injectable()
export class RegisterUserSessionUseCase {
	constructor(@inject(DEPENDENCY_IDENTIFIERS.SESSIONS_REPOSITORY) private sessionsRepository: ISessionRepository) {}

	async execute({ userId, sessionToken, socketId, expiresAt }: IRequest): Promise<Response> {
		const userSessions = await this.sessionsRepository.findByUserId(userId);

		if (!userSessions) {
			const newSession = Session.create({
				sessionToken,
				userId: new UniqueEntityId(userId),
				expiresAt,
				registerAt: new Date(),
			});

			await this.sessionsRepository.create(newSession);
		} else {
			userSessions.sessionToken = sessionToken;
			userSessions.socketId = socketId ?? userSessions.socketId;
			userSessions.expiresAt = expiresAt;
			userSessions.registerAt = new Date();

			await this.sessionsRepository.update(userSessions);
		}

		return success({
			message: 'Sessions Successfully registered',
		});
	}
}
