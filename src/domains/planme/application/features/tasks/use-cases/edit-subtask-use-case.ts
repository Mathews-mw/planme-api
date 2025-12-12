import { injectable } from 'tsyringe';

import { failure, Outcome, success } from '@/core/outcome';
import { Subtask } from '@/domains/planme/models/entities/subtask';
import { ISubtaskRepository } from '../repositories/subtask-repository';
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error';

interface IRequest {
	subtaskId: string;
	title?: string;
	description?: string | null;
}

type Response = Outcome<ResourceNotFoundError, { subtask: Subtask }>;

@injectable()
export class EditSubtaskUseCase {
	constructor(private subtaskRepository: ISubtaskRepository) {}

	async execute({ subtaskId, title, description }: IRequest): Promise<Response> {
		const subtask = await this.subtaskRepository.findById(subtaskId);

		if (!subtask) {
			return failure(new ResourceNotFoundError('Subtask not found', 'RESOURCE_NOT_FOUND_ERROR'));
		}

		subtask.title = title ?? subtask.title;
		subtask.description = description ?? subtask.description;

		await this.subtaskRepository.update(subtask);

		return success({ subtask });
	}
}
