import { injectable } from 'tsyringe';

import { failure, Outcome, success } from '@/core/outcome';
import { Subtask } from '@/domains/planme/models/entities/subtask';
import { ISubtaskRepository } from '../repositories/subtask-repository';
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error';
import { ITaskDefinitionRepository } from '../repositories/task-definition-repository';

interface IRequest {
	taskDefinitionId: string;
	title: string;
	description?: string | null;
	position?: number;
}

type Response = Outcome<ResourceNotFoundError, { subtask: Subtask }>;

@injectable()
export class CreateSubtaskUseCase {
	constructor(
		private subtaskRepository: ISubtaskRepository,
		private taskDefinitionRepository: ITaskDefinitionRepository
	) {}

	async execute({ taskDefinitionId, title, description, position }: IRequest): Promise<Response> {
		const taskDefinition = await this.taskDefinitionRepository.findById(taskDefinitionId);

		if (!taskDefinition) {
			return failure(
				new ResourceNotFoundError('Task definition not found. Can not associate to it', 'RESOURCE_NOT_FOUND_ERROR')
			);
		}

		const existingSubtasks = await this.subtaskRepository.findManyByTaskDefinitionId(taskDefinitionId);

		// Normaliza posições atuais (0..N-1)
		existingSubtasks.sort((a, b) => a.position - b.position);
		existingSubtasks.forEach((s, index) => {
			if (s.position !== index) {
				s.position = index;
			}
		});

		let newPosition: number;

		if (position == null || position == undefined) {
			newPosition = existingSubtasks.length;
		} else {
			const maxIndex = existingSubtasks.length;
			newPosition = Math.max(0, Math.min(position, maxIndex));

			for (const subtask of existingSubtasks) {
				if (subtask.position >= newPosition) {
					subtask.position = subtask.position + 1;
				}
			}
		}

		const subtask = Subtask.create({
			taskDefinitionId: taskDefinition.id,
			title,
			description,
			position: newPosition,
		});

		await this.subtaskRepository.create(subtask);

		return success({ subtask });
	}
}
