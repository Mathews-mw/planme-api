import dayjs from 'dayjs';

import { RecurrenceRule } from '@/domains/planme/models/entities/recurrence-rule';

/**
 * Gera a próxima ocorrência baseada na regra e na data de referência ('from').
 * Unifica a lógica de validação de limites (MaxOccurrences, OnDate, Never).
 */
export function nextDailyIntervalOccurrence(rule: RecurrenceRule, from: Date): Date | null {
	if (rule.frequency !== 'DAILY_INTERVAL') {
		throw new Error('nextDailyIntervalOccurrence only supports DAILY_INTERVAL frequency');
	}

	const intervalDays = rule.interval ?? 1;

	if (intervalDays <= 0) {
		return null;
	}

	const startDateTime = dayjs(rule.startDateTime);

	// Se a data de referência ('from') for anterior ao início, a "próxima" é o próprio início.
	if (dayjs(from).isBefore(startDateTime)) {
		return startDateTime.toDate();
	}

	// --- 1. Cálculo Matemático da Próxima Data ---
	// Calculamos quantos intervalos inteiros existem entre o início e a data 'from'.
	// Isso garante que a nova data esteja sempre alinhada ao 'grid' da data de início.
	const diffDays = dayjs(from).diff(startDateTime, 'days');
	const occurrencesUntilNow = Math.floor(diffDays / intervalDays);

	// A próxima ocorrência é: (índice atual + 1) * intervalo
	const nextIndex = occurrencesUntilNow + 1;
	const nextOccurrence = startDateTime.add(nextIndex * intervalDays, 'days');

	// --- 2. Validação das Condições de Parada ---
	switch (rule.endType) {
		case 'AFTER_OCCURRENCES':
			// Se o índice da próxima ocorrência (0-based) for igual ou maior que o máximo, paramos.
			if (rule.maxOccurrences && nextIndex >= rule.maxOccurrences) {
				return null;
			}
			break;

		case 'ON_DATE':
			// Verifica se a data calculada ultrapassa a data limite
			if (rule.endDate && nextOccurrence.isAfter(dayjs(rule.endDate))) {
				return null;
			}
			break;

		case 'NEVER':
			// 'NEVER' geralmente não tem condição. Aqui é apenas um fallback
			if (rule.endDate && nextOccurrence.isAfter(dayjs(rule.endDate))) {
				return null;
			}
			break;

		default:
			return null;
	}

	return nextOccurrence.toDate();
}
