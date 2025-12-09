import { RecurrenceRule } from '@/domains/planme/models/entities/recurrence-rule';

export function getNextMonthlyDayOfMonthOccurrence(rule: RecurrenceRule, from: Date): Date | null {
	if (rule.frequency !== 'MONTHLY_DAY_OF_MONTH') {
		throw new Error('getNextMonthlyDayOfMonthOccurrence only supports MONTHLY_DAY_OF_MONTH frequency');
	}

	if (!rule.dayOfMonth || rule.dayOfMonth <= 0) {
		return null;
	}

	const start = rule.startDateTime;
	const dayOfMonth = rule.dayOfMonth;
	const monthsInterval = rule.interval && rule.interval > 0 ? rule.interval : 1;

	// Busca nunca começa antes do startDateTime
	const searchFrom = from.getTime() < start.getTime() ? start : from;

	if (rule.endType === 'ON_DATE' && rule.endDate) {
		if (searchFrom.getTime() > rule.endDate.getTime()) {
			return null;
		}
	}

	if (rule.endType === 'ONCE') {
		return start.getTime() > from.getTime() ? start : null;
	}

	// Base da contagem de meses (ano/mês do startDateTime)
	const baseYear = start.getUTCFullYear();
	const baseMonth = start.getUTCMonth(); // 0..11

	// Começa a partir do ano/mês de searchFrom
	let year = searchFrom.getUTCFullYear();
	let month = searchFrom.getUTCMonth(); // 0..11

	// Limite de segurança: busca no máximo alguns anos pra frente
	const safetyLimitMonths = 12 * 10; // 10 anos de meses

	for (let steps = 0; steps < safetyLimitMonths; steps++) {
		const monthsFromBase = (year - baseYear) * 12 + (month - baseMonth);

		if (monthsFromBase >= 0 && monthsFromBase % monthsInterval === 0) {
			// Último dia do mês atual (year, month)
			const lastDayOfMonth = getLastDayOfMonthUTC(year, month);
			const targetDay = Math.min(dayOfMonth, lastDayOfMonth);

			// Data candidata com dia ajustado e mesma hora/minuto/segundo do startDateTime
			const candidate = applyTimeOfDayUTC(new Date(Date.UTC(year, month, targetDay, 0, 0, 0, 0)), start);

			// 1) Nunca antes do startDateTime
			if (candidate.getTime() < start.getTime()) {
				// Série ainda não começou; vai pro próximo mês
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
			// Aqui NÃO checamos maxOccurrences porque isso depende
			// de quantas ocorrências já existem no histórico.
			// A responsabilidade de conferir isso fica num nível superior

			return candidate;
		}

		({ year, month } = addOneMonth(year, month));
	}

	// Não encontrou nada dentro do limite de segurança
	return null;
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
