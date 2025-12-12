import { Subtask } from '@/domains/planme/models/entities/subtask';
import { ICursorParams, ICursorResponse } from '@/core/interfaces/paginating-interfaces';

export interface ISubtaskQuerySearchCursor extends ICursorParams {
	taskDefinitionId: string;
	interval?: {
		from: string;
		to: string;
	};
}

export interface ISubtasksCursorResponse extends ICursorResponse {
	subtasks: Array<Subtask>;
}

export interface ISubtaskRepository {
	create(subtask: Subtask): Promise<void>;
	update(subtask: Subtask): Promise<void>;
	updateMany(subtasks: Array<Subtask>): Promise<void>;
	delete(subtask: Subtask): Promise<void>;
	deleteManyByTaskId(taskId: string): Promise<void>;
	getMaxPosition(taskDefinitionId: string): Promise<number | null>;
	findById(id: string): Promise<Subtask | null>;
	findManyByTaskDefinitionId(taskDefinitionId: string): Promise<Array<Subtask>>;
}
