import { makeUser } from 'tests/factories/make-user';
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error';
import { InMemoryUsersRepository } from 'tests/in-memory/in-memory-users-repository';
import { InMemorySubtasksRepository } from 'tests/in-memory/in-memory-subtasks-repository';
import { makeRecurrenceRule, makeTaskDefinition, makeSubtask } from 'tests/factories/make-task';
import { InMemoryRecurrenceRulesRepository } from 'tests/in-memory/in-memory-recurrence-rules-repository';
import { InMemoryTaskDefinitionsRepository } from 'tests/in-memory/in-memory-task-definitions-repository';
import { CreateSubtaskUseCase } from '@/domains/planme/application/features/tasks/use-cases/create-subtask-use-case';

let usersRepository: InMemoryUsersRepository;
let recurrenceRulesRepository: InMemoryRecurrenceRulesRepository;
let taskDefinitionsRepository: InMemoryTaskDefinitionsRepository;
let subtasksRepository: InMemorySubtasksRepository;
let createSubtaskUseCase: CreateSubtaskUseCase;

describe('Create Subtask Use Case', () => {
	beforeEach(() => {
		usersRepository = new InMemoryUsersRepository();
		recurrenceRulesRepository = new InMemoryRecurrenceRulesRepository();
		taskDefinitionsRepository = new InMemoryTaskDefinitionsRepository();
		subtasksRepository = new InMemorySubtasksRepository();

		createSubtaskUseCase = new CreateSubtaskUseCase(subtasksRepository, taskDefinitionsRepository);
	});

	it('should be able to create a subtask for a corresponding task', async () => {
		const user = makeUser();
		usersRepository.items.push(user);

		const recurrenceRule = makeRecurrenceRule();
		const taskDefinition = makeTaskDefinition({ userId: user.id, recurrenceRuleId: recurrenceRule.id });

		recurrenceRulesRepository.items.push(recurrenceRule);
		taskDefinitionsRepository.items.push(taskDefinition);

		const result = await createSubtaskUseCase.execute({
			taskDefinitionId: taskDefinition.id.toString(),
			title: 'New subtask',
		});

		expect(result.isSuccess()).toBe(true);
		expect(subtasksRepository.items).toHaveLength(1);

		const subtask = subtasksRepository.items[0];

		expect(subtask.taskDefinitionId.toString()).toEqual(taskDefinition.id.toString());
		expect(subtask.title).toBe('New subtask');
		expect(subtask.position).toEqual(0);
	});

	it('should calculate position as max position + 1 when not informed', async () => {
		const user = makeUser();
		usersRepository.items.push(user);

		const recurrenceRule = makeRecurrenceRule();
		const taskDefinition = makeTaskDefinition({ userId: user.id, recurrenceRuleId: recurrenceRule.id });

		const subtask1 = makeSubtask({ taskDefinitionId: taskDefinition.id, position: 0 });
		const subtask2 = makeSubtask({ taskDefinitionId: taskDefinition.id, position: 1 });
		const subtask3 = makeSubtask({ taskDefinitionId: taskDefinition.id, position: 2 });

		recurrenceRulesRepository.items.push(recurrenceRule);
		taskDefinitionsRepository.items.push(taskDefinition);
		subtasksRepository.items.push(subtask1, subtask2, subtask3);

		const result = await createSubtaskUseCase.execute({
			taskDefinitionId: taskDefinition.id.toString(),
			title: 'New subtask',
		});

		expect(result.isSuccess()).toBe(true);

		if (result.isSuccess()) {
			expect(result.value.subtask.position).toEqual(3);
		}

		expect(subtasksRepository.items).toHaveLength(4);
	});

	it('should use custom position when informed', async () => {
		const user = makeUser();
		usersRepository.items.push(user);

		const recurrenceRule = makeRecurrenceRule();
		const taskDefinition = makeTaskDefinition({ userId: user.id, recurrenceRuleId: recurrenceRule.id });

		const subtask1 = makeSubtask({ taskDefinitionId: taskDefinition.id, position: 0 });
		const subtask2 = makeSubtask({ taskDefinitionId: taskDefinition.id, position: 1 });

		recurrenceRulesRepository.items.push(recurrenceRule);
		taskDefinitionsRepository.items.push(taskDefinition);
		subtasksRepository.items.push(subtask1, subtask2);

		const result = await createSubtaskUseCase.execute({
			taskDefinitionId: taskDefinition.id.toString(),
			title: 'New subtask at informed position',
			position: 5,
		});

		expect(result.isSuccess()).toBe(true);

		if (result.isSuccess()) {
			// Pela regra, a posição inserida deve ser a próxima disponível. Mesmo que informando a posição 5, a próxima deve ser 2, de acordo com as posições já existentes das subtasks já criadas
			expect(result.value.subtask.position).toEqual(2);
		}
	});

	it('should accept optional description', async () => {
		const user = makeUser();
		usersRepository.items.push(user);

		const recurrenceRule = makeRecurrenceRule();
		const taskDefinition = makeTaskDefinition({ userId: user.id, recurrenceRuleId: recurrenceRule.id });

		recurrenceRulesRepository.items.push(recurrenceRule);
		taskDefinitionsRepository.items.push(taskDefinition);

		const result = await createSubtaskUseCase.execute({
			taskDefinitionId: taskDefinition.id.toString(),
			title: 'Subtask with description',
			description: 'This is a description for the subtask',
		});

		expect(result.isSuccess()).toBe(true);

		if (result.isSuccess()) {
			expect(result.value.subtask.description).toBe('This is a description for the subtask');
		}

		expect(subtasksRepository.items).toHaveLength(1);
	});

	it('should accept null description', async () => {
		const user = makeUser();
		usersRepository.items.push(user);

		const recurrenceRule = makeRecurrenceRule();
		const taskDefinition = makeTaskDefinition({ userId: user.id, recurrenceRuleId: recurrenceRule.id });

		recurrenceRulesRepository.items.push(recurrenceRule);
		taskDefinitionsRepository.items.push(taskDefinition);

		const result = await createSubtaskUseCase.execute({
			taskDefinitionId: taskDefinition.id.toString(),
			title: 'Subtask without description',
			description: null,
		});

		expect(result.isSuccess()).toBe(true);

		if (result.isSuccess()) {
			expect(result.value.subtask.description).toBeNull();
		}
	});

	it('should return error when task definition does not exist', async () => {
		const result = await createSubtaskUseCase.execute({
			taskDefinitionId: 'non-existent-id',
			title: 'New subtask',
		});

		expect(result.isSuccess()).toBe(false);
		expect(result.value).toBeInstanceOf(ResourceNotFoundError);
	});

	it('should create multiple subtasks for same task definition', async () => {
		const user = makeUser();
		usersRepository.items.push(user);

		const recurrenceRule = makeRecurrenceRule();
		const taskDefinition = makeTaskDefinition({ userId: user.id, recurrenceRuleId: recurrenceRule.id });

		recurrenceRulesRepository.items.push(recurrenceRule);
		taskDefinitionsRepository.items.push(taskDefinition);

		const result1 = await createSubtaskUseCase.execute({
			taskDefinitionId: taskDefinition.id.toString(),
			title: 'First subtask',
		});

		const result2 = await createSubtaskUseCase.execute({
			taskDefinitionId: taskDefinition.id.toString(),
			title: 'Second subtask',
		});

		const result3 = await createSubtaskUseCase.execute({
			taskDefinitionId: taskDefinition.id.toString(),
			title: 'Third subtask',
		});

		expect(result1.isSuccess()).toBe(true);
		expect(result2.isSuccess()).toBe(true);
		expect(result3.isSuccess()).toBe(true);

		expect(subtasksRepository.items).toHaveLength(3);

		const positions = subtasksRepository.items.map((s) => s.position);
		expect(positions).toEqual([0, 1, 2]);
	});

	it('should handle custom position with existing subtasks', async () => {
		const user = makeUser();
		usersRepository.items.push(user);

		const recurrenceRule = makeRecurrenceRule();
		const taskDefinition = makeTaskDefinition({ userId: user.id, recurrenceRuleId: recurrenceRule.id });

		const subtask1 = makeSubtask({ taskDefinitionId: taskDefinition.id, position: 0 });
		const subtask2 = makeSubtask({ taskDefinitionId: taskDefinition.id, position: 1 });
		const subtask3 = makeSubtask({ taskDefinitionId: taskDefinition.id, position: 2 });
		const subtask4 = makeSubtask({ taskDefinitionId: taskDefinition.id, position: 3 });

		recurrenceRulesRepository.items.push(recurrenceRule);
		taskDefinitionsRepository.items.push(taskDefinition);
		subtasksRepository.items.push(subtask1, subtask2, subtask3, subtask4);

		// Inserir com posição customizada no meio
		const result = await createSubtaskUseCase.execute({
			taskDefinitionId: taskDefinition.id.toString(),
			title: 'Inserted subtask',
			position: 2,
		});

		expect(result.isSuccess()).toBe(true);

		if (result.isSuccess()) {
			expect(result.value.subtask.position).toBe(2);
		}

		expect(subtask3.position).toEqual(3);
		expect(subtasksRepository.items).toHaveLength(5);
	});

	it('should create subtask with only required fields', async () => {
		const user = makeUser();
		usersRepository.items.push(user);

		const recurrenceRule = makeRecurrenceRule();
		const taskDefinition = makeTaskDefinition({ userId: user.id, recurrenceRuleId: recurrenceRule.id });

		recurrenceRulesRepository.items.push(recurrenceRule);
		taskDefinitionsRepository.items.push(taskDefinition);

		const result = await createSubtaskUseCase.execute({
			taskDefinitionId: taskDefinition.id.toString(),
			title: 'Minimal subtask',
		});

		expect(result.isSuccess()).toBe(true);

		if (result.isSuccess()) {
			const { subtask } = result.value;

			expect(subtask.taskDefinitionId.toString()).toBe(taskDefinition.id.toString());
			expect(subtask.title).toBe('Minimal subtask');
			expect(subtask.position).toBe(0);
			expect(subtask.description).toBeUndefined();
		}
	});

	it('should create independent subtasks for different tasks', async () => {
		const user = makeUser();
		usersRepository.items.push(user);

		const recurrenceRule1 = makeRecurrenceRule();
		const recurrenceRule2 = makeRecurrenceRule();
		const taskDefinition1 = makeTaskDefinition({ userId: user.id, recurrenceRuleId: recurrenceRule1.id });
		const taskDefinition2 = makeTaskDefinition({ userId: user.id, recurrenceRuleId: recurrenceRule2.id });

		recurrenceRulesRepository.items.push(recurrenceRule1, recurrenceRule2);
		taskDefinitionsRepository.items.push(taskDefinition1, taskDefinition2);

		const result1 = await createSubtaskUseCase.execute({
			taskDefinitionId: taskDefinition1.id.toString(),
			title: 'Subtask for task 1',
		});

		const result2 = await createSubtaskUseCase.execute({
			taskDefinitionId: taskDefinition2.id.toString(),
			title: 'Subtask for task 2',
		});

		expect(result1.isSuccess()).toBe(true);
		expect(result2.isSuccess()).toBe(true);

		expect(subtasksRepository.items).toHaveLength(2);

		const subtasksForTask1 = subtasksRepository.items.filter(
			(s) => s.taskDefinitionId.toString() === taskDefinition1.id.toString()
		);
		const subtasksForTask2 = subtasksRepository.items.filter(
			(s) => s.taskDefinitionId.toString() === taskDefinition2.id.toString()
		);

		expect(subtasksForTask1).toHaveLength(1);
		expect(subtasksForTask2).toHaveLength(1);

		// Ambas devem ter posição 0 pois são subtasks diferentes
		expect(subtasksForTask1[0].position).toBe(0);
		expect(subtasksForTask2[0].position).toBe(0);
	});
});
