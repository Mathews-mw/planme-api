import { Subtask } from '../subtask';
import { ValueObject } from '@/core/entities/value-object';
import { ITaskDefinitionProps } from '../task-definition';
import { IRecurrenceRuleProps } from '../recurrence-rule';

export interface ITaskProps {
	taskDefinition: ITaskDefinitionProps;
	recurrenceRule: IRecurrenceRuleProps;
	subtasks?: Array<Subtask> | null;
}

export class Task extends ValueObject<ITaskProps> {
	get taskDefinition() {
		return this.props.taskDefinition;
	}

	get recurrenceRule() {
		return this.props.recurrenceRule;
	}

	get subtasks() {
		return this.props.subtasks;
	}

	static create(props: ITaskProps) {
		const task = new Task(props);

		return task;
	}
}
