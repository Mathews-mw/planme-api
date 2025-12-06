import z from 'zod';

import { Entity } from '@/core/entities/entity';
import { Optional } from '@/core/types/optional';
import { UniqueEntityId } from '@/core/entities/unique-entity-id';

export const taskPrioritySchema = z.union([
	z.literal('LOW'),
	z.literal('NORMAL'),
	z.literal('HIGH'),
	z.literal('NONE'),
]);

export type ITaskPriority = z.infer<typeof taskPrioritySchema>;

export interface ITaskDefinitionProps {
	userId: UniqueEntityId;
	title: string;
	description?: string | null;
	deadline?: Date | null;
	priority: ITaskPriority;
	isAllDay: boolean;
	isStarred: boolean;
	recurrenceRuleId: UniqueEntityId;
	createdAt: Date;
	updatedAt?: Date | null;
}

export class TaskDefinition extends Entity<ITaskDefinitionProps> {
	get userId() {
		return this.props.userId;
	}

	set userId(userId: UniqueEntityId) {
		this.props.userId = userId;
		this._touch();
	}

	get title() {
		return this.props.title;
	}

	set title(title: string) {
		this.props.title = title;
		this._touch();
	}

	get description() {
		return this.props.description;
	}

	set description(description: string | undefined | null) {
		this.props.description = description;
		this._touch();
	}

	get deadline() {
		return this.props.deadline;
	}

	set deadline(deadline: Date | undefined | null) {
		this.props.deadline = deadline;
		this._touch();
	}
	get priority() {
		return this.props.priority;
	}

	set priority(priority: ITaskPriority) {
		this.props.priority = priority;
		this._touch();
	}

	get isAllDay() {
		return this.props.isAllDay;
	}

	set isAllDay(isAllDay: boolean) {
		this.props.isAllDay = isAllDay;
		this._touch();
	}

	get isStarred() {
		return this.props.isStarred;
	}

	set isStarred(isStarred: boolean) {
		this.props.isStarred = isStarred;
		this._touch();
	}

	get recurrenceRuleId() {
		return this.props.recurrenceRuleId;
	}

	set recurrenceRuleId(recurrenceRuleId: UniqueEntityId) {
		this.props.recurrenceRuleId = recurrenceRuleId;
		this._touch();
	}

	get createdAt() {
		return this.props.createdAt;
	}

	get updatedAt() {
		return this.props.updatedAt;
	}

	private _touch() {
		this.props.updatedAt = new Date();
	}

	static create(
		props: Optional<ITaskDefinitionProps, 'priority' | 'isAllDay' | 'isStarred' | 'createdAt'>,
		id?: UniqueEntityId
	) {
		const taskDefinition = new TaskDefinition(
			{
				...props,
				priority: props.priority ?? 'NONE',
				isAllDay: props.isAllDay ?? false,
				isStarred: props.isStarred ?? false,
				createdAt: props.createdAt ?? new Date(),
			},
			id
		);

		return taskDefinition;
	}
}
