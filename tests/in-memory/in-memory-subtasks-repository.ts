import { Subtask } from '@/domains/planme/models/entities/subtask';
import { ISubtaskRepository } from '@/domains/planme/application/features/tasks/repositories/subtask-repository';

export class InMemorySubtasksRepository implements ISubtaskRepository {
	public items: Array<Subtask> = [];

	async create(subtask: Subtask): Promise<void> {
		this.items.push(subtask);
	}

	async update(subtask: Subtask): Promise<void> {
		const subtaskIndex = this.items.findIndex((item) => item.id.equals(subtask.id));

		if (subtaskIndex === -1) {
			throw new Error('Task Definition not found');
		}

		this.items[subtaskIndex] = subtask;
	}

	async updateMany(subtasks: Array<Subtask>): Promise<void> {
		subtasks.forEach((occ) => {
			const oldIndex = this.items.findIndex((item) => item.id.equals(occ.id));

			if (oldIndex !== -1) {
				this.items[oldIndex] = occ;
			}
		});
	}

	async delete(subtask: Subtask): Promise<void> {
		const subtaskIndex = this.items.findIndex((item) => item.id.equals(subtask.id));

		this.items.splice(subtaskIndex, 1);
	}

	async deleteManyByTaskId(taskId: string): Promise<void> {
		const toUpdate = this.items.filter((occ) => occ.taskDefinitionId.toString() !== taskId);

		this.items = toUpdate;
	}

	async findManyByTaskDefinitionId(taskDefinitionId: string): Promise<Array<Subtask>> {
		const subtasks = this.items.filter((subtask) => subtask.taskDefinitionId.toString() === taskDefinitionId);

		return subtasks;
	}

	async findById(id: string): Promise<Subtask | null> {
		const subtask = this.items.find((subtask) => subtask.id.toString() === id);

		if (!subtask) {
			return null;
		}

		return subtask;
	}

	async getMaxPosition(taskDefinitionId: string): Promise<number | null> {
		const subtasks = this.items.filter((subtask) => subtask.taskDefinitionId.toString() === taskDefinitionId);

		if (subtasks.length <= 0) {
			return null;
		}

		const sorted = subtasks.sort((a, b) => b.position - a.position);

		return sorted[0].position;
	}
}
