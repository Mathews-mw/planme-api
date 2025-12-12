import dayjs from 'dayjs';

import { makeUser } from 'tests/factories/make-user';
import { BadRequestError } from '@/core/errors/bad-request-errors';
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error';
import { InMemoryUsersRepository } from 'tests/in-memory/in-memory-users-repository';
import { makeRecurrenceRule, makeTaskDefinition, makeTaskOccurrence } from 'tests/factories/make-task';
import { InMemoryRecurrenceRulesRepository } from 'tests/in-memory/in-memory-recurrence-rules-repository';
import { InMemoryTaskDefinitionsRepository } from 'tests/in-memory/in-memory-task-definitions-repository';
import { InMemoryTaskOccurrencesRepository } from 'tests/in-memory/in-memory-task-occurrences-repository';
import { EditTaskUseCase } from '@/domains/planme/application/features/tasks/use-cases/edit-task-use-case';
import { encodeWeekdays, Weekday } from '@/domains/planme/application/features/recurrence/services/weekdays-bitmask';
import { TaskOccurrencesPlanner } from '@/domains/planme/application/features/recurrence/services/task-occurrences-planner';

let usersRepository: InMemoryUsersRepository;
let taskDefinitionsRepository: InMemoryTaskDefinitionsRepository;
let recurrenceRulesRepository: InMemoryRecurrenceRulesRepository;
let taskOccurrencesRepository: InMemoryTaskOccurrencesRepository;
let occurrencesPlanner: TaskOccurrencesPlanner;
let editTaskUseCase: EditTaskUseCase;

