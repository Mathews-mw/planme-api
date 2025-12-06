import { TaskDefinition } from '@/domains/planme/models/entities/task-definition';

export interface ITaskDefinitionRepository {
	create(taskDefinition: TaskDefinition): Promise<void>;
	delete(taskDefinition: TaskDefinition): Promise<void>;
	update(taskDefinition: TaskDefinition): Promise<void>;
	findById(id: string): Promise<TaskDefinition | null>;
}
