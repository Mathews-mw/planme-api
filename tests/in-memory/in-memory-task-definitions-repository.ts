import { TaskDefinition } from '@/domains/planme/models/entities/task-definition';
import {
	ITaskDefinitionRepository,
	ITaskQuerySearchCursor,
	ITasksCursorResponse,
} from '@/domains/planme/application/features/tasks/repositories/task-definition-repository';

export class InMemoryTaskDefinitionsRepository implements ITaskDefinitionRepository {
	public items: Array<TaskDefinition> = [];

	async create(taskDefinition: TaskDefinition): Promise<void> {
		this.items.push(taskDefinition);
	}

	async update(taskDefinition: TaskDefinition): Promise<void> {
		const taskDefinitionIndex = this.items.findIndex((item) => item.id.equals(taskDefinition.id));

		if (taskDefinitionIndex === -1) {
			throw new Error('Task Definition not found');
		}

		this.items[taskDefinitionIndex] = taskDefinition;
	}

	async delete(taskDefinition: TaskDefinition): Promise<void> {
		const taskDefinitionIndex = this.items.findIndex((item) => item.id.equals(taskDefinition.id));

		this.items.splice(taskDefinitionIndex, 1);
	}

	findManyCursor({}: ITaskQuerySearchCursor): Promise<ITasksCursorResponse> {
		throw new Error('Method not implemented.');
	}

	async findById(id: string): Promise<TaskDefinition | null> {
		const taskDefinition = this.items.find((taskDefinition) => taskDefinition.id.toString() === id);

		if (!taskDefinition) {
			return null;
		}

		return taskDefinition;
	}
}
