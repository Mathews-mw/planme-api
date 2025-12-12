import dayjs from 'dayjs';
import { vi } from 'vitest';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import weekYear from 'dayjs/plugin/weekYear';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import objectSupport from 'dayjs/plugin/objectSupport';

import { RecurrenceRule } from '@/domains/planme/models/entities/recurrence-rule';
import { generateOccurrences } from '@/domains/planme/application/features/recurrence/services/recurrence-generator';
import { encodeWeekdays, Weekday } from '@/domains/planme/application/features/recurrence/services/weekdays-bitmask';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(objectSupport);
dayjs.extend(weekYear);
dayjs.extend(weekOfYear);

// Helper pra comparar datas por string ISO (evita problema de ms/timezone)
function iso(d: Date | null | undefined) {
	return d ? d.toISOString() : d;
}

const initialDate = new Date(new Date().getFullYear(), 0, 1, 10, 0);

describe('Generate Occurrences - DAILY_INTERVAL', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('should generate daily occurrences starting from the startDateTime and at 2-day intervals.', () => {
		vi.setSystemTime(initialDate);

		const rule = RecurrenceRule.create({
			frequency: 'DAILY_INTERVAL',
			endType: 'NEVER',
			startDateTime: initialDate,
			interval: 2,
			maxOccurrences: 999,
		});

		const fromDate = dayjs(initialDate).add(10, 'days');

		const occurrences = generateOccurrences({
			rule,
			fromDate: fromDate.toDate(),
			maxToGenerate: 3,
		});

		expect(occurrences).toHaveLength(3);
		expect(iso(occurrences[0])).toBe(fromDate.add(rule.interval!, 'days').toISOString());
		expect(iso(occurrences[1])).toBe(fromDate.add(rule.interval! * 2, 'days').toISOString());
		expect(iso(occurrences[2])).toBe(fromDate.add(rule.interval! * 3, 'days').toISOString());
	});

	it('should respect endType=ON_DATE and not generate after endDate.', () => {
		vi.setSystemTime(initialDate);

		const rule = RecurrenceRule.create({
			frequency: 'DAILY_INTERVAL',
			endType: 'ON_DATE',
			startDateTime: initialDate,
			endDate: dayjs(initialDate).add(8, 'days').toDate(),
			interval: 1,
			maxOccurrences: 9999,
		});

		const fromDate = dayjs(initialDate).add(5, 'days');

		const occurrences = generateOccurrences({
			rule,
			fromDate: fromDate.toDate(),
			maxToGenerate: 10,
		});

		expect(occurrences).toHaveLength(3);
		expect(occurrences.map(iso)).toEqual([
			fromDate.add(rule.interval!, 'days').toISOString(),
			fromDate.add(rule.interval! * 2, 'days').toISOString(),
			fromDate.add(rule.interval! * 3, 'days').toISOString(),
		]);
	});
});

describe('Generate Occurrences - WEEKLY_DAYS', () => {
	it('should generate occurrences on specific days of the week (e.g., Mon/Wed/Fri).', () => {
		const weekdaysMask = encodeWeekdays([Weekday.MONDAY, Weekday.WEDNESDAY, Weekday.FRIDAY]);

		const rule = RecurrenceRule.create({
			frequency: 'WEEKLY_DAYS',
			endType: 'NEVER',
			startDateTime: new Date('2025-01-06T09:00:00.000Z'), // segunda
			interval: 1,
			weekdaysBitmask: weekdaysMask,
			maxOccurrences: 9999,
		});

		const fromDate = new Date('2025-01-06T08:00:00.000Z');

		const occurrences = generateOccurrences({
			rule,
			fromDate,
			maxToGenerate: 4,
		});

		expect(occurrences).toHaveLength(4);
		// Deve retornar a próxima quarta, sexta, segunda e a quarta seguinte.
		// O motivo disso é porque a regra de negócio para gerar ocorrências é que:
		// Se fromDate < startDateTime, a PRIMEIRA ocorrência deve ser o próprio   startDateTime.
		// Isso significa que mesmo passando a data (2025-01-06T08:00:00.000Z), por ser uma hora mais cedo que `startDateTime`,
		// a função `generateOccurrences` vai considerar a hora definido em `startDateTime`
		// Portando, segunda não entra e a função retorna a data seguinte, no caso, a próxima quarta-feira
		expect(occurrences.map(iso)).toEqual([
			'2025-01-08T09:00:00.000Z', // Wednesday
			'2025-01-10T09:00:00.000Z', // Friday
			'2025-01-13T09:00:00.000Z', // Monday
			'2025-01-15T09:00:00.000Z', // next Wednesday
		]);
	});
});

