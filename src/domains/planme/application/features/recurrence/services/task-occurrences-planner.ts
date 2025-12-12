import dayjs from 'dayjs';

import { generateOccurrences } from './recurrence-generator';
import { RecurrenceRule } from '@/domains/planme/models/entities/recurrence-rule';

interface IGenerateInitialOccurrencesRequest {
	rule: RecurrenceRule;
	fromDate: Date; // normalmente agora, ou rule.startDateTime
	horizonDays: number; // p.ex. 60 dias pra frente
}

export class TaskOccurrencesPlanner {
	generateInitialOccurrences({ rule, fromDate, horizonDays }: IGenerateInitialOccurrencesRequest): Date[] {
		const toDate = dayjs(fromDate).add(horizonDays, 'day').toDate();

		const maxToGenerate = 1000; // limite de segurança

		return generateOccurrences({
			rule,
			fromDate,
			maxToGenerate,
		}).filter((d) => d <= toDate);
	}
}
