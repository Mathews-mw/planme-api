import z from 'zod';

import { Entity } from '@/core/entities/entity';
import { Optional } from '@/core/types/optional';
import { UniqueEntityId } from '@/core/entities/unique-entity-id';

export const taskStatusSchema = z.union([
	z.literal('PENDING'),
	z.literal('COMPLETED'),
	z.literal('CANCELED'),
	z.literal('SKIPPED'),
]);

export type ITaskStatus = z.infer<typeof taskStatusSchema>;

export interface ITaskOccurrenceProps {
	taskDefinitionId: UniqueEntityId;
	occurrenceDateTime: Date;
	status: ITaskStatus;
	note?: string | null;
	completedAt?: Date | null;
	createdAt: Date;
	updatedAt?: Date | null;
}

export class TaskOccurrence extends Entity<ITaskOccurrenceProps> {
	get taskDefinitionId() {
		return this.props.taskDefinitionId;
	}

	set taskDefinitionId(taskDefinitionId: UniqueEntityId) {
		this.props.taskDefinitionId = taskDefinitionId;
		this._touch();
	}

	get status() {
		return this.props.status;
	}

	set status(status: ITaskStatus) {
		this.props.status = status;
		this._touch();
	}

	get note() {
		return this.props.note;
	}

	set note(note: string | undefined | null) {
		this.props.note = note;
		this._touch();
	}

	get completedAt() {
		return this.props.completedAt;
	}

	set completedAt(completedAt: Date | undefined | null) {
		this.props.completedAt = completedAt;
		this._touch();
	}

	get createdAt() {
		return this.props.createdAt;
	}

	get updatedAt() {
		return this.props.updatedAt;
	}

	complete() {
		this.props.status = 'COMPLETED';
		this.props.completedAt = new Date();
		this._touch();
	}

	private _touch() {
		this.props.updatedAt = new Date();
	}

	static create(props: Optional<ITaskOccurrenceProps, 'status'>, id?: UniqueEntityId) {
		const taskDefinition = new TaskOccurrence(
			{
				...props,
				status: props.status ?? 'PENDING',
				createdAt: props.createdAt ?? new Date(),
			},
			id
		);

		return taskDefinition;
	}
}