describe('Generate Occurrences - MONTHLY_DAY_OF_MONTH', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("should be generated on the same day of the month and adjusted to the last day when it doesn't exist (e.g., February, etc.).", () => {
		vi.setSystemTime(initialDate);

		const rule = RecurrenceRule.create({
			frequency: 'MONTHLY_DAY_OF_MONTH',
			endType: 'NEVER',
			startDateTime: dayjs(initialDate).set('date', 31).toDate(),
			interval: 1,
			dayOfMonth: 31,
			maxOccurrences: 999,
		});

		const fromDate = dayjs(initialDate).set('date', 31);

		const occurrences = generateOccurrences({
			rule,
			fromDate: fromDate.toDate(),
			maxToGenerate: 5,
		});

		expect(occurrences.map(iso)).toEqual([
			fromDate.set('month', 1).toISOString(), // fevereiro (31 → 28)
			fromDate.set('month', 2).toISOString(), // março (31 ok)
			fromDate.set('month', 3).toISOString(), // abril (31 → 30)
			fromDate.set('month', 4).toISOString(), // maio  (31 ok)
			fromDate.set('month', 5).toISOString(), // junho (31 → 30)
		]);
	});
});

describe('Generate Occurrences - MONTHLY_WEEKDAYS_OF_MONTH', () => {
	it('should generate the third Wednesday of each month.', () => {
		const rule = RecurrenceRule.create({
			frequency: 'MONTHLY_WEEKDAYS_OF_MONTH',
			endType: 'NEVER',
			startDateTime: new Date('2025-01-01T10:00:00.000Z'), // só a hora importa
			interval: 1,
			weekOfMonth: 3, // terceira
			weekdayOfMonth: Weekday.WEDNESDAY, // quarta
			maxOccurrences: 9999,
		});

		const fromDate = new Date('2025-02-01T00:00:00.000Z');

		const occurrences = generateOccurrences({
			rule,
			fromDate,
			maxToGenerate: 2,
		});

		// Confere no calendário:
		// - 3ª quarta de fev/2025 é dia 19
		// - 3ª quarta de mar/2025 é dia 19
		expect(occurrences.map(iso)).toEqual(['2025-02-19T10:00:00.000Z', '2025-03-19T10:00:00.000Z']);
	});

	it('should generate the last Friday of each month.', () => {
		const rule = RecurrenceRule.create({
			frequency: 'MONTHLY_WEEKDAYS_OF_MONTH',
			endType: 'NEVER',
			startDateTime: new Date('2025-01-01T18:00:00.000Z'),
			interval: 1,
			weekOfMonth: -1, // última
			weekdayOfMonth: Weekday.FRIDAY,
			maxOccurrences: 9999,
		});

		const fromDate = new Date('2025-03-01T00:00:00.000Z');

		const occurrences = generateOccurrences({
			rule,
			fromDate,
			maxToGenerate: 2,
		});

		// Exemplo (confere no calendário)
		// - Última sexta de mar/2025: 28
		// - Última sexta de abr/2025: 25
		expect(occurrences.map(iso)).toEqual(['2025-03-28T18:00:00.000Z', '2025-04-25T18:00:00.000Z']);
	});
});

