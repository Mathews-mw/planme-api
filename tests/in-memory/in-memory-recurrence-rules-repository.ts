import { IRecurrenceRuleRepository } from '@/domains/planme/application/features/tasks/repositories/recurrence-rule-repository';
import { RecurrenceRule } from '@/domains/planme/models/entities/recurrence-rule';

export class InMemoryRecurrenceRulesRepository implements IRecurrenceRuleRepository {
	public items: Array<RecurrenceRule> = [];

	async create(recurrenceRule: RecurrenceRule): Promise<void> {
		this.items.push(recurrenceRule);
	}

	async update(recurrenceRule: RecurrenceRule): Promise<void> {
		const recurrenceRuleIndex = this.items.findIndex((item) => item.id.equals(recurrenceRule.id));

		if (recurrenceRuleIndex === -1) {
			throw new Error('Recurrence Rule not found');
		}

		this.items[recurrenceRuleIndex] = recurrenceRule;
	}

	async delete(recurrenceRule: RecurrenceRule): Promise<void> {
		const recurrenceRuleIndex = this.items.findIndex((item) => item.id.equals(recurrenceRule.id));

		this.items.splice(recurrenceRuleIndex, 1);
	}

	async findById(id: string): Promise<RecurrenceRule | null> {
		const recurrenceRule = this.items.find((recurrenceRule) => recurrenceRule.id.toString() === id);

		if (!recurrenceRule) {
			return null;
		}

		return recurrenceRule;
	}
}
