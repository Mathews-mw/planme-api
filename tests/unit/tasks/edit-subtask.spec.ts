import { makeSubtask } from 'tests/factories/make-task';
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error';
import { InMemorySubtasksRepository } from 'tests/in-memory/in-memory-subtasks-repository';
import { EditSubtaskUseCase } from '@/domains/planme/application/features/tasks/use-cases/edit-subtask-use-case';

let subtasksRepository: InMemorySubtasksRepository;
let editSubtaskUseCase: EditSubtaskUseCase;

describe('Edit Subtask Use Case', () => {
	beforeEach(() => {
		subtasksRepository = new InMemorySubtasksRepository();
		editSubtaskUseCase = new EditSubtaskUseCase(subtasksRepository);
	});

	it('should be able to edit a existing subtask', async () => {
		const subtask = makeSubtask();
		subtasksRepository.items.push(subtask);

		const result = await editSubtaskUseCase.execute({
			subtaskId: subtask.id.toString(),
			title: 'Edited subtask',
			description: 'Edited description',
		});

		const subtaskStored = subtasksRepository.items[0];

		expect(result.isSuccess()).toBe(true);
		expect(subtaskStored.title).toEqual('Edited subtask');
		expect(subtaskStored.description).toEqual('Edited description');
	});

	it('should not be able to edit an nonexistent subtask', async () => {
		const result = await editSubtaskUseCase.execute({
			subtaskId: 'nonExistentId',
			title: 'Edited subtask',
			description: 'Edited description',
		});

		expect(result.isFalse()).toBe(true);
		expect(result.value).toBeInstanceOf(ResourceNotFoundError);
	});
});
