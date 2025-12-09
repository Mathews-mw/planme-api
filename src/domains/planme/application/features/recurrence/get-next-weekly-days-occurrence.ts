import { Weekday, dateToWeekday, hasWeekday } from './weekdays-bitmask';
import { RecurrenceRule } from '@/domains/planme/models/entities/recurrence-rule';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Gera a próxima ocorrência do dia da semana baseada na regra (frequency = 'WEEKLY_DAYS') e na data de referência ('from').
 */
export function getNextWeeklyDaysOccurrence(rule: RecurrenceRule, from: Date): Date | null {
	if (rule.frequency !== 'WEEKLY_DAYS') {
		throw new Error('getNextWeeklyDaysOccurrence only supports WEEKLY_DAYS frequency');
	}

	if (!rule.weekdaysBitmask || rule.weekdaysBitmask === 0) {
		// regra semanal sem dias selecionados = nunca acontece
		return null;
	}

	// intervalo de semanas (a cada X semanas)
	const weeksInterval = rule.interval && rule.interval > 0 ? rule.interval : 1;

	const start = rule.startDateTime;

	// A busca nunca começa antes do startDateTime da regra
	const searchFrom = from.getTime() < start.getTime() ? start : from;

	// Se endType = ON_DATE e já passamos do fim, não há próxima
	if (rule.endType === 'ON_DATE' && rule.endDate) {
		if (searchFrom.getTime() > rule.endDate.getTime()) {
			return null;
		}
	}

	// Se endType = ONCE, a única ocorrência é no startDateTime
	if (rule.endType === 'ONCE') {
		// Se a única ocorrência ainda é futura em relação ao "from", retorna
		return start.getTime() > from.getTime() ? start : null;
	}

	// Base da contagem de semanas: início da semana da startDateTime
	const baseWeekStart = startOfWeekUTC(start);

	// Começa a procurar a partir do dia (00:00) do searchFrom
	let cursorDay = startOfDayUTC(searchFrom);

	// Limite de segurança pra não fazer loop infinito
	// (ex.: procurar no máximo 2 anos pra frente)
	const safetyLimitDays = 7 * 52 * 2; // 2 anos de semanas

	for (let steps = 0; steps < safetyLimitDays; steps++) {
		const currentWeekStart = startOfWeekUTC(cursorDay);
		const weeksFromBase = Math.floor((currentWeekStart.getTime() - baseWeekStart.getTime()) / (7 * MS_PER_DAY));

		if (weeksFromBase >= 0 && weeksFromBase % weeksInterval === 0) {
			const weekday = dateToWeekday(cursorDay); // 1..7
			if (hasWeekday(rule.weekdaysBitmask!, weekday as Weekday)) {
				// Aplica a hora/minuto/segundo da startDateTime no dia do cursor
				const candidate = applyTimeOfDayUTC(cursorDay, start);

				// 1) Nunca antes do startDateTime
				if (candidate.getTime() < start.getTime()) {
					// ex.: from jogou o cursor pra antes do start no mesmo dia
					// nesse caso, ignoramos e seguimos pro próximo dia
					cursorDay = addDaysUTC(cursorDay, 1);
					continue;
				}

				// 2) Precisa ser estritamente após "from" (próxima ocorrência)
				if (candidate.getTime() <= from.getTime()) {
					cursorDay = addDaysUTC(cursorDay, 1);
					continue;
				}

				// 3) Respeitar endDate se endType = ON_DATE
				if (rule.endType === 'ON_DATE' && rule.endDate) {
					if (candidate.getTime() > rule.endDate.getTime()) {
						return null;
					}
				}

				// 4) **ATENÇÃO**: endType = AFTER_OCCURRENCES
				// Aqui a gente NÃO consegue saber se já atingiu maxOccurrences,
				// porque isso depende de quantas ocorrências já aconteceram.
				// A suposição é que esse limite será tratado em outro nível
				// (por exemplo, usando TaskOccurrence persistido).
				//
				// Então aqui retornamos o próximo candidato e deixamos o
				// "chamador" decidir se ainda está dentro do limite de ocorrências.

				return candidate;
			}
		}

		// avança um dia e continua procurando
		cursorDay = addDaysUTC(cursorDay, 1);
	}

	// Não encontrou nada no horizonte de segurança
	return null;
}

/**
 * Retorna o início do dia (00:00:00.000) em UTC.
 */
function startOfDayUTC(date: Date): Date {
	return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0));
}

/**
 * Retorna o início da semana (segunda-feira) em UTC,
 * baseado na data informada.
 */
function startOfWeekUTC(date: Date): Date {
	const day = date.getUTCDay(); // JS: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
	const diffToMonday = (day + 6) % 7; // 0 = Monday, 1 = Tuesday, ..., 6 = Sunday
	const startOfDay = startOfDayUTC(date);
	startOfDay.setUTCDate(startOfDay.getUTCDate() - diffToMonday);
	return startOfDay;
}

/**
 * Soma dias a uma data em UTC.
 */
function addDaysUTC(date: Date, days: number): Date {
	const d = new Date(date.getTime());
	d.setUTCDate(d.getUTCDate() + days);
	return d;
}

/**
 * Aplica a hora/minuto/segundo/millis de `timeSource` na data de `daySource`,
 * considerando UTC.
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
