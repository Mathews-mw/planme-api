import { injectable } from 'tsyringe';

import { failure, Outcome, success } from '@/core/outcome';
import { BadRequestError } from '@/core/errors/bad-request-errors';
import { ISubtaskRepository } from '../repositories/subtask-repository';
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error';

interface IRequest {
	taskDefinitionId: string;
	orderedSubtaskIds: Array<string>;
}

type Response = Outcome<ResourceNotFoundError | BadRequestError, null>;

@injectable()
export class ReorderSubtaskUseCase {
	constructor(private subtaskRepository: ISubtaskRepository) {}

	async execute({ orderedSubtaskIds, taskDefinitionId }: IRequest): Promise<Response> {
		const subtasks = await this.subtaskRepository.findManyByTaskDefinitionId(taskDefinitionId);

		if (subtasks.length === 0) {
			return success(null);
		}

		// validar se IDs batem
		const currentIds = new Set(subtasks.map((s) => s.id.toString()));
		const orderedSet = new Set(orderedSubtaskIds.map((id) => id));

		if (currentIds.size !== orderedSet.size || [...currentIds].some((id) => !orderedSet.has(id))) {
			return failure(
				new BadRequestError('orderedSubtaskIds must contain exactly the current subtasks', 'BAD_REQUEST_ERROR')
			);
		}

		// Aplica nova ordem
		const byId = new Map(subtasks.map((subtask) => [subtask.id.toString(), subtask]));

		orderedSubtaskIds.forEach((id, index) => {
			const subtask = byId.get(id);

			if (!subtask) return;

			subtask.position = index;
		});

		// Persistir no repositório
		await this.subtaskRepository.updateMany([...byId.values()]);

		return success(null);
	}
}
