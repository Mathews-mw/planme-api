import { makeUser } from 'tests/factories/make-user';
import { BadRequestError } from '@/core/errors/bad-request-errors';
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error';
import { InMemoryUsersRepository } from 'tests/in-memory/in-memory-users-repository';
import { makeRecurrenceRule, makeTaskDefinition, makeTaskOccurrence } from 'tests/factories/make-task';
import { InMemoryRecurrenceRulesRepository } from 'tests/in-memory/in-memory-recurrence-rules-repository';
import { InMemoryTaskDefinitionsRepository } from 'tests/in-memory/in-memory-task-definitions-repository';
import { InMemoryTaskOccurrencesRepository } from 'tests/in-memory/in-memory-task-occurrences-repository';
import { ToggleCompleteTaskUseCase } from '@/domains/planme/application/features/tasks/use-cases/toggle-complete-task';
import { TaskOccurrencesPlanner } from '@/domains/planme/application/features/recurrence/services/task-occurrences-planner';

let usersRepository: InMemoryUsersRepository;
let taskDefinitionsRepository: InMemoryTaskDefinitionsRepository;
let recurrenceRulesRepository: InMemoryRecurrenceRulesRepository;
let taskOccurrencesRepository: InMemoryTaskOccurrencesRepository;
let occurrencesPlanner: TaskOccurrencesPlanner;
let toggleCompleteTaskUseCase: ToggleCompleteTaskUseCase;

