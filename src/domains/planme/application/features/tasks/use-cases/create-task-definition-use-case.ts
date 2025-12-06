import { injectable } from 'tsyringe';

import { Outcome, success } from '@/core/outcome';
import { UniqueEntityId } from '@/core/entities/unique-entity-id';
import { BadRequestError } from '@/core/errors/bad-request-errors';
import { ITaskDefinitionRepository } from '../repositories/task-definition-repository';
import { IRecurrenceRuleRepository } from '../repositories/recurrence-rule-repository';
import { ITaskPriority, TaskDefinition } from '@/domains/planme/models/entities/task-definition';
import {
	IRecurrenceEndType,
	IRecurrenceFrequency,
	RecurrenceRule,
} from '@/domains/planme/models/entities/recurrence-rule';

interface IRequest {
	userId: string;
	title: string;
	description?: string | null;
	deadline?: Date | null;
	priority: ITaskPriority;
	isAllDay: boolean;
	recurrence: {
		frequency: IRecurrenceFrequency;
		endType?: IRecurrenceEndType;
		startDateTime: Date;
		endDate?: Date | null;
		interval?: number | null;
		weekdaysBitmask?: number | null;
		dayOfMonth?: number | null;
		weekOfMonth?: number | null;
		weekdayOfMonth?: number | null;
		maxOccurrences?: number;
	};
}

type Response = Outcome<BadRequestError, { taskDefinition: TaskDefinition; recurrenceRule: RecurrenceRule }>;

@injectable()
export class CreateTaskDefinition {
	constructor(
		private taskDefinitionRepository: ITaskDefinitionRepository,
		private recurrenceRuleRepository: IRecurrenceRuleRepository
	) {}

	async execute({ userId, title, description, deadline, priority, isAllDay, recurrence }: IRequest): Promise<Response> {
		const recurrenceRule = RecurrenceRule.create({
			frequency: recurrence.frequency,
			endType: recurrence.endType,
			startDateTime: recurrence.startDateTime,
			endDate: recurrence.endDate,
			interval: recurrence.interval,
			weekdaysBitmask: recurrence.weekdaysBitmask,
			dayOfMonth: recurrence.dayOfMonth,
			weekOfMonth: recurrence.weekOfMonth,
			weekdayOfMonth: recurrence.weekdayOfMonth,
			maxOccurrences: recurrence.maxOccurrences,
		});

		const taskDefinition = TaskDefinition.create({
			userId: new UniqueEntityId(userId),
			recurrenceRuleId: recurrenceRule.id,
			title,
			description,
			deadline,
			priority,
			isAllDay,
		});

		await this.recurrenceRuleRepository.create(recurrenceRule);
		await this.taskDefinitionRepository.create(taskDefinition);

		return success({ taskDefinition, recurrenceRule });
	}
}
