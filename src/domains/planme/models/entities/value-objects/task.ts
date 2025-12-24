import { Subtask } from '../subtask';
import { ITaskDefinitionProps } from '../task-definition';
import { IRecurrenceRuleProps } from '../recurrence-rule';
import { ITaskOccurrenceProps } from '../task-occurrence';
import { ValueObject } from '@/core/entities/value-object';

export interface ITaskProps {
	taskDefinition: ITaskDefinitionProps;
	recurrenceRule: IRecurrenceRuleProps;
	occurrences?: Array<ITaskOccurrenceProps> | null;
	subtasks?: Array<Subtask> | null;
}

export class Task extends ValueObject<ITaskProps> {
	get taskDefinition() {
		return this.props.taskDefinition;
	}

	get recurrenceRule() {
		return this.props.recurrenceRule;
	}

	get occurrences() {
		return this.props.occurrences;
	}

	get subtasks() {
		return this.props.subtasks;
	}

	static create(props: ITaskProps) {
		const task = new Task(props);

		return task;
	}
}
