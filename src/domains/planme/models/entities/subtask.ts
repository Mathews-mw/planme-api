import { Entity } from '@/core/entities/entity';
import { Optional } from '@/core/types/optional';
import { UniqueEntityId } from '@/core/entities/unique-entity-id';

export interface ISubtaskProps {
	taskDefinitionId: UniqueEntityId;
	title: string;
	description?: string | null;
	position: number;
	isCompleted: boolean;
	completedAt?: Date | null;
	createdAt: Date;
	updatedAt?: Date | null;
}

export class Subtask extends Entity<ISubtaskProps> {
	get taskDefinitionId() {
		return this.props.taskDefinitionId;
	}

	set taskDefinitionId(taskDefinitionId: UniqueEntityId) {
		this.props.taskDefinitionId = taskDefinitionId;
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

	get position() {
		return this.props.position;
	}

	set position(position: number) {
		this.props.position = position;
		this._touch();
	}

	get isCompleted() {
		return this.props.isCompleted;
	}

	set isCompleted(isCompleted: boolean) {
		this.props.isCompleted = isCompleted;
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
		this.props.completedAt = new Date();
		this._touch();
	}

	private _touch() {
		this.props.updatedAt = new Date();
	}

	static create(props: Optional<ISubtaskProps, 'position' | 'isCompleted' | 'createdAt'>, id?: UniqueEntityId) {
		const subtask = new Subtask(
			{
				...props,
				position: props.position ?? 0,
				isCompleted: props.isCompleted ?? false,
				createdAt: props.createdAt ?? new Date(),
			},
			id
		);

		return subtask;
	}
}
