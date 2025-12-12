import { ITaskStatus, TaskOccurrence } from '@/domains/planme/models/entities/task-occurrence';

interface IQuerySearch {
	status?: ITaskStatus;
}

export interface ITaskOccurrenceRepository {
	create(taskOccurrence: TaskOccurrence): Promise<void>;
	createMany(taskOccurrences: Array<TaskOccurrence>): Promise<void>;
	update(taskOccurrence: TaskOccurrence): Promise<void>;
	updateMany(taskOccurrences: Array<TaskOccurrence>): Promise<void>;
	delete(taskOccurrence: TaskOccurrence): Promise<void>;
	deleteMany(taskOccurrences: Array<TaskOccurrence>): Promise<void>;
	deleteByTaskDefinitionId(taskDefinitionId: string): Promise<void>;
	findManyByTaskDefinition(taskDefinitionId: string, query?: IQuerySearch): Promise<Array<TaskOccurrence>>;
	findById(id: string): Promise<TaskOccurrence | null>;
}