describe('Toggle Complete Task Use Case', () => {
	beforeEach(() => {
		usersRepository = new InMemoryUsersRepository();
		recurrenceRulesRepository = new InMemoryRecurrenceRulesRepository();
		taskDefinitionsRepository = new InMemoryTaskDefinitionsRepository();
		taskOccurrencesRepository = new InMemoryTaskOccurrencesRepository();
		occurrencesPlanner = new TaskOccurrencesPlanner();

		toggleCompleteTaskUseCase = new ToggleCompleteTaskUseCase(
			taskDefinitionsRepository,
			recurrenceRulesRepository,
			taskOccurrencesRepository,
			occurrencesPlanner
		);
	});

	it('should mark a task occurrence as completed', async () => {
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
		const occurrence = makeTaskOccurrence({ taskDefinitionId: taskDefinition.id, status: 'PENDING' });

		recurrenceRulesRepository.items.push(recurrenceRule);
		taskDefinitionsRepository.items.push(taskDefinition);
		taskOccurrencesRepository.items.push(occurrence);

		const result = await toggleCompleteTaskUseCase.execute({
			userId: user.id.toString(),
			taskDefinitionId: taskDefinition.id.toString(),
			taskOccurrenceId: occurrence.id.toString(),
		});

		expect(result.isSuccess()).toBe(true);

		if (result.isSuccess()) {
			expect(result.value.taskOccurrence.status).toBe('COMPLETED');
			expect(result.value.taskOccurrence.completedAt).toEqual(expect.any(Date));
		}
	});

	it('should generate new occurrence when completing last pending occurrence', async () => {
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
		const occurrence = makeTaskOccurrence({ taskDefinitionId: taskDefinition.id, status: 'PENDING' });

		recurrenceRulesRepository.items.push(recurrenceRule);
		taskDefinitionsRepository.items.push(taskDefinition);
		taskOccurrencesRepository.items.push(occurrence);

		expect(taskOccurrencesRepository.items).toHaveLength(1);

		const result = await toggleCompleteTaskUseCase.execute({
			userId: user.id.toString(),
			taskDefinitionId: taskDefinition.id.toString(),
			taskOccurrenceId: occurrence.id.toString(),
		});

		expect(result.isSuccess()).toBe(true);

		// Deve ter criado uma nova ocorrência (a original concluída + 1 nova)
		expect(taskOccurrencesRepository.items).toHaveLength(2);

		const completedOccurrence = taskOccurrencesRepository.items.find((o) => o.status === 'COMPLETED');
		const pendingOccurrence = taskOccurrencesRepository.items.find((o) => o.status === 'PENDING');

		expect(completedOccurrence).toBeDefined();
		expect(pendingOccurrence).toBeDefined();
	});

	it('should not generate new occurrence when there are pending occurrences in the future', async () => {
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

		const tomorrowDate = new Date();
		tomorrowDate.setDate(tomorrowDate.getDate() + 1);

		const todayOccurrence = makeTaskOccurrence({
			taskDefinitionId: taskDefinition.id,
			status: 'PENDING',
			occurrenceDateTime: new Date(),
		});
		const tomorrowOccurrence = makeTaskOccurrence({
			taskDefinitionId: taskDefinition.id,
			status: 'PENDING',
			occurrenceDateTime: tomorrowDate,
		});

		recurrenceRulesRepository.items.push(recurrenceRule);
		taskDefinitionsRepository.items.push(taskDefinition);
		taskOccurrencesRepository.items.push(todayOccurrence, tomorrowOccurrence);

		expect(taskOccurrencesRepository.items).toHaveLength(2);

		const result = await toggleCompleteTaskUseCase.execute({
			userId: user.id.toString(),
			taskDefinitionId: taskDefinition.id.toString(),
			taskOccurrenceId: todayOccurrence.id.toString(),
		});

		expect(result.isSuccess()).toBe(true);

		// Deve ter apenas 2 ocorrências (a original concluída + a futura que não foi alterada)
		expect(taskOccurrencesRepository.items).toHaveLength(2);

		const completedOccurrence = taskOccurrencesRepository.items.find((o) => o.status === 'COMPLETED');
		const stillPendingOccurrence = taskOccurrencesRepository.items.find(
			(o) => o.status === 'PENDING' && o.id.toString() === tomorrowOccurrence.id.toString()
		);

		expect(completedOccurrence).toBeDefined();
		expect(stillPendingOccurrence).toBeDefined();
	});

	it('should unmark a completed occurrence as pending', async () => {
		const user = makeUser();
		usersRepository.items.push(user);

		const recurrenceRule = makeRecurrenceRule();
		const taskDefinition = makeTaskDefinition({ userId: user.id, recurrenceRuleId: recurrenceRule.id });
		const completedOccurrence = makeTaskOccurrence({
			taskDefinitionId: taskDefinition.id,
			status: 'COMPLETED',
			completedAt: new Date(),
		});

		recurrenceRulesRepository.items.push(recurrenceRule);
		taskDefinitionsRepository.items.push(taskDefinition);
		taskOccurrencesRepository.items.push(completedOccurrence);

		const result = await toggleCompleteTaskUseCase.execute({
			userId: user.id.toString(),
			taskDefinitionId: taskDefinition.id.toString(),
			taskOccurrenceId: completedOccurrence.id.toString(),
		});

		expect(result.isSuccess()).toBe(true);

		if (result.isSuccess()) {
			expect(result.value.taskOccurrence.status).toBe('PENDING');
			expect(result.value.taskOccurrence.completedAt).toBeNull();
		}
	});

	it('should return error when task definition does not exist', async () => {
		const user = makeUser();
		usersRepository.items.push(user);

		const recurrenceRule = makeRecurrenceRule();
		const occurrence = makeTaskOccurrence();

		recurrenceRulesRepository.items.push(recurrenceRule);
		taskOccurrencesRepository.items.push(occurrence);

		const result = await toggleCompleteTaskUseCase.execute({
			userId: user.id.toString(),
			taskDefinitionId: 'non-existent-id',
			taskOccurrenceId: occurrence.id.toString(),
		});

		expect(result.isSuccess()).toBe(false);
		expect(result.value).toBeInstanceOf(ResourceNotFoundError);
	});

	it('should return error when task occurrence does not exist', async () => {
		const user = makeUser();
		usersRepository.items.push(user);

		const recurrenceRule = makeRecurrenceRule();
		const taskDefinition = makeTaskDefinition({ userId: user.id, recurrenceRuleId: recurrenceRule.id });

		recurrenceRulesRepository.items.push(recurrenceRule);
		taskDefinitionsRepository.items.push(taskDefinition);

		const result = await toggleCompleteTaskUseCase.execute({
			userId: user.id.toString(),
			taskDefinitionId: taskDefinition.id.toString(),
			taskOccurrenceId: 'non-existent-id',
		});

		expect(result.isSuccess()).toBe(false);
		expect(result.value).toBeInstanceOf(ResourceNotFoundError);
	});

	it('should return error when recurrence rule does not exist', async () => {
		const user = makeUser();
		usersRepository.items.push(user);

		const recurrenceRule = makeRecurrenceRule();
		const taskDefinition = makeTaskDefinition({ userId: user.id, recurrenceRuleId: recurrenceRule.id });
		const occurrence = makeTaskOccurrence({ taskDefinitionId: taskDefinition.id });

		// Apenas adicionar task definition e occurrence, não a recurrence rule
		taskDefinitionsRepository.items.push(taskDefinition);
		taskOccurrencesRepository.items.push(occurrence);

		const result = await toggleCompleteTaskUseCase.execute({
			userId: user.id.toString(),
			taskDefinitionId: taskDefinition.id.toString(),
			taskOccurrenceId: occurrence.id.toString(),
		});

		expect(result.isSuccess()).toBe(false);
		expect(result.value).toBeInstanceOf(ResourceNotFoundError);
	});

	it('should return error when user is not the task owner', async () => {
		const user1 = makeUser();
		const user2 = makeUser();
		usersRepository.items.push(user1, user2);

		const recurrenceRule = makeRecurrenceRule();
		const taskDefinition = makeTaskDefinition({ userId: user1.id, recurrenceRuleId: recurrenceRule.id });
		const occurrence = makeTaskOccurrence({ taskDefinitionId: taskDefinition.id });

		recurrenceRulesRepository.items.push(recurrenceRule);
		taskDefinitionsRepository.items.push(taskDefinition);
		taskOccurrencesRepository.items.push(occurrence);

		const result = await toggleCompleteTaskUseCase.execute({
			userId: user2.id.toString(),
			taskDefinitionId: taskDefinition.id.toString(),
			taskOccurrenceId: occurrence.id.toString(),
		});

		expect(result.isSuccess()).toBe(false);
		expect(result.value).toBeInstanceOf(BadRequestError);
	});

	it('should return response with updated task occurrence', async () => {
		const user = makeUser();
		usersRepository.items.push(user);

		const recurrenceRule = makeRecurrenceRule();
		const taskDefinition = makeTaskDefinition({ userId: user.id, recurrenceRuleId: recurrenceRule.id });
		const occurrence = makeTaskOccurrence({ taskDefinitionId: taskDefinition.id, status: 'PENDING' });

		recurrenceRulesRepository.items.push(recurrenceRule);
		taskDefinitionsRepository.items.push(taskDefinition);
		taskOccurrencesRepository.items.push(occurrence);

		const result = await toggleCompleteTaskUseCase.execute({
			userId: user.id.toString(),
			taskDefinitionId: taskDefinition.id.toString(),
			taskOccurrenceId: occurrence.id.toString(),
		});

		expect(result.isSuccess()).toBe(true);

		if (result.isSuccess()) {
			const { taskOccurrence } = result.value;

			expect(taskOccurrence.id.toString()).toBe(occurrence.id.toString());
			expect(taskOccurrence.taskDefinitionId.toString()).toBe(taskDefinition.id.toString());
			expect(taskOccurrence.status).toBe('COMPLETED');
			expect(taskOccurrence.completedAt).toEqual(expect.any(Date));
		}
	});

	it('should generate new occurrence with correct task definition id', async () => {
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
		const occurrence = makeTaskOccurrence({ taskDefinitionId: taskDefinition.id, status: 'PENDING' });

		recurrenceRulesRepository.items.push(recurrenceRule);
		taskDefinitionsRepository.items.push(taskDefinition);
		taskOccurrencesRepository.items.push(occurrence);

		const result = await toggleCompleteTaskUseCase.execute({
			userId: user.id.toString(),
			taskDefinitionId: taskDefinition.id.toString(),
			taskOccurrenceId: occurrence.id.toString(),
		});

		expect(result.isSuccess()).toBe(true);

		const newOccurrence = taskOccurrencesRepository.items.find((o) => o.status === 'PENDING');

		expect(newOccurrence?.taskDefinitionId.toString()).toBe(taskDefinition.id.toString());
	});

	it('should toggle complete/pending multiple times on same occurrence', async () => {
		const user = makeUser();
		usersRepository.items.push(user);

		const recurrenceRule = makeRecurrenceRule({
			frequency: 'NONE',
			endType: 'ONCE',
			startDateTime: new Date(),
		});
		const taskDefinition = makeTaskDefinition({ userId: user.id, recurrenceRuleId: recurrenceRule.id });
		const occurrence = makeTaskOccurrence({ taskDefinitionId: taskDefinition.id, status: 'PENDING' });

		recurrenceRulesRepository.items.push(recurrenceRule);
		taskDefinitionsRepository.items.push(taskDefinition);
		taskOccurrencesRepository.items.push(occurrence);

		// Primeira vez: marcar como concluído
		const result1 = await toggleCompleteTaskUseCase.execute({
			userId: user.id.toString(),
			taskDefinitionId: taskDefinition.id.toString(),
			taskOccurrenceId: occurrence.id.toString(),
		});

		expect(result1.isSuccess()).toBe(true);
		if (result1.isSuccess()) {
			expect(result1.value.taskOccurrence.status).toBe('COMPLETED');
		}

		// Segunda vez: marcar como pendente novamente
		const result2 = await toggleCompleteTaskUseCase.execute({
			userId: user.id.toString(),
			taskDefinitionId: taskDefinition.id.toString(),
			taskOccurrenceId: occurrence.id.toString(),
		});

		expect(result2.isSuccess()).toBe(true);
		if (result2.isSuccess()) {
			expect(result2.value.taskOccurrence.status).toBe('PENDING');
			expect(result2.value.taskOccurrence.completedAt).toBeNull();
		}

		// Terceira vez: marcar como concluído novamente
		const result3 = await toggleCompleteTaskUseCase.execute({
			userId: user.id.toString(),
			taskDefinitionId: taskDefinition.id.toString(),
			taskOccurrenceId: occurrence.id.toString(),
		});

		expect(result3.isSuccess()).toBe(true);
		if (result3.isSuccess()) {
			expect(result3.value.taskOccurrence.status).toBe('COMPLETED');
		}
	});

	it('should only create one new occurrence even with frequency that generates multiple', async () => {
		const user = makeUser();
		usersRepository.items.push(user);

		const recurrenceRule = makeRecurrenceRule({
			frequency: 'DAILY_INTERVAL',
			interval: 1,
			endType: 'AFTER_OCCURRENCES',
			maxOccurrences: 5,
			startDateTime: new Date(),
		});
		const taskDefinition = makeTaskDefinition({ userId: user.id, recurrenceRuleId: recurrenceRule.id });
		const occurrence = makeTaskOccurrence({ taskDefinitionId: taskDefinition.id, status: 'PENDING' });

		recurrenceRulesRepository.items.push(recurrenceRule);
		taskDefinitionsRepository.items.push(taskDefinition);
		taskOccurrencesRepository.items.push(occurrence);

		const initialCount = taskOccurrencesRepository.items.length;

		const result = await toggleCompleteTaskUseCase.execute({
			userId: user.id.toString(),
			taskDefinitionId: taskDefinition.id.toString(),
			taskOccurrenceId: occurrence.id.toString(),
		});

		expect(result.isSuccess()).toBe(true);

		// Deve ter apenas uma nova ocorrência criada (dentro do horizonte de 1 dia)
		const newCount = taskOccurrencesRepository.items.length;
		expect(newCount).toBe(initialCount + 1);
	});
});
