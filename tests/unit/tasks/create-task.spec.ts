import { describe, it, expect, beforeEach } from 'vitest';

import { makeUser } from 'tests/factories/make-user';
import { InMemoryUsersRepository } from 'tests/in-memory/in-memory-users-repository';
import { InMemoryRecurrenceRulesRepository } from 'tests/in-memory/in-memory-recurrence-rules-repository';
import { InMemoryTaskDefinitionsRepository } from 'tests/in-memory/in-memory-task-definitions-repository';
import { InMemoryTaskOccurrencesRepository } from 'tests/in-memory/in-memory-task-occurrences-repository';
import { CreateTaskUseCase } from '@/domains/planme/application/features/tasks/use-cases/create-task-use-case';
import { encodeWeekdays, Weekday } from '@/domains/planme/application/features/recurrence/services/weekdays-bitmask';
import { TaskOccurrencesPlanner } from '@/domains/planme/application/features/recurrence/services/task-occurrences-planner';

let usersRepository: InMemoryUsersRepository;
let recurrenceRulesRepository: InMemoryRecurrenceRulesRepository;
let taskDefinitionsRepository: InMemoryTaskDefinitionsRepository;
let taskOccurrencesRepository: InMemoryTaskOccurrencesRepository;
let occurrencesPlanner: TaskOccurrencesPlanner;
let createTaskUseCase: CreateTaskUseCase;

