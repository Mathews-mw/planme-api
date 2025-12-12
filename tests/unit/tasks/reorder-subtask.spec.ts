import { BadRequestError } from '@/core/errors/bad-request-errors';
import { InMemorySubtasksRepository } from 'tests/in-memory/in-memory-subtasks-repository';
import { makeRecurrenceRule, makeSubtask, makeTaskDefinition } from 'tests/factories/make-task';
import { InMemoryTaskDefinitionsRepository } from 'tests/in-memory/in-memory-task-definitions-repository';
import { ReorderSubtaskUseCase } from '@/domains/planme/application/features/tasks/use-cases/reorder-subtask-use-case';

let taskDefinitionsRepository: InMemoryTaskDefinitionsRepository;
let subtasksRepository: InMemorySubtasksRepository;
let reorderSubtaskUseCase: ReorderSubtaskUseCase;

describe('Reorder Subtask Use Case', () => {
	beforeEach(() => {
		taskDefinitionsRepository = new InMemoryTaskDefinitionsRepository();
		subtasksRepository = new InMemorySubtasksRepository();
		reorderSubtaskUseCase = new ReorderSubtaskUseCase(subtasksRepository);
	});

	it('should reorder subtasks according to provided order', async () => {
		const recurrenceRule = makeRecurrenceRule();
		const taskDefinition = makeTaskDefinition({ recurrenceRuleId: recurrenceRule.id });

		const subtask1 = makeSubtask({ taskDefinitionId: taskDefinition.id, title: 'subtask 1', position: 0 });
		const subtask2 = makeSubtask({ taskDefinitionId: taskDefinition.id, title: 'subtask 2', position: 1 });
		const subtask3 = makeSubtask({ taskDefinitionId: taskDefinition.id, title: 'subtask 3', position: 2 });
		const subtask4 = makeSubtask({ taskDefinitionId: taskDefinition.id, title: 'subtask 4', position: 3 });

		taskDefinitionsRepository.items.push(taskDefinition);
		subtasksRepository.items.push(subtask1, subtask2, subtask3, subtask4);

		// Reordenar: 4, 2, 1, 3
		const result = await reorderSubtaskUseCase.execute({
			taskDefinitionId: taskDefinition.id.toString(),
			orderedSubtaskIds: [
				subtask4.id.toString(),
				subtask2.id.toString(),
				subtask1.id.toString(),
				subtask3.id.toString(),
			],
		});

		expect(result.isSuccess()).toBe(true);

		// Verificar que as posições foram atualizadas nos objetos
		const reorderedSubtasks = subtasksRepository.items;
		const subtask4Final = reorderedSubtasks.find((s) => s.id.toString() === subtask4.id.toString());
		const subtask2Final = reorderedSubtasks.find((s) => s.id.toString() === subtask2.id.toString());
		const subtask1Final = reorderedSubtasks.find((s) => s.id.toString() === subtask1.id.toString());
		const subtask3Final = reorderedSubtasks.find((s) => s.id.toString() === subtask3.id.toString());

		expect(subtask4Final?.position).toBe(0);
		expect(subtask2Final?.position).toBe(1);
		expect(subtask1Final?.position).toBe(2);
		expect(subtask3Final?.position).toBe(3);
	});

	it('should return success when no subtasks exist', async () => {
		const recurrenceRule = makeRecurrenceRule();
		const taskDefinition = makeTaskDefinition({ recurrenceRuleId: recurrenceRule.id });

		taskDefinitionsRepository.items.push(taskDefinition);

		const result = await reorderSubtaskUseCase.execute({
			taskDefinitionId: taskDefinition.id.toString(),
			orderedSubtaskIds: [],
		});

		expect(result.isSuccess()).toBe(true);
	});

	it('should return error when ordered ids do not match existing subtask ids', async () => {
		const recurrenceRule = makeRecurrenceRule();
		const taskDefinition = makeTaskDefinition({ recurrenceRuleId: recurrenceRule.id });

		const subtask1 = makeSubtask({ taskDefinitionId: taskDefinition.id, position: 0 });
		const subtask2 = makeSubtask({ taskDefinitionId: taskDefinition.id, position: 1 });

		taskDefinitionsRepository.items.push(taskDefinition);
		subtasksRepository.items.push(subtask1, subtask2);

		// Tentar reordenar com IDs diferentes
		const result = await reorderSubtaskUseCase.execute({
			taskDefinitionId: taskDefinition.id.toString(),
			orderedSubtaskIds: ['wrong-id-1', 'wrong-id-2'],
		});

		expect(result.isSuccess()).toBe(false);
		expect(result.value).toBeInstanceOf(BadRequestError);
	});

	it('should return error when ordered ids are missing some subtasks', async () => {
		const recurrenceRule = makeRecurrenceRule();
		const taskDefinition = makeTaskDefinition({ recurrenceRuleId: recurrenceRule.id });

		const subtask1 = makeSubtask({ taskDefinitionId: taskDefinition.id, position: 0 });
		const subtask2 = makeSubtask({ taskDefinitionId: taskDefinition.id, position: 1 });
		const subtask3 = makeSubtask({ taskDefinitionId: taskDefinition.id, position: 2 });

		taskDefinitionsRepository.items.push(taskDefinition);
		subtasksRepository.items.push(subtask1, subtask2, subtask3);

		// Tentar reordenar com apenas 2 de 3 IDs
		const result = await reorderSubtaskUseCase.execute({
			taskDefinitionId: taskDefinition.id.toString(),
			orderedSubtaskIds: [subtask1.id.toString(), subtask2.id.toString()],
		});

		expect(result.isSuccess()).toBe(false);
		expect(result.value).toBeInstanceOf(BadRequestError);
	});

	it('should return error when ordered ids contain extra ids not in subtasks', async () => {
		const recurrenceRule = makeRecurrenceRule();
		const taskDefinition = makeTaskDefinition({ recurrenceRuleId: recurrenceRule.id });

		const subtask1 = makeSubtask({ taskDefinitionId: taskDefinition.id, position: 0 });
		const subtask2 = makeSubtask({ taskDefinitionId: taskDefinition.id, position: 1 });

		taskDefinitionsRepository.items.push(taskDefinition);
		subtasksRepository.items.push(subtask1, subtask2);

		// Tentar reordenar com IDs extras
		const result = await reorderSubtaskUseCase.execute({
			taskDefinitionId: taskDefinition.id.toString(),
			orderedSubtaskIds: [subtask1.id.toString(), subtask2.id.toString(), 'extra-id'],
		});

		expect(result.isSuccess()).toBe(false);
		expect(result.value).toBeInstanceOf(BadRequestError);
	});

	it('should update positions in repository', async () => {
		const recurrenceRule = makeRecurrenceRule();
		const taskDefinition = makeTaskDefinition({ recurrenceRuleId: recurrenceRule.id });

		const subtask1 = makeSubtask({ taskDefinitionId: taskDefinition.id, position: 0 });
		const subtask2 = makeSubtask({ taskDefinitionId: taskDefinition.id, position: 1 });
		const subtask3 = makeSubtask({ taskDefinitionId: taskDefinition.id, position: 2 });

		taskDefinitionsRepository.items.push(taskDefinition);
		subtasksRepository.items.push(subtask1, subtask2, subtask3);

		const result = await reorderSubtaskUseCase.execute({
			taskDefinitionId: taskDefinition.id.toString(),
			orderedSubtaskIds: [subtask3.id.toString(), subtask1.id.toString(), subtask2.id.toString()],
		});

		expect(result.isSuccess()).toBe(true);

		// Verificar posições finais
		const reorderedSubtasks = subtasksRepository.items;
		const subtask3Final = reorderedSubtasks.find((s) => s.id.toString() === subtask3.id.toString());
		const subtask1Final = reorderedSubtasks.find((s) => s.id.toString() === subtask1.id.toString());
		const subtask2Final = reorderedSubtasks.find((s) => s.id.toString() === subtask2.id.toString());

		expect(subtask3Final?.position).toBe(0);
		expect(subtask1Final?.position).toBe(1);
		expect(subtask2Final?.position).toBe(2);
	});

	it('should reverse subtask order', async () => {
		const recurrenceRule = makeRecurrenceRule();
		const taskDefinition = makeTaskDefinition({ recurrenceRuleId: recurrenceRule.id });

		const subtask1 = makeSubtask({ taskDefinitionId: taskDefinition.id, position: 0 });
		const subtask2 = makeSubtask({ taskDefinitionId: taskDefinition.id, position: 1 });
		const subtask3 = makeSubtask({ taskDefinitionId: taskDefinition.id, position: 2 });
		const subtask4 = makeSubtask({ taskDefinitionId: taskDefinition.id, position: 3 });

		taskDefinitionsRepository.items.push(taskDefinition);
		subtasksRepository.items.push(subtask1, subtask2, subtask3, subtask4);

		// Reverter ordem: 4, 3, 2, 1
		const result = await reorderSubtaskUseCase.execute({
			taskDefinitionId: taskDefinition.id.toString(),
			orderedSubtaskIds: [
				subtask4.id.toString(),
				subtask3.id.toString(),
				subtask2.id.toString(),
				subtask1.id.toString(),
			],
		});

		expect(result.isSuccess()).toBe(true);

		const reorderedSubtasks = subtasksRepository.items;
		expect(reorderedSubtasks.find((s) => s.id.toString() === subtask4.id.toString())?.position).toBe(0);
		expect(reorderedSubtasks.find((s) => s.id.toString() === subtask3.id.toString())?.position).toBe(1);
		expect(reorderedSubtasks.find((s) => s.id.toString() === subtask2.id.toString())?.position).toBe(2);
		expect(reorderedSubtasks.find((s) => s.id.toString() === subtask1.id.toString())?.position).toBe(3);
	});

	it('should handle single subtask reordering', async () => {
		const recurrenceRule = makeRecurrenceRule();
		const taskDefinition = makeTaskDefinition({ recurrenceRuleId: recurrenceRule.id });

		const subtask1 = makeSubtask({ taskDefinitionId: taskDefinition.id, position: 0 });

		taskDefinitionsRepository.items.push(taskDefinition);
		subtasksRepository.items.push(subtask1);

		const result = await reorderSubtaskUseCase.execute({
			taskDefinitionId: taskDefinition.id.toString(),
			orderedSubtaskIds: [subtask1.id.toString()],
		});

		expect(result.isSuccess()).toBe(true);
		expect(subtasksRepository.items[0].position).toBe(0);
	});

	it('should handle reordering of many subtasks', async () => {
		const recurrenceRule = makeRecurrenceRule();
		const taskDefinition = makeTaskDefinition({ recurrenceRuleId: recurrenceRule.id });

		// Criar 10 subtasks
		const subtasks = Array.from({ length: 10 }, (_, i) =>
			makeSubtask({ taskDefinitionId: taskDefinition.id, position: i })
		);

		taskDefinitionsRepository.items.push(taskDefinition);
		subtasksRepository.items.push(...subtasks);

		// Reordenar em ordem reversa
		const reversedIds = subtasks.reverse().map((s) => s.id.toString());

		const result = await reorderSubtaskUseCase.execute({
			taskDefinitionId: taskDefinition.id.toString(),
			orderedSubtaskIds: reversedIds,
		});

		expect(result.isSuccess()).toBe(true);

		// Verificar que todas as posições foram atualizadas
		const reorderedSubtasks = subtasksRepository.items;
		for (let i = 0; i < reorderedSubtasks.length; i++) {
			expect(reorderedSubtasks.find((s) => s.id.toString() === reversedIds[i])?.position).toBe(i);
		}
	});

	it('should only reorder subtasks of target task definition', async () => {
		const recurrenceRule1 = makeRecurrenceRule();
		const recurrenceRule2 = makeRecurrenceRule();
		const taskDefinition1 = makeTaskDefinition({ recurrenceRuleId: recurrenceRule1.id });
		const taskDefinition2 = makeTaskDefinition({ recurrenceRuleId: recurrenceRule2.id });

		const subtask1A = makeSubtask({ taskDefinitionId: taskDefinition1.id, position: 0 });
		const subtask2A = makeSubtask({ taskDefinitionId: taskDefinition1.id, position: 1 });

		const subtask1B = makeSubtask({ taskDefinitionId: taskDefinition2.id, position: 0 });
		const subtask2B = makeSubtask({ taskDefinitionId: taskDefinition2.id, position: 1 });

		taskDefinitionsRepository.items.push(taskDefinition1, taskDefinition2);
		subtasksRepository.items.push(subtask1A, subtask2A, subtask1B, subtask2B);

		// Reordenar apenas a primeira task
		const result = await reorderSubtaskUseCase.execute({
			taskDefinitionId: taskDefinition1.id.toString(),
			orderedSubtaskIds: [subtask2A.id.toString(), subtask1A.id.toString()],
		});

		expect(result.isSuccess()).toBe(true);

		// Verificar que apenas subtasks da task 1 foram reordenados
		const subtask1AFinal = subtasksRepository.items.find((s) => s.id.toString() === subtask1A.id.toString());
		const subtask2AFinal = subtasksRepository.items.find((s) => s.id.toString() === subtask2A.id.toString());
		const subtask1BFinal = subtasksRepository.items.find((s) => s.id.toString() === subtask1B.id.toString());
		const subtask2BFinal = subtasksRepository.items.find((s) => s.id.toString() === subtask2B.id.toString());

		expect(subtask2AFinal?.position).toBe(0);
		expect(subtask1AFinal?.position).toBe(1);
		expect(subtask1BFinal?.position).toBe(0); // não foi alterada
		expect(subtask2BFinal?.position).toBe(1); // não foi alterada
	});

	it('should maintain other task subtasks unchanged during reordering', async () => {
		const recurrenceRule1 = makeRecurrenceRule();
		const recurrenceRule2 = makeRecurrenceRule();
		const taskDefinition1 = makeTaskDefinition({ recurrenceRuleId: recurrenceRule1.id });
		const taskDefinition2 = makeTaskDefinition({ recurrenceRuleId: recurrenceRule2.id });

		const subtask1A = makeSubtask({ taskDefinitionId: taskDefinition1.id, position: 0 });
		const subtask2A = makeSubtask({ taskDefinitionId: taskDefinition1.id, position: 1 });
		const subtask3A = makeSubtask({ taskDefinitionId: taskDefinition1.id, position: 2 });

		const subtask1B = makeSubtask({ taskDefinitionId: taskDefinition2.id, position: 0 });

		taskDefinitionsRepository.items.push(taskDefinition1, taskDefinition2);
		subtasksRepository.items.push(subtask1A, subtask2A, subtask3A, subtask1B);

		const result = await reorderSubtaskUseCase.execute({
			taskDefinitionId: taskDefinition1.id.toString(),
			orderedSubtaskIds: [subtask3A.id.toString(), subtask1A.id.toString(), subtask2A.id.toString()],
		});

		expect(result.isSuccess()).toBe(true);

		// Task 2 deve manter sua posição original
		const subtask1BFinal = subtasksRepository.items.find((s) => s.id.toString() === subtask1B.id.toString());
		expect(subtask1BFinal?.position).toBe(0);
	});
});
