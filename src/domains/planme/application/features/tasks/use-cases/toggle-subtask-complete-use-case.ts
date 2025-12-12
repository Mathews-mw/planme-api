import { injectable } from 'tsyringe';

import { failure, Outcome, success } from '@/core/outcome';
import { BadRequestError } from '@/core/errors/bad-request-errors';
import { Subtask } from '@/domains/planme/models/entities/subtask';
import { ISubtaskRepository } from '../repositories/subtask-repository';
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error';

interface IRequest {
	subtaskId: string;
}

type Response = Outcome<ResourceNotFoundError | BadRequestError, { subtask: Subtask }>;

@injectable()
export class ToggleSubtaskCompleteUseCase {
	constructor(private subtaskRepository: ISubtaskRepository) {}

	async execute({ subtaskId }: IRequest): Promise<Response> {
		const subtask = await this.subtaskRepository.findById(subtaskId);

		if (!subtask) {
			return failure(new ResourceNotFoundError('Subtask not found', 'RESOURCE_NOT_FOUND_ERROR'));
		}

		if (!subtask.isCompleted) {
			subtask.complete();
		} else {
			subtask.isCompleted = false;
			subtask.completedAt = null;
		}

		await this.subtaskRepository.update(subtask);

		return success({ subtask });
	}
}
