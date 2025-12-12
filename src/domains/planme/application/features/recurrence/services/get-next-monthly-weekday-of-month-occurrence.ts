import { dateToWeekday, Weekday } from './weekdays-bitmask';
import { RecurrenceRule } from '@/domains/planme/models/entities/recurrence-rule';

export function getNextMonthlyWeekdayOfMonthOccurrence(rule: RecurrenceRule, from: Date): Date | null {
	if (rule.frequency !== 'MONTHLY_WEEKDAYS_OF_MONTH') {
		throw new Error('getNextMonthlyWeekdayOfMonthOccurrence only supports MONTHLY_WEEKDAYS_OF_MONTH frequency');
	}

	if (!rule.weekOfMonth || !rule.weekdayOfMonth) {
		// sem semana do mês ou dia da semana definido = nunca acontece
		return null;
	}

	const weekOfMonth = rule.weekOfMonth; // 1..5 ou -1 (última)
	const weekdayOfMonth = rule.weekdayOfMonth as Weekday; // 1..7 (Mon..Sun)

	const start = rule.startDateTime;
	const monthsInterval = rule.interval && rule.interval > 0 ? rule.interval : 1;

	// Busca nunca começa antes do startDateTime
	const searchFrom = from.getTime() < start.getTime() ? start : from;

	// Se endType = ON_DATE e já passamos do fim, não há próxima
	if (rule.endType === 'ON_DATE' && rule.endDate) {
		if (searchFrom.getTime() > rule.endDate.getTime()) {
			return null;
		}
	}

	// Se endType = ONCE, só existe a ocorrência em startDateTime
	if (rule.endType === 'ONCE') {
		return start.getTime() > from.getTime() ? start : null;
	}

	// Base da contagem de meses (ano/mês da startDateTime)
	const baseYear = start.getUTCFullYear();
	const baseMonth = start.getUTCMonth(); // 0..11

	// Começa a partir do ano/mês de searchFrom
	let year = searchFrom.getUTCFullYear();
	let month = searchFrom.getUTCMonth(); // 0..11

	// Limite de segurança: máximo de meses a procurar (ex.: 10 anos)
	const safetyLimitMonths = 12 * 10;

	for (let steps = 0; steps < safetyLimitMonths; steps++) {
		const monthsFromBase = (year - baseYear) * 12 + (month - baseMonth);

		if (monthsFromBase >= 0 && monthsFromBase % monthsInterval === 0) {
			const candidate = getWeekdayOfMonthDateUTC(year, month, weekOfMonth, weekdayOfMonth, start);

			// Se não existe, ex.: 5ª segunda num mês que só tem 4, pula mês
			if (!candidate) {
				({ year, month } = addOneMonth(year, month));
				continue;
			}

			// 1) Nunca antes do startDateTime
			if (candidate.getTime() < start.getTime()) {
				({ year, month } = addOneMonth(year, month));
				continue;
			}

			// 2) Tem que ser estritamente depois de "from"
			if (candidate.getTime() <= from.getTime()) {
				({ year, month } = addOneMonth(year, month));
				continue;
			}

			// 3) Respeitar endDate se endType = ON_DATE
			if (rule.endType === 'ON_DATE' && rule.endDate) {
				if (candidate.getTime() > rule.endDate.getTime()) {
					return null;
				}
			}

			// 4) endType = AFTER_OCCURRENCES
			// Aqui NÃO checamos maxOccurrences, por depender do histórico.
			// Isso é responsabilidade de outro nível

			return candidate;
		}

		({ year, month } = addOneMonth(year, month));
	}

	// Não encontrou nada dentro do limite de segurança
	return null;
}

/**
 * Retorna a data da "weekOfMonth"-ésima ocorrência de "weekdayOfMonth"
 * em um determinado mês (UTC), OU a última ocorrência se weekOfMonth = -1.
 *
 * - weekOfMonth: 1..5 ou -1 (última)
 * - weekdayOfMonth: 1..7 (Monday..Sunday)
 *
 * O parâmetro `timeSource` define a hora/minuto/segundo/millis que serão aplicados.
 */
function getWeekdayOfMonthDateUTC(
	year: number,
	month: number, // 0..11
	weekOfMonth: number, // 1..5 ou -1
	weekdayOfMonth: Weekday, // 1..7 (Mon..Sun)
	timeSource: Date
): Date | null {
	const lastDay = getLastDayOfMonthUTC(year, month);

	if (weekOfMonth === -1) {
		// Última ocorrência daquele dia da semana no mês
		let day = lastDay;

		while (day >= 1) {
			const d = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
			const wd = dateToWeekday(d); // 1..7

			if (wd === weekdayOfMonth) {
				return applyTimeOfDayUTC(d, timeSource);
			}

			day--;
		}

		// Não deveria acontecer, mas por segurança:
		return null;
	}

	// weekOfMonth > 0 (1..5): enésima semana
	if (weekOfMonth < 1 || weekOfMonth > 5) {
		return null;
	}

	// 1º dia do mês
	const firstOfMonth = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
	const firstWeekday = dateToWeekday(firstOfMonth); // 1..7

	// Offset até o primeiro "weekdayOfMonth" no mês
	// (weekdayOfMonth - firstWeekday + 7) % 7
	const offsetDays = (weekdayOfMonth - firstWeekday + 7) % 7;

	const firstOccurrenceDay = 1 + offsetDays; // 1..7

	// Dia da enésima ocorrência
	const targetDay = firstOccurrenceDay + (weekOfMonth - 1) * 7;

	if (targetDay > lastDay) {
		// Ex.: 5ª segunda num mês com só 4 segundas → não existe
		return null;
	}

	const candidateDay = new Date(Date.UTC(year, month, targetDay, 0, 0, 0, 0));
	return applyTimeOfDayUTC(candidateDay, timeSource);
}

/**
 * Último dia do mês (1..31) em UTC.
 */
function getLastDayOfMonthUTC(year: number, month: number): number {
	// Date.UTC(year, month + 1, 0) → dia 0 do próximo mês = último dia do mês atual
	const d = new Date(Date.UTC(year, month + 1, 0, 0, 0, 0, 0));
	return d.getUTCDate();
}

/**
 * Soma 1 mês em (year, month), tratando rollover de ano.
 */
function addOneMonth(year: number, month: number): { year: number; month: number } {
	month += 1;
	if (month > 11) {
		month = 0;
		year += 1;
	}
	return { year, month };
}

/**
 * Aplica hora/minuto/segundo/millis de `timeSource` na data de `daySource` (UTC).
 */
function applyTimeOfDayUTC(daySource: Date, timeSource: Date): Date {
	return new Date(
		Date.UTC(
			daySource.getUTCFullYear(),
			daySource.getUTCMonth(),
			daySource.getUTCDate(),
			timeSource.getUTCHours(),
			timeSource.getUTCMinutes(),
			timeSource.getUTCSeconds(),
			timeSource.getUTCMilliseconds()
		)
	);
}
