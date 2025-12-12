import { makeSubtask } from 'tests/factories/make-task';
import { InMemorySubtasksRepository } from 'tests/in-memory/in-memory-subtasks-repository';
import { ToggleSubtaskCompleteUseCase } from '@/domains/planme/application/features/tasks/use-cases/toggle-subtask-complete-use-case';
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error';

let subtasksRepository: InMemorySubtasksRepository;
let toggleSubtaskCompleteUseCase: ToggleSubtaskCompleteUseCase;

describe('Toggle Complete Subtask Use Case', () => {
	beforeEach(() => {
		subtasksRepository = new InMemorySubtasksRepository();
		toggleSubtaskCompleteUseCase = new ToggleSubtaskCompleteUseCase(subtasksRepository);
	});

	it('should mark a subtask as completed', async () => {
		const subtask = makeSubtask();
		subtasksRepository.items.push(subtask);

		const result = await toggleSubtaskCompleteUseCase.execute({ subtaskId: subtask.id.toString() });

		expect(result.isSuccess()).toBe(true);

		const subtaskStored = subtasksRepository.items[0];

		expect(subtaskStored.isCompleted).toBe(true);
		expect(subtaskStored.completedAt).toEqual(expect.any(Date));
	});

	it('should unmark a completed subtask', async () => {
		const subtask = makeSubtask({ isCompleted: true, completedAt: new Date() });
		subtasksRepository.items.push(subtask);

		const result = await toggleSubtaskCompleteUseCase.execute({ subtaskId: subtask.id.toString() });

		expect(result.isSuccess()).toBe(true);

		const subtaskStored = subtasksRepository.items[0];

		expect(subtaskStored.isCompleted).toBe(false);
		expect(subtaskStored.completedAt).toBeNull();
	});

	it('should not be able to mark as complete an nonexistent subtask', async () => {
		const result = await toggleSubtaskCompleteUseCase.execute({
			subtaskId: 'nonExistentId',
		});

		expect(result.isFalse()).toBe(true);
		expect(result.value).toBeInstanceOf(ResourceNotFoundError);
	});
});
