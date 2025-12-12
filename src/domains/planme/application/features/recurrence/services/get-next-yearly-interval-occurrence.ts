import { RecurrenceRule } from '@/domains/planme/models/entities/recurrence-rule';

export function getNextYearlyIntervalOccurrence(rule: RecurrenceRule, from: Date): Date | null {
	if (rule.frequency !== 'YEARLY_INTERVAL') {
		throw new Error('getNextYearlyIntervalOccurrence only supports YEARLY_INTERVAL frequency');
	}

	const start = rule.startDateTime;

	// intervalo de anos (a cada X anos)
	const yearsInterval = rule.interval && rule.interval > 0 ? rule.interval : 1;

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

	// Base da contagem: ano de startDateTime
	const baseYear = start.getUTCFullYear();
	const baseMonth = start.getUTCMonth(); // 0..11
	const baseDay = start.getUTCDate(); // 1..31

	// Começa a partir do ano de searchFrom
	let year = searchFrom.getUTCFullYear();

	// Limite de segurança: quantos anos no máximo vamos procurar (ex.: 100 anos)
	const safetyLimitYears = 100;

	for (let steps = 0; steps < safetyLimitYears; steps++) {
		const yearsFromBase = year - baseYear;

		if (yearsFromBase >= 0 && yearsFromBase % yearsInterval === 0) {
			const candidate = buildYearlyCandidateUTC(year, baseMonth, baseDay, start);

			// 1) Nunca antes do startDateTime
			if (candidate.getTime() < start.getTime()) {
				year += 1;
				continue;
			}

			// 2) Tem que ser estritamente depois de "from"
			if (candidate.getTime() <= from.getTime()) {
				year += 1;
				continue;
			}

			// 3) Respeitar endDate se endType = ON_DATE
			if (rule.endType === 'ON_DATE' && rule.endDate) {
				if (candidate.getTime() > rule.endDate.getTime()) {
					return null;
				}
			}

			// 4) endType = AFTER_OCCURRENCES
			// Aqui NÃO checamos maxOccurrences, pois depende de quantas
			// ocorrências já existem no histórico (TaskOccurrence no banco).
			// Essa responsabilidade fica em outro nível.

			return candidate;
		}

		year += 1;
	}

	// Não encontrou nada dentro do limite de segurança
	return null;
}

/**
 * Monta a data anual usando:
 * - year: ano alvo
 * - month: mês (0..11) do startDateTime
 * - day: dia (1..31) do startDateTime
 *
 * Se o `day` não existir nesse ano/mês (ex.: 29/02 em ano não bissexto),
 * usa o último dia desse mês.
 *
 * A hora/minuto/segundo/millis vem de `timeSource`.
 */
function buildYearlyCandidateUTC(
	year: number,
	month: number, // 0..11
	day: number, // 1..31
	timeSource: Date
): Date {
	const lastDayOfMonth = getLastDayOfMonthUTC(year, month);
	const targetDay = Math.min(day, lastDayOfMonth);

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