describe('Create Task Use Case', () => {
	beforeEach(() => {
		usersRepository = new InMemoryUsersRepository();
		recurrenceRulesRepository = new InMemoryRecurrenceRulesRepository();
		taskDefinitionsRepository = new InMemoryTaskDefinitionsRepository();
		taskOccurrencesRepository = new InMemoryTaskOccurrencesRepository();
		occurrencesPlanner = new TaskOccurrencesPlanner();

		createTaskUseCase = new CreateTaskUseCase(
			taskDefinitionsRepository,
			recurrenceRulesRepository,
			taskOccurrencesRepository,
			occurrencesPlanner
		);
	});

	it('should create a task without repetition (frequency = NONE & endType = ONCE)', async () => {
		const user = makeUser();
		usersRepository.items.push(user);

		const taskStartDateTime = new Date();

		const result = await createTaskUseCase.execute({
			userId: user.id.toString(),
			title: 'New Task',
			description: 'New task description',
			recurrence: {
				frequency: 'NONE',
				startDateTime: taskStartDateTime,
				maxOccurrences: 1,
			},
		});

		expect(result.isSuccess()).toBe(true);

		const taskDefinitionStored = taskDefinitionsRepository.items[0];
		const recurrenceRuleStored = recurrenceRulesRepository.items[0];

		expect(taskDefinitionStored.userId).toEqual(user.id);
		expect(taskDefinitionStored.recurrenceRuleId).toEqual(recurrenceRuleStored.id);
		expect(recurrenceRuleStored.frequency).toEqual('NONE');
		expect(recurrenceRuleStored.endType).toEqual('ONCE');
		expect(recurrenceRuleStored.startDateTime).toEqual(taskStartDateTime);
	});

	it('should create a task with daily interval recurrence and generate first occurrence', async () => {
		const user = makeUser();
		usersRepository.items.push(user);

		// Usar hoje como start date para garantir que haja uma ocorrência dentro do horizonte
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const tomorrow = new Date(today);
		tomorrow.setDate(tomorrow.getDate() + 31);

		const result = await createTaskUseCase.execute({
			userId: user.id.toString(),
			title: 'Daily Task',
			description: 'Task that repeats daily',
			recurrence: {
				frequency: 'DAILY_INTERVAL',
				endType: 'ON_DATE',
				startDateTime: today,
				endDate: tomorrow,
				interval: 1,
			},
		});

		expect(result.isSuccess()).toBe(true);

		const taskDefinitionStored = taskDefinitionsRepository.items[0];
		const recurrenceRuleStored = recurrenceRulesRepository.items[0];

		expect(taskDefinitionStored.title).toBe('Daily Task');
		expect(recurrenceRuleStored.frequency).toEqual('DAILY_INTERVAL');
		expect(recurrenceRuleStored.endType).toEqual('ON_DATE');
		expect(recurrenceRuleStored.interval).toBe(1);

		// Validar que a primeira ocorrência foi gerada
		expect(taskOccurrencesRepository.items.length).toBeGreaterThan(0);

		const occurrenceStored = taskOccurrencesRepository.items[0];

		expect(occurrenceStored.taskDefinitionId.toString()).toEqual(taskDefinitionStored.id.toString());
		expect(occurrenceStored.status).toEqual('PENDING');
	});

	it('should create a task with weekly recurrence with specific weekdays (frequency = WEEKLY_DAYS)', async () => {
		const user = makeUser();
		usersRepository.items.push(user);

		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const weekdays = [Weekday.MONDAY, Weekday.WEDNESDAY, Weekday.FRIDAY];
		const weekdaysBitmask = encodeWeekdays(weekdays);

		const result = await createTaskUseCase.execute({
			userId: user.id.toString(),
			title: 'Weekly Task',
			description: 'Task that repeats on specific weekdays',
			recurrence: {
				frequency: 'WEEKLY_DAYS',
				endType: 'AFTER_OCCURRENCES',
				startDateTime: today,
				weekdaysBitmask: weekdaysBitmask,
				maxOccurrences: 10,
			},
		});

		expect(result.isSuccess()).toBe(true);

		const taskDefinitionStored = taskDefinitionsRepository.items[0];
		const recurrenceRuleStored = recurrenceRulesRepository.items[0];

		expect(recurrenceRuleStored.frequency).toEqual('WEEKLY_DAYS');
		expect(recurrenceRuleStored.weekdaysBitmask).toBe(weekdaysBitmask);
		expect(recurrenceRuleStored.maxOccurrences).toBe(10);

		// Validar que a primeira ocorrência foi gerada (se houver no horizonte de 1 dia)
		if (taskOccurrencesRepository.items.length > 0) {
			const occurrenceStored = taskOccurrencesRepository.items[0];
			expect(occurrenceStored.taskDefinitionId.toString()).toEqual(taskDefinitionStored.id.toString());
			expect(occurrenceStored.status).toEqual('PENDING');
		}
	});

	it('should create a task with monthly day of month recurrence (frequency = MONTHLY_DAY_OF_MONTH)', async () => {
		const user = makeUser();
		usersRepository.items.push(user);

		const taskStartDateTime = new Date();

		const result = await createTaskUseCase.execute({
			userId: user.id.toString(),
			title: 'Monthly Task',
			description: 'Task that repeats on specific day of month',
			priority: 'HIGH',
			recurrence: {
				frequency: 'MONTHLY_DAY_OF_MONTH',
				endType: 'AFTER_OCCURRENCES',
				startDateTime: taskStartDateTime,
				dayOfMonth: 15,
				maxOccurrences: 12,
			},
		});

		expect(result.isSuccess()).toBe(true);

		const taskDefinitionStored = taskDefinitionsRepository.items[0];
		const recurrenceRuleStored = recurrenceRulesRepository.items[0];

		expect(recurrenceRuleStored.frequency).toEqual('MONTHLY_DAY_OF_MONTH');
		expect(recurrenceRuleStored.dayOfMonth).toBe(15);
		expect(taskDefinitionStored.priority).toBe('HIGH');
		expect(recurrenceRuleStored.maxOccurrences).toBe(12);
	});

	it('should create a task with monthly weekday of month recurrence (frequency = MONTHLY_WEEKDAYS_OF_MONTH)', async () => {
		const user = makeUser();
		usersRepository.items.push(user);

		const taskStartDateTime = new Date();

		const result = await createTaskUseCase.execute({
			userId: user.id.toString(),
			title: 'Nth Weekday Monthly Task',
			recurrence: {
				frequency: 'MONTHLY_WEEKDAYS_OF_MONTH',
				endType: 'AFTER_OCCURRENCES',
				startDateTime: taskStartDateTime,
				weekOfMonth: 3, // 3rd occurrence
				weekdayOfMonth: 3, // Wednesday
				maxOccurrences: 12,
			},
		});

		expect(result.isSuccess()).toBe(true);

		const recurrenceRuleStored = recurrenceRulesRepository.items[0];

		expect(recurrenceRuleStored.frequency).toEqual('MONTHLY_WEEKDAYS_OF_MONTH');
		expect(recurrenceRuleStored.weekOfMonth).toBe(3);
		expect(recurrenceRuleStored.weekdayOfMonth).toBe(3);
	});

	it('should create a task with yearly interval recurrence (frequency = YEARLY_INTERVAL)', async () => {
		const user = makeUser();
		usersRepository.items.push(user);

		const taskStartDateTime = new Date();

		const result = await createTaskUseCase.execute({
			userId: user.id.toString(),
			title: 'Yearly Task',
			description: 'Annual task',
			recurrence: {
				frequency: 'YEARLY_INTERVAL',
				endType: 'NEVER',
				startDateTime: taskStartDateTime,
				interval: 1,
			},
		});

		expect(result.isSuccess()).toBe(true);

		const recurrenceRuleStored = recurrenceRulesRepository.items[0];

		expect(recurrenceRuleStored.frequency).toEqual('YEARLY_INTERVAL');
		expect(recurrenceRuleStored.endType).toEqual('NEVER');
		expect(recurrenceRuleStored.interval).toBe(1);
	});

	it('should create a task with all optional properties', async () => {
		const user = makeUser();
		usersRepository.items.push(user);

		const taskStartDateTime = new Date();
		const deadline = new Date();
		deadline.setDate(deadline.getDate() + 7);

		const result = await createTaskUseCase.execute({
			userId: user.id.toString(),
			title: 'Complete Task',
			description: 'Task with all properties defined',
			deadline: deadline,
			priority: 'HIGH',
			isAllDay: true,
			recurrence: {
				frequency: 'DAILY_INTERVAL',
				endType: 'ON_DATE',
				startDateTime: taskStartDateTime,
				endDate: new Date(),
				interval: 2,
			},
		});

		expect(result.isSuccess()).toBe(true);

		const taskDefinitionStored = taskDefinitionsRepository.items[0];

		expect(taskDefinitionStored.title).toBe('Complete Task');
		expect(taskDefinitionStored.description).toBe('Task with all properties defined');
		expect(taskDefinitionStored.deadline).toEqual(deadline);
		expect(taskDefinitionStored.priority).toBe('HIGH');
		expect(taskDefinitionStored.isAllDay).toBe(true);
		expect(taskDefinitionStored.isStarred).toBe(false); // Default value
	});

	it('should persist task definition with correct user ID', async () => {
		const user = makeUser();
		usersRepository.items.push(user);

		const result = await createTaskUseCase.execute({
			userId: user.id.toString(),
			title: 'User Task',
			recurrence: {
				frequency: 'NONE',
				startDateTime: new Date(),
			},
		});

		expect(result.isSuccess()).toBe(true);

		const taskDefinitionStored = taskDefinitionsRepository.items[0];

		expect(taskDefinitionStored.userId.toString()).toBe(user.id.toString());
	});

	it('should create both task definition and recurrence rule on database', async () => {
		const user = makeUser();
		usersRepository.items.push(user);

		const result = await createTaskUseCase.execute({
			userId: user.id.toString(),
			title: 'New Task',
			recurrence: {
				frequency: 'WEEKLY_DAYS',
				startDateTime: new Date(),
				weekdaysBitmask: 0b1111111, // All weekdays
			},
		});

		expect(result.isSuccess()).toBe(true);
		expect(taskDefinitionsRepository.items).toHaveLength(1);
		expect(recurrenceRulesRepository.items).toHaveLength(1);
	});

	it('should link task definition with recurrence rule', async () => {
		const user = makeUser();
		usersRepository.items.push(user);

		const result = await createTaskUseCase.execute({
			userId: user.id.toString(),
			title: 'Linked Task',
			recurrence: {
				frequency: 'NONE',
				startDateTime: new Date(),
			},
		});

		expect(result.isSuccess()).toBe(true);

		const taskDefinitionStored = taskDefinitionsRepository.items[0];
		const recurrenceRuleStored = recurrenceRulesRepository.items[0];

		expect(taskDefinitionStored.recurrenceRuleId).toEqual(recurrenceRuleStored.id);
	});

	it('should return the created task definition and recurrence rule in the response', async () => {
		const user = makeUser();
		usersRepository.items.push(user);

		const result = await createTaskUseCase.execute({
			userId: user.id.toString(),
			title: 'Response Task',
			recurrence: {
				frequency: 'NONE',
				startDateTime: new Date(),
			},
		});

		expect(result.isSuccess()).toBe(true);

		if (result.isSuccess()) {
			const { taskDefinition, recurrenceRule } = result.value;

			expect(taskDefinition).toBeDefined();
			expect(taskDefinition.title).toBe('Response Task');
			expect(recurrenceRule).toBeDefined();
			expect(recurrenceRule.frequency).toBe('NONE');
		}
	});

	it('should handle task with only title and recurrence frequency', async () => {
		const user = makeUser();
		usersRepository.items.push(user);

		const result = await createTaskUseCase.execute({
			userId: user.id.toString(),
			title: 'Minimal Task',
			recurrence: {
				frequency: 'NONE',
				startDateTime: new Date(),
			},
		});

		expect(result.isSuccess()).toBe(true);

		const taskDefinitionStored = taskDefinitionsRepository.items[0];

		expect(taskDefinitionStored.title).toBe('Minimal Task');
		expect(taskDefinitionStored.description).toBeUndefined();
		expect(taskDefinitionStored.deadline).toBeUndefined();
	});

	it('should not generate occurrences for NONE frequency tasks (horizon = 1 day)', async () => {
		const user = makeUser();
		usersRepository.items.push(user);

		const result = await createTaskUseCase.execute({
			userId: user.id.toString(),
			title: 'Non-recurring Task',
			recurrence: {
				frequency: 'NONE',
				startDateTime: new Date(),
				maxOccurrences: 1,
			},
		});

		expect(result.isSuccess()).toBe(true);

		// Para frequência NONE, não devem ser geradas ocorrências
		expect(taskOccurrencesRepository.items).toHaveLength(0);
	});

	it('should generate initial occurrence for daily recurring task within horizon', async () => {
		const user = makeUser();
		usersRepository.items.push(user);

		const taskStartDateTime = new Date('2025-12-11T10:00:00');

		const result = await createTaskUseCase.execute({
			userId: user.id.toString(),
			title: 'Daily Recurring Task',
			recurrence: {
				frequency: 'DAILY_INTERVAL',
				endType: 'AFTER_OCCURRENCES',
				startDateTime: taskStartDateTime,
				interval: 1,
				maxOccurrences: 30,
			},
		});

		expect(result.isSuccess()).toBe(true);

		// Deve gerar pelo menos uma ocorrência dentro do horizonte de 1 dia
		expect(taskOccurrencesRepository.items.length).toBeGreaterThan(0);

		const taskDefinitionStored = taskDefinitionsRepository.items[0];
		const firstOccurrence = taskOccurrencesRepository.items[0];

		expect(firstOccurrence.taskDefinitionId.toString()).toEqual(taskDefinitionStored.id.toString());
		expect(firstOccurrence.status).toEqual('PENDING');
		expect(firstOccurrence.createdAt).toBeDefined();
	});

	it('should link initial occurrences with correct task definition', async () => {
		const user = makeUser();
		usersRepository.items.push(user);

		const result = await createTaskUseCase.execute({
			userId: user.id.toString(),
			title: 'Weekly Recurring Task',
			recurrence: {
				frequency: 'WEEKLY_DAYS',
				endType: 'AFTER_OCCURRENCES',
				startDateTime: new Date(),
				weekdaysBitmask: encodeWeekdays([Weekday.MONDAY, Weekday.FRIDAY]),
				maxOccurrences: 8,
			},
		});

		expect(result.isSuccess()).toBe(true);

		const taskDefinitionStored = taskDefinitionsRepository.items[0];

		// Verificar que todas as ocorrências geradas estão vinculadas à task definition correta
		taskOccurrencesRepository.items.forEach((occurrence) => {
			expect(occurrence.taskDefinitionId.toString()).toEqual(taskDefinitionStored.id.toString());
		});
	});

	it('should create task with occurrences having pending status', async () => {
		const user = makeUser();
		usersRepository.items.push(user);

		const result = await createTaskUseCase.execute({
			userId: user.id.toString(),
			title: 'Task with Pending Occurrences',
			recurrence: {
				frequency: 'DAILY_INTERVAL',
				endType: 'ON_DATE',
				startDateTime: new Date('2025-12-12T09:00:00'),
				endDate: new Date('2025-12-20T23:59:59'),
				interval: 1,
			},
		});

		expect(result.isSuccess()).toBe(true);

		// Todas as ocorrências devem ter status PENDING
		taskOccurrencesRepository.items.forEach((occurrence) => {
			expect(occurrence.status).toEqual('PENDING');
		});
	});

	it('should persist task occurrences with correct timestamps', async () => {
		const user = makeUser();
		usersRepository.items.push(user);

		const beforeCreate = new Date();

		const result = await createTaskUseCase.execute({
			userId: user.id.toString(),
			title: 'Task with Timestamps',
			recurrence: {
				frequency: 'DAILY_INTERVAL',
				endType: 'AFTER_OCCURRENCES',
				startDateTime: new Date('2025-12-15T14:30:00'),
				interval: 2,
				maxOccurrences: 5,
			},
		});

		const afterCreate = new Date();

		expect(result.isSuccess()).toBe(true);

		// Verificar que as ocorrências têm timestamps válidos
		taskOccurrencesRepository.items.forEach((occurrence) => {
			expect(occurrence.createdAt).toBeDefined();
			expect(occurrence.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
			expect(occurrence.createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
		});
	});

	it('should generate only occurrences within the 1-day horizon', async () => {
		const user = makeUser();
		usersRepository.items.push(user);

		// Task que começa em uma data futura distante
		const futureDate = new Date();
		futureDate.setDate(futureDate.getDate() + 30); // 30 dias no futuro

		const result = await createTaskUseCase.execute({
			userId: user.id.toString(),
			title: 'Future Task',
			recurrence: {
				frequency: 'DAILY_INTERVAL',
				endType: 'AFTER_OCCURRENCES',
				startDateTime: futureDate,
				interval: 1,
				maxOccurrences: 365,
			},
		});

		expect(result.isSuccess()).toBe(true);

		// Como a tarefa inicia 30 dias no futuro e o horizonte é 1 dia,
		// não deve gerar nenhuma ocorrência
		expect(taskOccurrencesRepository.items).toHaveLength(0);
	});

	it('should ensure task definition and recurrence rule are persisted before generating occurrences', async () => {
		const user = makeUser();
		usersRepository.items.push(user);

		const result = await createTaskUseCase.execute({
			userId: user.id.toString(),
			title: 'Task with Persistence Order',
			recurrence: {
				frequency: 'DAILY_INTERVAL',
				endType: 'AFTER_OCCURRENCES',
				startDateTime: new Date(),
				interval: 1,
				maxOccurrences: 10,
			},
		});

		expect(result.isSuccess()).toBe(true);

		// Task definition e recurrence rule devem estar persistidos
		expect(taskDefinitionsRepository.items).toHaveLength(1);
		expect(recurrenceRulesRepository.items).toHaveLength(1);

		// Verificar que as ocorrências fazem referência ao task definition correto
		if (taskOccurrencesRepository.items.length > 0) {
			const taskDefinition = taskDefinitionsRepository.items[0];
			const occurrence = taskOccurrencesRepository.items[0];

			expect(occurrence.taskDefinitionId.toString()).toEqual(taskDefinition.id.toString());
		}
	});
});