describe('Generate Occurrences - YEARLY_INTERVAL', () => {
	it('should repeated every year on the same date/time.', () => {
		const rule = RecurrenceRule.create({
			frequency: 'YEARLY_INTERVAL',
			endType: 'NEVER',
			startDateTime: new Date('2025-05-10T14:20:00.000Z'),
			interval: 1,
			maxOccurrences: 9999,
		});

		const fromDate = new Date('2026-03-01T10:00:00.000Z');

		const occurrences = generateOccurrences({
			rule,
			fromDate,
			maxToGenerate: 2,
		});

		expect(occurrences.map(iso)).toEqual(['2026-05-10T14:20:00.000Z', '2027-05-10T14:20:00.000Z']);
	});

	it('should adjust February 29th to the last day of February in non-leap years.', () => {
		const rule = RecurrenceRule.create({
			frequency: 'YEARLY_INTERVAL',
			endType: 'NEVER',
			startDateTime: new Date('2028-02-29T10:00:00.000Z'),
			interval: 1,
			maxOccurrences: 9999,
		});

		const fromDate = new Date('2028-03-01T00:00:00.000Z');

		const occurrences = generateOccurrences({
			rule,
			fromDate,
			maxToGenerate: 3,
		});

		expect(occurrences.map(iso)).toEqual([
			'2029-02-28T10:00:00.000Z',
			'2030-02-28T10:00:00.000Z',
			'2031-02-28T10:00:00.000Z',
		]);
	});
});

describe('Generate Occurrences - endType ONCE', () => {
	it('should not return any occurrences when endType=ONCE', () => {
		const rule = RecurrenceRule.create({
			frequency: 'DAILY_INTERVAL',
			endType: 'ONCE',
			startDateTime: new Date(),
			interval: 1,
			maxOccurrences: 1,
		});

		const fromDate = new Date();

		const occurrences = generateOccurrences({
			rule,
			fromDate,
			maxToGenerate: 10,
		});

		// Quando "endType=ONCE" não faz sentido ter recorrência pois a data é a própria startDateTime.
		expect(occurrences).toHaveLength(0);
	});

	it('should not generate anything if `fromDate` is after the only occurrence.', () => {
		const rule = RecurrenceRule.create({
			frequency: 'DAILY_INTERVAL',
			endType: 'ONCE',
			startDateTime: new Date('2025-01-01T09:00:00.000Z'),
			interval: 1,
			maxOccurrences: 1,
		});

		const fromDate = new Date('2025-01-02T00:00:00.000Z');

		const occurrences = generateOccurrences({
			rule,
			fromDate,
			maxToGenerate: 10,
		});

		expect(occurrences).toHaveLength(0);
	});
});

describe('Generate Occurrences - endType AFTER_OCCURRENCES', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('should respect maxOccurrences considering alreadyGeneratedCount', () => {
		vi.setSystemTime(initialDate);

		const rule = RecurrenceRule.create({
			frequency: 'DAILY_INTERVAL',
			endType: 'AFTER_OCCURRENCES',
			startDateTime: initialDate,
			interval: 1,
			maxOccurrences: 5,
		});

		const fromDate = dayjs(initialDate).add(3, 'days');

		// Já temos 4 ocorrências geradas no histórico (por exemplo no banco)
		const occurrences = generateOccurrences({
			rule,
			fromDate: fromDate.toDate(),
			maxToGenerate: 10,
			alreadyGeneratedCount: 4,
		});

		// Só pode gerar mais 1 (5 - 4)
		expect(occurrences).toHaveLength(1);
		expect(iso(occurrences[0])).toBe(fromDate.add(rule.interval!, 'days').toISOString());
	});

	it('should not generate anything else if alreadyGeneratedCount >= maxOccurrences', () => {
		vi.setSystemTime(initialDate);

		const rule = RecurrenceRule.create({
			frequency: 'DAILY_INTERVAL',
			endType: 'AFTER_OCCURRENCES',
			startDateTime: initialDate,
			interval: 1,
			maxOccurrences: 3,
		});

		const fromDate = dayjs(initialDate);

		const occurrences = generateOccurrences({
			rule,
			fromDate: fromDate.toDate(),
			maxToGenerate: 10,
			alreadyGeneratedCount: 3,
		});

		expect(occurrences).toHaveLength(0);
	});
});
