import { describe, it, expect, beforeEach } from 'vitest';

import { makeUser } from 'tests/factories/make-user';
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error';
import { InMemoryUsersRepository } from 'tests/in-memory/in-memory-users-repository';
import { InMemorySubtasksRepository } from 'tests/in-memory/in-memory-subtasks-repository';
import { InMemoryRecurrenceRulesRepository } from 'tests/in-memory/in-memory-recurrence-rules-repository';
import { InMemoryTaskDefinitionsRepository } from 'tests/in-memory/in-memory-task-definitions-repository';
import { InMemoryTaskOccurrencesRepository } from 'tests/in-memory/in-memory-task-occurrences-repository';
import { DeleteTaskUseCase } from '@/domains/planme/application/features/tasks/use-cases/delete-task-use-case';
import { makeRecurrenceRule, makeSubtask, makeTaskDefinition, makeTaskOccurrence } from 'tests/factories/make-task';

let usersRepository: InMemoryUsersRepository;
let taskDefinitionsRepository: InMemoryTaskDefinitionsRepository;
let recurrenceRulesRepository: InMemoryRecurrenceRulesRepository;
let taskOccurrencesRepository: InMemoryTaskOccurrencesRepository;
let subtasksRepository: InMemorySubtasksRepository;
let deleteTaskUseCase: DeleteTaskUseCase;

