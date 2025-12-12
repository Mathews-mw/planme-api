import { injectable } from 'tsyringe';

import { failure, Outcome, success } from '@/core/outcome';
import { ISubtaskRepository } from '../repositories/subtask-repository';
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error';
import { TaskDefinition } from '@/domains/planme/models/entities/task-definition';
import { RecurrenceRule } from '@/domains/planme/models/entities/recurrence-rule';
import { ITaskDefinitionRepository } from '../repositories/task-definition-repository';
import { IRecurrenceRuleRepository } from '../repositories/recurrence-rule-repository';
import { ITaskOccurrenceRepository } from '../repositories/task-occurrence-repository';

interface IRequest {
	taskDefinitionId: string;
}

type Response = Outcome<ResourceNotFoundError, { taskDefinition: TaskDefinition; recurrenceRule: RecurrenceRule }>;

@injectable()
export class DeleteTaskUseCase {
	constructor(
		private taskDefinitionRepository: ITaskDefinitionRepository,
		private recurrenceRuleRepository: IRecurrenceRuleRepository,
		private taskOccurrenceRepository: ITaskOccurrenceRepository,
		private subtaskRepository: ISubtaskRepository
	) {}

	async execute({ taskDefinitionId }: IRequest): Promise<Response> {
		const taskDefinition = await this.taskDefinitionRepository.findById(taskDefinitionId);

		if (!taskDefinition) {
			return failure(new ResourceNotFoundError('Task definition not found', 'RESOURCE_NOT_FOUND_ERROR'));
		}

		const recurrenceRule = await this.recurrenceRuleRepository.findById(taskDefinition.recurrenceRuleId.toString());

		if (!recurrenceRule) {
			return failure(new ResourceNotFoundError('Recurrence rule not found', 'RESOURCE_NOT_FOUND_ERROR'));
		}

		await this.subtaskRepository.deleteManyByTaskId(taskDefinitionId);
		await this.taskOccurrenceRepository.deleteByTaskDefinitionId(taskDefinitionId);
		await this.recurrenceRuleRepository.delete(recurrenceRule);
		await this.taskDefinitionRepository.delete(taskDefinition);

		return success({ taskDefinition, recurrenceRule });
	}
}
