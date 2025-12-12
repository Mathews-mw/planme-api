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
export class DeleteSubtaskUseCase {
	constructor(private subtaskRepository: ISubtaskRepository) {}

	async execute({ subtaskId }: IRequest): Promise<Response> {
		const subtask = await this.subtaskRepository.findById(subtaskId);

		if (!subtask) {
			return failure(new ResourceNotFoundError('Subtask not found', 'RESOURCE_NOT_FOUND_ERROR'));
		}

		await this.subtaskRepository.delete(subtask);

		const siblings = await this.subtaskRepository.findManyByTaskDefinitionId(subtask.taskDefinitionId.toString());
		const sorted = siblings.sort((a, b) => a.position - b.position);

		sorted.forEach((s, index) => {
			s.position = index;
		});

		await this.subtaskRepository.updateMany(sorted);

		return success({ subtask });
	}
}
