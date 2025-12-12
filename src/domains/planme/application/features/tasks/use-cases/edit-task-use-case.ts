import { injectable } from 'tsyringe';

import { failure, Outcome, success } from '@/core/outcome';
import { BadRequestError } from '@/core/errors/bad-request-errors';
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error';
import { ITaskDefinitionRepository } from '../repositories/task-definition-repository';
import { IRecurrenceRuleRepository } from '../repositories/recurrence-rule-repository';
import { ITaskOccurrenceRepository } from '../repositories/task-occurrence-repository';
import { TaskOccurrencesPlanner } from '../../recurrence/services/task-occurrences-planner';
import { ITaskPriority, TaskDefinition } from '@/domains/planme/models/entities/task-definition';
import {
	IRecurrenceEndType,
	IRecurrenceFrequency,
	RecurrenceRule,
} from '@/domains/planme/models/entities/recurrence-rule';
import { TaskOccurrence } from '@/domains/planme/models/entities/task-occurrence';

interface IRequest {
	userId: string;
	taskDefinitionId: string;
	title?: string;
	description?: string | null;
	deadline?: Date | null;
	priority?: ITaskPriority;
	isAllDay?: boolean;
	recurrence?: {
		frequency?: IRecurrenceFrequency;
		endType?: IRecurrenceEndType;
		startDateTime?: Date;
		endDate?: Date | null;
		interval?: number | null;
		weekdaysBitmask?: number | null;
		dayOfMonth?: number | null;
		weekOfMonth?: number | null;
		weekdayOfMonth?: number | null;
		maxOccurrences?: number;
	};
}

type Response = Outcome<
	ResourceNotFoundError | BadRequestError,
	{ taskDefinition: TaskDefinition; recurrenceRule: RecurrenceRule }
>;

@injectable()
export class EditTaskUseCase {
	constructor(
		private taskDefinitionRepository: ITaskDefinitionRepository,
		private recurrenceRuleRepository: IRecurrenceRuleRepository,
		private taskOccurrenceRepository: ITaskOccurrenceRepository,
		private occurrencesPlanner: TaskOccurrencesPlanner
	) {}

	async execute({
		userId,
		taskDefinitionId,
		title,
		description,
		deadline,
		priority,
		isAllDay,
		recurrence,
	}: IRequest): Promise<Response> {
		const taskDefinition = await this.taskDefinitionRepository.findById(taskDefinitionId);

		if (!taskDefinition) {
			return failure(new ResourceNotFoundError('Task definition not found', 'RESOURCE_NOT_FOUND_ERROR'));
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

		recurrenceRule.frequency = recurrence?.frequency ?? recurrenceRule.frequency;
		recurrenceRule.endType = recurrence?.endType ?? recurrenceRule.endType;
		recurrenceRule.startDateTime = recurrence?.startDateTime ?? recurrenceRule.startDateTime;
		recurrenceRule.endDate = recurrence?.endDate ?? recurrenceRule.endDate;
		recurrenceRule.interval = recurrence?.interval ?? recurrenceRule.interval;
		recurrenceRule.weekdaysBitmask = recurrence?.weekdaysBitmask ?? recurrenceRule.weekdaysBitmask;
		recurrenceRule.dayOfMonth = recurrence?.dayOfMonth ?? recurrenceRule.dayOfMonth;
		recurrenceRule.weekOfMonth = recurrence?.weekOfMonth ?? recurrenceRule.weekOfMonth;
		recurrenceRule.weekdayOfMonth = recurrence?.weekdayOfMonth ?? recurrenceRule.weekdayOfMonth;
		recurrenceRule.maxOccurrences = recurrence?.maxOccurrences ?? recurrenceRule.maxOccurrences;

		taskDefinition.title = title ?? taskDefinition.title;
		taskDefinition.description = description ?? taskDefinition.description;
		taskDefinition.deadline = deadline ?? taskDefinition.deadline;
		taskDefinition.priority = priority ?? taskDefinition.priority;
		taskDefinition.isAllDay = isAllDay ?? taskDefinition.isAllDay;

		await this.recurrenceRuleRepository.update(recurrenceRule);
		await this.taskDefinitionRepository.update(taskDefinition);

		const occurrences = await this.taskOccurrenceRepository.findManyByTaskDefinition(taskDefinitionId);

		const pendingToDelete = occurrences.filter((occ) => occ.status === 'PENDING');

		await this.taskOccurrenceRepository.deleteMany(pendingToDelete);

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

		return success({ taskDefinition, recurrenceRule });
	}
}
