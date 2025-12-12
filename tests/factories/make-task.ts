import { faker } from '@faker-js/faker';

import { UniqueEntityId } from '@/core/entities/unique-entity-id';
import { ISubtaskProps, Subtask } from '@/domains/planme/models/entities/subtask';
import { IRecurrenceRuleProps, RecurrenceRule } from '@/domains/planme/models/entities/recurrence-rule';
import { ITaskDefinitionProps, TaskDefinition } from '@/domains/planme/models/entities/task-definition';
import { ITaskOccurrenceProps, TaskOccurrence } from '@/domains/planme/models/entities/task-occurrence';

export function makeRecurrenceRule(override: Partial<IRecurrenceRuleProps> = {}, id?: UniqueEntityId) {
	const recurrenceRule = RecurrenceRule.create(
		{
			frequency: 'DAILY_INTERVAL',
			interval: 1,
			endType: 'AFTER_OCCURRENCES',
			maxOccurrences: 5,
			startDateTime: new Date(),
			...override,
		},
		id
	);

	return recurrenceRule;
}

export function makeTaskDefinition(override: Partial<ITaskDefinitionProps> = {}, id?: UniqueEntityId) {
	const taskDefinition = TaskDefinition.create(
		{
			title: faker.lorem.lines({ min: 1, max: 1 }),
			description: faker.lorem.paragraph(),
			recurrenceRuleId: new UniqueEntityId(),
			userId: new UniqueEntityId(),
			...override,
		},
		id
	);

	return taskDefinition;
}

export function makeTaskOccurrence(override: Partial<ITaskOccurrenceProps> = {}, id?: UniqueEntityId) {
	const taskOccurrence = TaskOccurrence.create(
		{
			taskDefinitionId: new UniqueEntityId(),
			occurrenceDateTime: new Date(),
			createdAt: new Date(),
			...override,
		},
		id
	);

	return taskOccurrence;
}

export function makeSubtask(override: Partial<ISubtaskProps> = {}, id?: UniqueEntityId) {
	const subtask = Subtask.create(
		{
			taskDefinitionId: new UniqueEntityId(),
			title: faker.lorem.lines({ min: 1, max: 1 }),
			description: faker.lorem.paragraph(),
			...override,
		},
		id
	);

	return subtask;
}