describe('Delete Task Use Case', () => {
	beforeEach(() => {
		usersRepository = new InMemoryUsersRepository();
		recurrenceRulesRepository = new InMemoryRecurrenceRulesRepository();
		taskDefinitionsRepository = new InMemoryTaskDefinitionsRepository();
		taskOccurrencesRepository = new InMemoryTaskOccurrencesRepository();
		subtasksRepository = new InMemorySubtasksRepository();

		deleteTaskUseCase = new DeleteTaskUseCase(
			taskDefinitionsRepository,
			recurrenceRulesRepository,
			taskOccurrencesRepository,
			subtasksRepository
		);
	});

	it('should be possible to delete an existing task', async () => {
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

		const occurrence1 = makeTaskOccurrence({ taskDefinitionId: taskDefinition.id, status: 'PENDING' });
		const occurrence2 = makeTaskOccurrence({ taskDefinitionId: taskDefinition.id, status: 'SKIPPED' });
		const occurrence3 = makeTaskOccurrence({ taskDefinitionId: taskDefinition.id, status: 'COMPLETED' });

		const subtask1 = makeSubtask({ taskDefinitionId: taskDefinition.id });
		const subtask2 = makeSubtask({ taskDefinitionId: taskDefinition.id });
		const subtask3 = makeSubtask({ taskDefinitionId: taskDefinition.id });

		recurrenceRulesRepository.items.push(recurrenceRule);
		taskDefinitionsRepository.items.push(taskDefinition);
		subtasksRepository.items.push(subtask1, subtask2, subtask3);
		taskOccurrencesRepository.items.push(occurrence1, occurrence2, occurrence3);

		expect(recurrenceRulesRepository.items).toHaveLength(1);
		expect(taskDefinitionsRepository.items).toHaveLength(1);
		expect(taskOccurrencesRepository.items).toHaveLength(3);
		expect(subtasksRepository.items).toHaveLength(3);

		const result = await deleteTaskUseCase.execute({ taskDefinitionId: taskDefinition.id.toString() });

		// Valida que foi deletado RecurrenceRule, TaskDefinition, Subtasks e Occurrences
		expect(result.isSuccess()).toBe(true);
		expect(recurrenceRulesRepository.items).toHaveLength(0);
		expect(taskDefinitionsRepository.items).toHaveLength(0);
		expect(taskOccurrencesRepository.items).toHaveLength(0);
		expect(subtasksRepository.items).toHaveLength(0);
	});

	it('should return error when task definition does not exist', async () => {
		const result = await deleteTaskUseCase.execute({ taskDefinitionId: 'non-existent-id' });

		expect(result.isSuccess()).toBe(false);
		expect(result.value).toBeInstanceOf(ResourceNotFoundError);
	});

	it('should return error when recurrence rule does not exist', async () => {
		const user = makeUser();
		usersRepository.items.push(user);

		// Criar uma task definition com referência a uma recurrence rule inexistente
		const recurrenceRule = makeRecurrenceRule();
		const taskDefinition = makeTaskDefinition({
			userId: user.id,
			recurrenceRuleId: recurrenceRule.id,
		});

		// Apenas adicionar task definition, não a recurrence rule
		taskDefinitionsRepository.items.push(taskDefinition);

		const result = await deleteTaskUseCase.execute({ taskDefinitionId: taskDefinition.id.toString() });

		expect(result.isSuccess()).toBe(false);
		expect(result.value).toBeInstanceOf(ResourceNotFoundError);
	});

	it('should delete in correct order: subtasks, occurrences, recurrence rule, then task definition', async () => {
		const user = makeUser();
		usersRepository.items.push(user);

		const recurrenceRule = makeRecurrenceRule();
		const taskDefinition = makeTaskDefinition({ userId: user.id, recurrenceRuleId: recurrenceRule.id });

		const subtask1 = makeSubtask({ taskDefinitionId: taskDefinition.id });
		const subtask2 = makeSubtask({ taskDefinitionId: taskDefinition.id });

		const occurrence1 = makeTaskOccurrence({ taskDefinitionId: taskDefinition.id, status: 'PENDING' });
		const occurrence2 = makeTaskOccurrence({ taskDefinitionId: taskDefinition.id, status: 'COMPLETED' });

		recurrenceRulesRepository.items.push(recurrenceRule);
		taskDefinitionsRepository.items.push(taskDefinition);
		subtasksRepository.items.push(subtask1, subtask2);
		taskOccurrencesRepository.items.push(occurrence1, occurrence2);

		expect(subtasksRepository.items).toHaveLength(2);
		expect(taskOccurrencesRepository.items).toHaveLength(2);
		expect(recurrenceRulesRepository.items).toHaveLength(1);
		expect(taskDefinitionsRepository.items).toHaveLength(1);

		const result = await deleteTaskUseCase.execute({ taskDefinitionId: taskDefinition.id.toString() });

		expect(result.isSuccess()).toBe(true);

		// Verificar que todas as entidades foram deletadas
		expect(subtasksRepository.items).toHaveLength(0);
		expect(taskOccurrencesRepository.items).toHaveLength(0);
		expect(recurrenceRulesRepository.items).toHaveLength(0);
		expect(taskDefinitionsRepository.items).toHaveLength(0);
	});

	it('should not affect other tasks when deleting one task', async () => {
		const user = makeUser();
		usersRepository.items.push(user);

		// Criar primeira tarefa
		const recurrenceRule1 = makeRecurrenceRule();
		const taskDefinition1 = makeTaskDefinition({ userId: user.id, recurrenceRuleId: recurrenceRule1.id });
		const subtask1 = makeSubtask({ taskDefinitionId: taskDefinition1.id });
		const occurrence1 = makeTaskOccurrence({ taskDefinitionId: taskDefinition1.id });

		// Criar segunda tarefa
		const recurrenceRule2 = makeRecurrenceRule();
		const taskDefinition2 = makeTaskDefinition({ userId: user.id, recurrenceRuleId: recurrenceRule2.id });
		const subtask2 = makeSubtask({ taskDefinitionId: taskDefinition2.id });
		const occurrence2 = makeTaskOccurrence({ taskDefinitionId: taskDefinition2.id });

		recurrenceRulesRepository.items.push(recurrenceRule1, recurrenceRule2);
		taskDefinitionsRepository.items.push(taskDefinition1, taskDefinition2);
		subtasksRepository.items.push(subtask1, subtask2);
		taskOccurrencesRepository.items.push(occurrence1, occurrence2);

		expect(taskDefinitionsRepository.items).toHaveLength(2);
		expect(subtasksRepository.items).toHaveLength(2);
		expect(taskOccurrencesRepository.items).toHaveLength(2);

		// Deletar apenas a primeira tarefa
		const result = await deleteTaskUseCase.execute({ taskDefinitionId: taskDefinition1.id.toString() });

		expect(result.isSuccess()).toBe(true);

		// Verificar que apenas a primeira tarefa foi deletada
		expect(taskDefinitionsRepository.items).toHaveLength(1);
		expect(taskDefinitionsRepository.items[0].id.toString()).toBe(taskDefinition2.id.toString());

		// Verificar que apenas a primeira recurrence rule foi deletada
		expect(recurrenceRulesRepository.items).toHaveLength(1);
		expect(recurrenceRulesRepository.items[0].id.toString()).toBe(recurrenceRule2.id.toString());

		// Verificar que apenas a subtask da primeira tarefa foi deletada
		expect(subtasksRepository.items).toHaveLength(1);
		expect(subtasksRepository.items[0].id.toString()).toBe(subtask2.id.toString());

		// Verificar que apenas a ocorrência da primeira tarefa foi deletada
		expect(taskOccurrencesRepository.items).toHaveLength(1);
		expect(taskOccurrencesRepository.items[0].id.toString()).toBe(occurrence2.id.toString());
	});
});
