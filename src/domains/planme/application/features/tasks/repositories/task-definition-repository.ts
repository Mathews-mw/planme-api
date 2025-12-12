import { ICursorParams, ICursorResponse } from '@/core/interfaces/paginating-interfaces';
import { TaskDefinition } from '@/domains/planme/models/entities/task-definition';
import { Task } from '@/domains/planme/models/entities/value-objects/task';

export interface ITaskQuerySearchCursor extends ICursorParams {
	userId: string;
	interval?: {
		from: string;
		to: string;
	};
}

export interface ITasksCursorResponse extends ICursorResponse {
	tasks: Array<Task>;
}

export interface ITaskDefinitionRepository {
	create(taskDefinition: TaskDefinition): Promise<void>;
	update(taskDefinition: TaskDefinition): Promise<void>;
	delete(taskDefinition: TaskDefinition): Promise<void>;
	findById(id: string): Promise<TaskDefinition | null>;
	findManyCursor(query: ITaskQuerySearchCursor): Promise<ITasksCursorResponse>;
}
