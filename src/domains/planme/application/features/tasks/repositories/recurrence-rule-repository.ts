import { RecurrenceRule } from '@/domains/planme/models/entities/recurrence-rule';

export interface IRecurrenceRuleRepository {
	create(recurrenceRule: RecurrenceRule): Promise<void>;
	delete(recurrenceRule: RecurrenceRule): Promise<void>;
	update(recurrenceRule: RecurrenceRule): Promise<void>;
	findById(id: string): Promise<RecurrenceRule | null>;
}
