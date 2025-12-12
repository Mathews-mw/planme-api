import dayjs from 'dayjs';
import { injectable } from 'tsyringe';

import { failure, Outcome, success } from '@/core/outcome';
import { BadRequestError } from '@/core/errors/bad-request-errors';
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error';
import { TaskOccurrence } from '@/domains/planme/models/entities/task-occurrence';
import { ITaskDefinitionRepository } from '../repositories/task-definition-repository';
import { IRecurrenceRuleRepository } from '../repositories/recurrence-rule-repository';
import { ITaskOccurrenceRepository } from '../repositories/task-occurrence-repository';
import { TaskOccurrencesPlanner } from '../../recurrence/services/task-occurrences-planner';

interface IRequest {
	userId: string;
	taskDefinitionId: string;
	taskOccurrenceId: string;
}

type Response = Outcome<ResourceNotFoundError | BadRequestError, { taskOccurrence: TaskOccurrence }>;

@injectable()
export class ToggleCompleteTaskUseCase {
	constructor(
		private taskDefinitionRepository: ITaskDefinitionRepository,
		private recurrenceRuleRepository: IRecurrenceRuleRepository,
		private taskOccurrenceRepository: ITaskOccurrenceRepository,
		private occurrencesPlanner: TaskOccurrencesPlanner
	) {}

	async execute({ userId, taskDefinitionId, taskOccurrenceId }: IRequest): Promise<Response> {
		const taskOccurrence = await this.taskOccurrenceRepository.findById(taskOccurrenceId);
		const taskDefinition = await this.taskDefinitionRepository.findById(taskDefinitionId);

		if (!taskDefinition || !taskOccurrence) {
			return failure(new ResourceNotFoundError('Task definition or occurrence not found', 'RESOURCE_NOT_FOUND_ERROR'));
		}

		const recurrenceRule = await this.recurrenceRuleRepository.findById(taskDefinition.recurrenceRuleId.toString());

		if (!recurrenceRule) {
			return failure(new ResourceNotFoundError('Recurrence rule not found', 'RESOURCE_NOT_FOUND_ERROR'));
		}

		if (taskDefinition.userId.toString() !== userId) {
			return failure(
				new BadRequestError(
					'The task does not belong to the user. Therefore, the action cannot proceed.',
					'BAD_REQUEST_ERROR'
				)
			);
		}

		if (taskOccurrence.status === 'COMPLETED' && taskOccurrence.completedAt) {
			taskOccurrence.status = 'PENDING';
			taskOccurrence.completedAt = null;
		} else {
			taskOccurrence.complete();

			const existingPendingOccurrences = await this.taskOccurrenceRepository.findManyByTaskDefinition(
				taskDefinitionId,
				{
					status: 'PENDING',
				}
			);

			const anyFutureOccurrences = existingPendingOccurrences.some((occ) => dayjs(occ.occurrenceDateTime).isAfter());

			if (!anyFutureOccurrences) {
				const now = new Date();
				const generateOccurrences = this.occurrencesPlanner.generateInitialOccurrences({
					rule: recurrenceRule,
					fromDate: now,
					horizonDays: 1,
				});

				if (generateOccurrences.length > 0) {
					const firstOccurrenceDay = generateOccurrences[0];

					const occurrence = TaskOccurrence.create({
						taskDefinitionId: taskDefinition.id,
						occurrenceDateTime: firstOccurrenceDay,
						status: 'PENDING',
						createdAt: new Date(),
					});

					await this.taskOccurrenceRepository.create(occurrence);
				}
			}
		}

		await this.taskOccurrenceRepository.update(taskOccurrence);

		return success({ taskOccurrence });
	}
}
