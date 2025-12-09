import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import objectSupport from 'dayjs/plugin/objectSupport';

import { nextDailyIntervalOccurrence } from './get-next-daily-ocurrence';
import { getNextWeeklyDaysOccurrence } from './get-next-weekly-days-occurrence';
import { RecurrenceRule } from '@/domains/planme/models/entities/recurrence-rule';
import { getNextYearlyIntervalOccurrence } from './get-next-yearly-interval-occurrence';
import { getNextMonthlyDayOfMonthOccurrence } from './get-next-monthly-day-of-month-occurrence';
import { getNextMonthlyWeekdayOfMonthOccurrence } from './get-next-monthly-weekday-of-month-occurrence';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(objectSupport);

// dayjs.tz.setDefault('America/Sao_Paulo');

interface IGenerateOccurrencesRequest {
	rule: RecurrenceRule;
	fromDate: Date;
	untilDate?: Date;
	/**
	 * Defini uma quantidade máxima de ocorrências que a função vai gerar. Default = 1
	 */
	maxToGenerate?: number;
	/**
	 * quantas ocorrências dessa regra já existem no sistema (TaskOccurrence)
	 */
	alreadyGeneratedCount?: number;
}

/**
 * A função nunca chama _nextOccurrence com fromDate < RecurrenceRule.startDateTime. Nesse caso, a função vai considerar o fromDate = startDateTime.
 *
 * Cada getNextXxxOccurrence:
 * - Se from <= startDateTime → considera o próprio startDateTime como próxima ocorrência.
 * - Se from > startDateTime → devolve a primeira > from.
 */
export function generateOccurrences({
	rule,
	fromDate,
	maxToGenerate = 1,
	alreadyGeneratedCount = 0,
}: IGenerateOccurrencesRequest): Array<Date> {
	if (rule.frequency === 'NONE') {
		return [];
	}

	const occurrencesResult: Array<Date> = [];

	// Data mínima a considerar (não gerar antes do start).
	const minDate = fromDate.getTime() < rule.startDateTime.getTime() ? rule.startDateTime : fromDate;

	// 1) Quanto ainda posso gerar segundo a REGRA?
	let remainingByRule = Infinity;

	if (rule.endType === 'AFTER_OCCURRENCES' && rule.maxOccurrences && rule.maxOccurrences > 0) {
		remainingByRule = rule.maxOccurrences - alreadyGeneratedCount;
		if (remainingByRule <= 0) {
			// já atingiu o limite global da regra
			return [];
		}
	}

	// 2) Limite efetivo dessa chamada = min(limite da regra, limite da função)
	const effectiveLimit = Math.min(maxToGenerate, remainingByRule);

	let dateRef = minDate;

	while (occurrencesResult.length < effectiveLimit) {
		const nextOcc = _nextOccurrence(rule, dateRef);

		if (!nextOcc) {
			break;
		}

		dateRef = nextOcc;
		occurrencesResult.push(nextOcc);
	}

	return occurrencesResult;
}

function _nextOccurrence(rule: RecurrenceRule, from: Date): Date | null {
	switch (rule.frequency) {
		case 'DAILY_INTERVAL':
			return nextDailyIntervalOccurrence(rule, from);
		case 'WEEKLY_DAYS':
			return getNextWeeklyDaysOccurrence(rule, from);
		case 'MONTHLY_DAY_OF_MONTH':
			return getNextMonthlyDayOfMonthOccurrence(rule, from);
		case 'MONTHLY_WEEKDAYS_OF_MONTH':
			return getNextMonthlyWeekdayOfMonthOccurrence(rule, from);
		case 'YEARLY_INTERVAL':
			return getNextYearlyIntervalOccurrence(rule, from);
		case 'NONE':
			return null;
		default:
			return null;
	}
}
