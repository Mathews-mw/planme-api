/**
 * Bits individuais usados para montar o bitmask.
 * Cada valor é um "flag" que representa um dia.
 */
export enum WeekdayBit {
	MONDAY = 1 << 0, // 0000001 = 1
	TUESDAY = 1 << 1, // 0000010 = 2
	WEDNESDAY = 1 << 2, // 0000100 = 4
	THURSDAY = 1 << 3, // 0001000 = 8
	FRIDAY = 1 << 4, // 0010000 = 16
	SATURDAY = 1 << 5, // 0100000 = 32
	SUNDAY = 1 << 6, // 1000000 = 64
}

export enum Weekday {
	MONDAY = 1,
	TUESDAY = 2,
	WEDNESDAY = 3,
	THURSDAY = 4,
	FRIDAY = 5,
	SATURDAY = 6,
	SUNDAY = 7,
}

const weekdayToBit: Record<Weekday, WeekdayBit> = {
	[Weekday.MONDAY]: WeekdayBit.MONDAY,
	[Weekday.TUESDAY]: WeekdayBit.TUESDAY,
	[Weekday.WEDNESDAY]: WeekdayBit.WEDNESDAY,
	[Weekday.THURSDAY]: WeekdayBit.THURSDAY,
	[Weekday.FRIDAY]: WeekdayBit.FRIDAY,
	[Weekday.SATURDAY]: WeekdayBit.SATURDAY,
	[Weekday.SUNDAY]: WeekdayBit.SUNDAY,
};

const bitToWeekday: [WeekdayBit, Weekday][] = [
	[WeekdayBit.MONDAY, Weekday.MONDAY],
	[WeekdayBit.TUESDAY, Weekday.TUESDAY],
	[WeekdayBit.WEDNESDAY, Weekday.WEDNESDAY],
	[WeekdayBit.THURSDAY, Weekday.THURSDAY],
	[WeekdayBit.FRIDAY, Weekday.FRIDAY],
	[WeekdayBit.SATURDAY, Weekday.SATURDAY],
	[WeekdayBit.SUNDAY, Weekday.SUNDAY],
];

/**
 * Bitmask com todos os dias da semana ligados.
 * Útil para alguns cenários de default.
 */
export const allWeekdaysMask: number =
	WeekdayBit.MONDAY |
	WeekdayBit.TUESDAY |
	WeekdayBit.WEDNESDAY |
	WeekdayBit.THURSDAY |
	WeekdayBit.FRIDAY |
	WeekdayBit.SATURDAY |
	WeekdayBit.SUNDAY;

/**
 * Recebe um array de Weekday e retorna o bitmask numérico.
 *
 * Ex:
 *  encodeWeekdays([MONDAY, WEDNESDAY, FRIDAY]) => 21
 */
export function encodeWeekdays(days: Weekday[]): number {
	return days.reduce((mask, day) => {
		return mask | weekdayToBit[day];
	}, 0);
}

/**
 * Converte um bitmask numérico de volta para um array de Weekday.
 *
 * A ordem retornada segue a ordem natural Monday..Sunday.
 */
export function decodeWeekdays(mask: number): Weekday[] {
	if (!mask) return [];

	return bitToWeekday.filter(([bit]) => (mask & bit) !== 0).map(([, weekday]) => weekday);
}

export function hasWeekday(mask: number, day: Weekday): boolean {
	const bit = weekdayToBit[day];
	return (mask & bit) !== 0;
}

/**
 * Converte uma Date (usando getUTCDay) para Weekday (1..7).
 */
export function dateToWeekday(date: Date): Weekday {
	const jsDay = date.getUTCDay(); // 0..6, Sunday..Saturday
	return weekdayFromJsDay(jsDay);
}
/**
 * Converte o retorno de Date#getUTCDay() (0..6)
 * para Weekday (1..7, Monday..Sunday).
 *
 * JS: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
 * ISO: 1 = Monday, ..., 7 = Sunday
 */
export function weekdayFromJsDay(jsDay: number): Weekday {
	if (jsDay < 0 || jsDay > 6) {
		throw new RangeError(`Invalid JS day: ${jsDay}. Expected 0..6`);
	}

	// (0=Sunday → 7), (1=Monday → 1), ..., (6=Saturday → 6)
	const isoDay = ((jsDay + 6) % 7) + 1;
	return isoDay as Weekday;
}