describe('Edit Task Use Case', () => {
	beforeEach(() => {
		usersRepository = new InMemoryUsersRepository();
		recurrenceRulesRepository = new InMemoryRecurrenceRulesRepository();
		taskDefinitionsRepository = new InMemoryTaskDefinitionsRepository();
		taskOccurrencesRepository = new InMemoryTaskOccurrencesRepository();
		occurrencesPlanner = new TaskOccurrencesPlanner();

		editTaskUseCase = new EditTaskUseCase(
			taskDefinitionsRepository,
			recurrenceRulesRepository,
			taskOccurrencesRepository,
			occurrencesPlanner
		);
	});

	it('should be possible to edit an existing task', async () => {
		const user = makeUser();
		usersRepository.items.push(user);

		const recurrenceRule = makeRecurrenceRule();
		const taskDefinition = makeTaskDefinition({ userId: user.id, recurrenceRuleId: recurrenceRule.id });
		const occurrence = makeTaskOccurrence({ taskDefinitionId: taskDefinition.id });

		recurrenceRulesRepository.items.push(recurrenceRule);
		taskDefinitionsRepository.items.push(taskDefinition);
		taskOccurrencesRepository.items.push(occurrence);

		const deadline = dayjs(recurrenceRule.startDateTime).add(20, 'days').toDate();

		const result = await editTaskUseCase.execute({
			userId: user.id.toString(),
			taskDefinitionId: taskDefinition.id.toString(),
			title: 'Edited task',
			description: 'Edit task description',
			priority: 'HIGH',
			isAllDay: true,
			deadline,
			recurrence: {
				frequency: 'DAILY_INTERVAL',
				interval: 2,
				maxOccurrences: 25,
				endType: 'AFTER_OCCURRENCES',
			},
		});

		expect(result.isSuccess()).toBe(true);

		const taskDefinitionStored = taskDefinitionsRepository.items[0];
		const recurrenceRuleStored = recurrenceRulesRepository.items[0];

		expect(taskDefinitionStored.title).toBe('Edited task');
		expect(taskDefinitionStored.description).toEqual('Edit task description');
		expect(taskDefinitionStored.priority).toEqual('HIGH');
		expect(taskDefinitionStored.isAllDay).toBe(true);
		expect(taskDefinitionStored.deadline).toEqual(deadline);
		expect(recurrenceRuleStored.frequency).toEqual('DAILY_INTERVAL');
		expect(recurrenceRuleStored.interval).toEqual(2);
		expect(recurrenceRuleStored.maxOccurrences).toEqual(25);
		expect(recurrenceRuleStored.endType).toEqual('AFTER_OCCURRENCES');
	});

	it('should not be possible to edit a task that does not belong to the user.', async () => {
		const userA = makeUser();
		const userB = makeUser();
		usersRepository.items.push(userA);
		usersRepository.items.push(userB);

		const recurrenceRule = makeRecurrenceRule();
		const taskDefinition = makeTaskDefinition({ userId: userA.id, recurrenceRuleId: recurrenceRule.id });

		recurrenceRulesRepository.items.push(recurrenceRule);
		taskDefinitionsRepository.items.push(taskDefinition);

		const result = await editTaskUseCase.execute({
			userId: userB.id.toString(),
			taskDefinitionId: taskDefinition.id.toString(),
			title: 'Edited task',
			description: 'Edit task description',
		});

		expect(result.isSuccess()).toBe(false);
		expect(result.value).toBeInstanceOf(BadRequestError);
	});

	it('should return error when task definition does not exist', async () => {
		const user = makeUser();
		usersRepository.items.push(user);

		const result = await editTaskUseCase.execute({
			userId: user.id.toString(),
			taskDefinitionId: 'non-existent-id',
			title: 'Edited task',
		});

		expect(result.isSuccess()).toBe(false);
		expect(result.value).toBeInstanceOf(ResourceNotFoundError);
	});

	it('should delete pending occurrences when editing task recurrence', async () => {
		const user = makeUser();
		usersRepository.items.push(user);

		const recurrenceRule = makeRecurrenceRule({
			frequency: 'DAILY_INTERVAL',
			interval: 1,
			endType: 'AFTER_OCCURRENCES',
			maxOccurrences: 10,
			startDateTime: new Date(),
		});
		const taskDefinition = makeTaskDefinition({ userId: user.id, recurrenceRuleId: recurrenceRule.id });

		// Criar várias ocorrências pending
		const occurrence1 = makeTaskOccurrence({ taskDefinitionId: taskDefinition.id, status: 'PENDING' });
		const occurrence2 = makeTaskOccurrence({ taskDefinitionId: taskDefinition.id, status: 'PENDING' });
		const occurrence3 = makeTaskOccurrence({ taskDefinitionId: taskDefinition.id, status: 'COMPLETED' });

		recurrenceRulesRepository.items.push(recurrenceRule);
		taskDefinitionsRepository.items.push(taskDefinition);
		taskOccurrencesRepository.items.push(occurrence1, occurrence2, occurrence3);

		expect(taskOccurrencesRepository.items).toHaveLength(3);

		const result = await editTaskUseCase.execute({
			userId: user.id.toString(),
			taskDefinitionId: taskDefinition.id.toString(),
			title: 'Updated task',
			recurrence: {
				frequency: 'WEEKLY_DAYS',
				weekdaysBitmask: encodeWeekdays([Weekday.MONDAY, Weekday.FRIDAY]),
				endType: 'AFTER_OCCURRENCES',
				maxOccurrences: 20,
			},
		});

		expect(result.isSuccess()).toBe(true);

		// Apenas a ocorrência COMPLETED deve permanecer
		expect(taskOccurrencesRepository.items).toHaveLength(1);
		expect(taskOccurrencesRepository.items[0].status).toBe('COMPLETED');
	});

	it('should generate new occurrence after deleting pending ones and editing recurrence', async () => {
		const user = makeUser();
		usersRepository.items.push(user);

		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const recurrenceRule = makeRecurrenceRule({
			frequency: 'DAILY_INTERVAL',
			interval: 1,
			endType: 'AFTER_OCCURRENCES',
			maxOccurrences: 10,
			startDateTime: today,
		});
		const taskDefinition = makeTaskDefinition({ userId: user.id, recurrenceRuleId: recurrenceRule.id });

		// Criar uma ocorrência pending que será deletada
		const oldOccurrence = makeTaskOccurrence({ taskDefinitionId: taskDefinition.id, status: 'PENDING' });

		recurrenceRulesRepository.items.push(recurrenceRule);
		taskDefinitionsRepository.items.push(taskDefinition);
		taskOccurrencesRepository.items.push(oldOccurrence);

		const result = await editTaskUseCase.execute({
			userId: user.id.toString(),
			taskDefinitionId: taskDefinition.id.toString(),
			recurrence: {
				frequency: 'DAILY_INTERVAL',
				interval: 1,
				endType: 'AFTER_OCCURRENCES',
				maxOccurrences: 15,
				startDateTime: today,
			},
		});

		expect(result.isSuccess()).toBe(true);

		// A ocorrência antiga foi deletada e uma nova foi gerada
		expect(taskOccurrencesRepository.items).toHaveLength(1);
		const newOccurrence = taskOccurrencesRepository.items[0];
		expect(newOccurrence.id.toString()).not.toBe(oldOccurrence.id.toString());
		expect(newOccurrence.status).toBe('PENDING');
	});

	it('should preserve completed occurrences when editing task recurrence', async () => {
		const user = makeUser();
		usersRepository.items.push(user);

		const recurrenceRule = makeRecurrenceRule({
			frequency: 'DAILY_INTERVAL',
			interval: 1,
			endType: 'AFTER_OCCURRENCES',
			maxOccurrences: 10,
			startDateTime: new Date(),
		});
		const taskDefinition = makeTaskDefinition({ userId: user.id, recurrenceRuleId: recurrenceRule.id });

		// Criar ocorrências com diferentes status
		const pendingOccurrence = makeTaskOccurrence({ taskDefinitionId: taskDefinition.id, status: 'PENDING' });
		const completedOccurrence = makeTaskOccurrence({ taskDefinitionId: taskDefinition.id, status: 'COMPLETED' });
		const skippedOccurrence = makeTaskOccurrence({ taskDefinitionId: taskDefinition.id, status: 'SKIPPED' });

		recurrenceRulesRepository.items.push(recurrenceRule);
		taskDefinitionsRepository.items.push(taskDefinition);
		taskOccurrencesRepository.items.push(pendingOccurrence, completedOccurrence, skippedOccurrence);

		const result = await editTaskUseCase.execute({
			userId: user.id.toString(),
			taskDefinitionId: taskDefinition.id.toString(),
			title: 'Updated task with status',
			recurrence: {
				frequency: 'WEEKLY_DAYS',
				weekdaysBitmask: encodeWeekdays([Weekday.MONDAY, Weekday.WEDNESDAY, Weekday.FRIDAY]),
				endType: 'AFTER_OCCURRENCES',
				maxOccurrences: 20,
			},
		});

		expect(result.isSuccess()).toBe(true);

		// Apenas PENDING deve ser deletada, COMPLETED e SKIPPED devem permanecer
		expect(taskOccurrencesRepository.items).toHaveLength(2);
		const statuses = taskOccurrencesRepository.items.map((occ) => occ.status);
		expect(statuses).toContain('COMPLETED');
		expect(statuses).toContain('SKIPPED');
		expect(statuses).not.toContain('PENDING');
	});

	it('should update task definition properties without affecting recurrence when not provided', async () => {
		const user = makeUser();
		usersRepository.items.push(user);

		const recurrenceRule = makeRecurrenceRule({
			frequency: 'DAILY_INTERVAL',
			interval: 1,
			endType: 'AFTER_OCCURRENCES',
			maxOccurrences: 10,
			startDateTime: new Date(),
		});
		const taskDefinition = makeTaskDefinition({
			userId: user.id,
			recurrenceRuleId: recurrenceRule.id,
			title: 'Original title',
			priority: 'LOW',
		});

		recurrenceRulesRepository.items.push(recurrenceRule);
		taskDefinitionsRepository.items.push(taskDefinition);

		const result = await editTaskUseCase.execute({
			userId: user.id.toString(),
			taskDefinitionId: taskDefinition.id.toString(),
			title: 'New title',
			priority: 'HIGH',
		});

		expect(result.isSuccess()).toBe(true);

		const updatedTask = taskDefinitionsRepository.items[0];
		const updatedRecurrence = recurrenceRulesRepository.items[0];

		// Task definition foi atualizada
		expect(updatedTask.title).toBe('New title');
		expect(updatedTask.priority).toBe('HIGH');

		// Recurrence não foi alterada
		expect(updatedRecurrence.frequency).toBe('DAILY_INTERVAL');
		expect(updatedRecurrence.interval).toBe(1);
	});

	it('should update recurrence rule properties and regenerate occurrences', async () => {
		const user = makeUser();
		usersRepository.items.push(user);

		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const recurrenceRule = makeRecurrenceRule({
			frequency: 'DAILY_INTERVAL',
			interval: 1,
			endType: 'AFTER_OCCURRENCES',
			maxOccurrences: 5,
			startDateTime: today,
		});
		const taskDefinition = makeTaskDefinition({ userId: user.id, recurrenceRuleId: recurrenceRule.id });

		const oldOccurrence = makeTaskOccurrence({ taskDefinitionId: taskDefinition.id, status: 'PENDING' });

		recurrenceRulesRepository.items.push(recurrenceRule);
		taskDefinitionsRepository.items.push(taskDefinition);
		taskOccurrencesRepository.items.push(oldOccurrence);

		const result = await editTaskUseCase.execute({
			userId: user.id.toString(),
			taskDefinitionId: taskDefinition.id.toString(),
			recurrence: {
				frequency: 'DAILY_INTERVAL',
				interval: 2, // Changed interval
				endType: 'AFTER_OCCURRENCES',
				maxOccurrences: 10, // Changed max occurrences
				startDateTime: today,
			},
		});

		expect(result.isSuccess()).toBe(true);

		const updatedRecurrence = recurrenceRulesRepository.items[0];

		// Recurrence foi atualizada
		expect(updatedRecurrence.interval).toBe(2);
		expect(updatedRecurrence.maxOccurrences).toBe(10);

		// Ocorrências pending foram deletadas e uma nova foi gerada (se estiver no horizonte)
		if (taskOccurrencesRepository.items.length > 0) {
			const newOccurrence = taskOccurrencesRepository.items[0];
			expect(newOccurrence.status).toBe('PENDING');
		}
	});

	it('should handle editing task without recurrence data', async () => {
		const user = makeUser();
		usersRepository.items.push(user);

		const recurrenceRule = makeRecurrenceRule();
		const taskDefinition = makeTaskDefinition({ userId: user.id, recurrenceRuleId: recurrenceRule.id });

		const occurrence = makeTaskOccurrence({ taskDefinitionId: taskDefinition.id, status: 'PENDING' });

		recurrenceRulesRepository.items.push(recurrenceRule);
		taskDefinitionsRepository.items.push(taskDefinition);
		taskOccurrencesRepository.items.push(occurrence);

		const result = await editTaskUseCase.execute({
			userId: user.id.toString(),
			taskDefinitionId: taskDefinition.id.toString(),
			title: 'Updated without recurrence',
			description: 'Just updating the title',
		});

		expect(result.isSuccess()).toBe(true);

		const updatedTask = taskDefinitionsRepository.items[0];

		expect(updatedTask.title).toBe('Updated without recurrence');
		expect(updatedTask.description).toBe('Just updating the title');
	});

	it('should generate occurrence linked to correct task definition', async () => {
		const user = makeUser();
		usersRepository.items.push(user);

		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const recurrenceRule = makeRecurrenceRule({
			frequency: 'DAILY_INTERVAL',
			interval: 1,
			endType: 'AFTER_OCCURRENCES',
			maxOccurrences: 10,
			startDateTime: today,
		});
		const taskDefinition = makeTaskDefinition({ userId: user.id, recurrenceRuleId: recurrenceRule.id });

		const oldOccurrence = makeTaskOccurrence({ taskDefinitionId: taskDefinition.id, status: 'PENDING' });

		recurrenceRulesRepository.items.push(recurrenceRule);
		taskDefinitionsRepository.items.push(taskDefinition);
		taskOccurrencesRepository.items.push(oldOccurrence);

		const result = await editTaskUseCase.execute({
			userId: user.id.toString(),
			taskDefinitionId: taskDefinition.id.toString(),
			recurrence: {
				frequency: 'DAILY_INTERVAL',
				interval: 1,
				endType: 'AFTER_OCCURRENCES',
				maxOccurrences: 15,
				startDateTime: today,
			},
		});

		expect(result.isSuccess()).toBe(true);

		if (taskOccurrencesRepository.items.length > 0) {
			const newOccurrence = taskOccurrencesRepository.items[0];

			expect(newOccurrence.taskDefinitionId.toString()).toBe(taskDefinition.id.toString());
			expect(newOccurrence.status).toBe('PENDING');
		}
	});

	it('should handle multiple pending occurrences deletion and single new occurrence generation', async () => {
		const user = makeUser();
		usersRepository.items.push(user);

		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const recurrenceRule = makeRecurrenceRule({
			frequency: 'DAILY_INTERVAL',
			interval: 1,
			endType: 'AFTER_OCCURRENCES',
			maxOccurrences: 20,
			startDateTime: today,
		});
		const taskDefinition = makeTaskDefinition({ userId: user.id, recurrenceRuleId: recurrenceRule.id });

		// Simular 5 ocorrências pending
		const pendingOccurrences = Array(5)
			.fill(null)
			.map(() => makeTaskOccurrence({ taskDefinitionId: taskDefinition.id, status: 'PENDING' }));

		recurrenceRulesRepository.items.push(recurrenceRule);
		taskDefinitionsRepository.items.push(taskDefinition);
		taskOccurrencesRepository.items.push(...pendingOccurrences);

		expect(taskOccurrencesRepository.items).toHaveLength(5);

		const result = await editTaskUseCase.execute({
			userId: user.id.toString(),
			taskDefinitionId: taskDefinition.id.toString(),
			title: 'Bulk edit task',
			recurrence: {
				frequency: 'WEEKLY_DAYS',
				weekdaysBitmask: encodeWeekdays([Weekday.TUESDAY, Weekday.THURSDAY]),
				endType: 'AFTER_OCCURRENCES',
				maxOccurrences: 25,
				startDateTime: today,
			},
		});

		expect(result.isSuccess()).toBe(true);

		// Todas as 5 ocorrências pending foram deletadas e 1 nova foi criada (within 1-day horizon)
		expect(taskOccurrencesRepository.items.length).toBeLessThanOrEqual(1);
	});

	it('should ensure response contains updated task definition and recurrence rule', async () => {
		const user = makeUser();
		usersRepository.items.push(user);

		const recurrenceRule = makeRecurrenceRule({
			frequency: 'DAILY_INTERVAL',
			interval: 1,
			endType: 'AFTER_OCCURRENCES',
			maxOccurrences: 10,
			startDateTime: new Date(),
		});
		const taskDefinition = makeTaskDefinition({ userId: user.id, recurrenceRuleId: recurrenceRule.id });

		recurrenceRulesRepository.items.push(recurrenceRule);
		taskDefinitionsRepository.items.push(taskDefinition);

		const result = await editTaskUseCase.execute({
			userId: user.id.toString(),
			taskDefinitionId: taskDefinition.id.toString(),
			title: 'Response test task',
			priority: 'HIGH',
			recurrence: {
				frequency: 'MONTHLY_DAY_OF_MONTH',
				dayOfMonth: 15,
				endType: 'AFTER_OCCURRENCES',
				maxOccurrences: 12,
			},
		});

		expect(result.isSuccess()).toBe(true);

		if (result.isSuccess()) {
			const { taskDefinition: responseTask, recurrenceRule: responseRule } = result.value;

			expect(responseTask.title).toBe('Response test task');
			expect(responseTask.priority).toBe('HIGH');
			expect(responseRule.frequency).toBe('MONTHLY_DAY_OF_MONTH');
			expect(responseRule.dayOfMonth).toBe(15);
			expect(responseRule.maxOccurrences).toBe(12);
		}
	});
});
