import { injectable } from 'tsyringe';

import { Outcome, success } from '@/core/outcome';
import { Task } from '@/domains/planme/models/entities/value-objects/task';
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error';
import { ITaskDefinitionRepository } from '../repositories/task-definition-repository';
import { ICursorParams, ICursorResponse } from '@/core/interfaces/paginating-interfaces';

interface IRequest extends ICursorParams {
	userId: string;
	interval?: {
		from: string;
		to: string;
	};
}

type Response = Outcome<ResourceNotFoundError, { cursor: ICursorResponse; tasks: Array<Task> }>;

@injectable()
export class ListingUserTasksUseCase {
	constructor(private taskDefinitionRepository: ITaskDefinitionRepository) {}

	async execute({ limit, cursor, skip, userId, interval }: IRequest): Promise<Response> {
		const { nextCursor, previousCursor, hasMore, tasks } = await this.taskDefinitionRepository.findManyCursor({
			limit,
			cursor,
			skip,
			userId,
			interval,
		});

		return success({ cursor: { hasMore, nextCursor, previousCursor }, tasks });
	}
}
