import { TaskOccurrence } from '@/domains/planme/models/entities/task-occurrence';
import { ITaskOccurrenceRepository } from '@/domains/planme/application/features/tasks/repositories/task-occurrence-repository';

export class InMemoryTaskOccurrencesRepository implements ITaskOccurrenceRepository {
	public items: Array<TaskOccurrence> = [];

	async create(taskOccurrence: TaskOccurrence): Promise<void> {
		this.items.push(taskOccurrence);
	}

	async createMany(taskOccurrences: Array<TaskOccurrence>): Promise<void> {
		taskOccurrences.forEach((item) => this.items.push(item));
	}

	async update(taskOccurrence: TaskOccurrence): Promise<void> {
		const taskOccurrenceIndex = this.items.findIndex((item) => item.id.equals(taskOccurrence.id));

		if (taskOccurrenceIndex === -1) {
			throw new Error('Task Definition not found');
		}

		this.items[taskOccurrenceIndex] = taskOccurrence;
	}

	async updateMany(taskOccurrences: Array<TaskOccurrence>): Promise<void> {
		taskOccurrences.forEach((occ) => {
			const oldOccIndex = this.items.findIndex((item) => item.id.equals(occ.id));

			if (oldOccIndex !== -1) {
				this.items[oldOccIndex] = occ;
			}
		});
	}

	async delete(taskOccurrence: TaskOccurrence): Promise<void> {
		const taskOccurrenceIndex = this.items.findIndex((item) => item.id.equals(taskOccurrence.id));

		this.items.splice(taskOccurrenceIndex, 1);
	}

	async deleteMany(taskOccurrences: Array<TaskOccurrence>): Promise<void> {
		taskOccurrences.forEach((occ) => {
			const IndexOccToDelete = this.items.findIndex((item) => item.id.equals(occ.id));

			if (IndexOccToDelete !== -1) {
				this.items.splice(IndexOccToDelete, 1);
			}
		});
	}

	async deleteByTaskDefinitionId(taskDefinitionId: string): Promise<void> {
		const toUpdate = this.items.filter((occ) => occ.taskDefinitionId.toString() !== taskDefinitionId);

		this.items = toUpdate;
	}

	async findManyByTaskDefinition(taskDefinitionId: string): Promise<Array<TaskOccurrence>> {
		const occs = this.items.filter((occ) => occ.taskDefinitionId.toString() === taskDefinitionId);

		return occs;
	}

	async findById(id: string): Promise<TaskOccurrence | null> {
		const taskOccurrence = this.items.find((taskOccurrence) => taskOccurrence.id.toString() === id);

		if (!taskOccurrence) {
			return null;
		}

		return taskOccurrence;
	}
}
