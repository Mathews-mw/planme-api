import { makeSubtask, makeTaskDefinition } from 'tests/factories/make-task';
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error';
import { InMemorySubtasksRepository } from 'tests/in-memory/in-memory-subtasks-repository';
import { InMemoryTaskDefinitionsRepository } from 'tests/in-memory/in-memory-task-definitions-repository';
import { DeleteSubtaskUseCase } from '@/domains/planme/application/features/tasks/use-cases/delete-subtask-use-case';

let taskDefinitionsRepository: InMemoryTaskDefinitionsRepository;
let subtasksRepository: InMemorySubtasksRepository;
let deleteSubtaskUseCase: DeleteSubtaskUseCase;

describe('Delete Subtask Use Case', () => {
	beforeEach(() => {
		taskDefinitionsRepository = new InMemoryTaskDefinitionsRepository();
		subtasksRepository = new InMemorySubtasksRepository();
		deleteSubtaskUseCase = new DeleteSubtaskUseCase(subtasksRepository);
	});

	it('should be able to delete a subtask and reorder the positions', async () => {
		const taskDefinition = makeTaskDefinition();

		const subtask1 = makeSubtask({ taskDefinitionId: taskDefinition.id, title: 'subtask 1', position: 0 });
		const subtask2 = makeSubtask({ taskDefinitionId: taskDefinition.id, title: 'subtask 2', position: 1 });
		const subtask3 = makeSubtask({ taskDefinitionId: taskDefinition.id, title: 'subtask 3', position: 2 });
		const subtask4 = makeSubtask({ taskDefinitionId: taskDefinition.id, title: 'subtask 4', position: 3 });

		taskDefinitionsRepository.items.push(taskDefinition);
		subtasksRepository.items.push(subtask1, subtask2, subtask3, subtask4);

		const result = await deleteSubtaskUseCase.execute({ subtaskId: subtask2.id.toString() });

		const subtasksStored = subtasksRepository.items;

		expect(result.isSuccess()).toBe(true);
		expect(subtasksRepository.items).toHaveLength(3);
		expect(subtasksStored[1]).toEqual(expect.objectContaining({ title: 'subtask 3', position: 1 }));
		expect(subtasksStored[2]).toEqual(expect.objectContaining({ title: 'subtask 4', position: 2 }));
	});

	it('should not be able to delete an nonexistent subtask', async () => {
		const result = await deleteSubtaskUseCase.execute({
			subtaskId: 'nonExistentId',
		});

		expect(result.isFalse()).toBe(true);
		expect(result.value).toBeInstanceOf(ResourceNotFoundError);
	});
});
