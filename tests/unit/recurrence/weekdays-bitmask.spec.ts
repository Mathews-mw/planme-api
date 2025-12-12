import {
	allWeekdaysMask,
	dateToWeekday,
	decodeWeekdays,
	encodeWeekdays,
	hasWeekday,
	Weekday,
	WeekdayBit,
	weekdayFromJsDay,
} from '@/domains/planme/application/features/recurrence/services/weekdays-bitmask';

describe('Weekdays Bitmask', () => {
	describe('encodeWeekdays', () => {
		it('should return 0 for an empty array', () => {
			const mask = encodeWeekdays([]);
			expect(mask).toBe(0);
		});

		it('should encode a single weekday correctly', () => {
			const mask = encodeWeekdays([Weekday.MONDAY]);
			expect(mask).toBe(WeekdayBit.MONDAY);
		});

		it('should encode multiple weekdays using bitwise OR', () => {
			const mask = encodeWeekdays([Weekday.MONDAY, Weekday.WEDNESDAY, Weekday.FRIDAY]);

			// 1 | 4 | 16 = 21
			expect(mask).toBe(WeekdayBit.MONDAY | WeekdayBit.WEDNESDAY | WeekdayBit.FRIDAY);
			expect(mask).toBe(21);
		});
	});

	describe('hasWeekday', () => {
		it('should return true when mask contains the weekday', () => {
			const mask = encodeWeekdays([Weekday.MONDAY, Weekday.WEDNESDAY]);

			expect(hasWeekday(mask, Weekday.MONDAY)).toBe(true);
			expect(hasWeekday(mask, Weekday.WEDNESDAY)).toBe(true);
		});

		it('should return false when mask does not contain the weekday', () => {
			const mask = encodeWeekdays([Weekday.MONDAY, Weekday.WEDNESDAY]);

			expect(hasWeekday(mask, Weekday.TUESDAY)).toBe(false);
			expect(hasWeekday(mask, Weekday.FRIDAY)).toBe(false);
		});
	});

	describe('decodeWeekdays', () => {
		it('should return an empty array for mask 0', () => {
			const days = decodeWeekdays(0);
			expect(days).toEqual([]);
		});

		it('should decode a mask for a single weekday', () => {
			const days = decodeWeekdays(WeekdayBit.THURSDAY);
			expect(days).toEqual([Weekday.THURSDAY]);
		});

		it('should decode a mask for multiple weekdays', () => {
			const mask = WeekdayBit.MONDAY | WeekdayBit.WEDNESDAY | WeekdayBit.FRIDAY;

			const days = decodeWeekdays(mask);

			expect(days).toEqual([Weekday.MONDAY, Weekday.WEDNESDAY, Weekday.FRIDAY]);
		});

		it('should decode allWeekdaysMask as all weekdays', () => {
			const days = decodeWeekdays(allWeekdaysMask);

			expect(days).toEqual([
				Weekday.MONDAY,
				Weekday.TUESDAY,
				Weekday.WEDNESDAY,
				Weekday.THURSDAY,
				Weekday.FRIDAY,
				Weekday.SATURDAY,
				Weekday.SUNDAY,
			]);
		});
	});

	describe('weekdayFromJsDay', () => {
		it('should convert JS Sunday (0) to ISO Sunday (7)', () => {
			const day = weekdayFromJsDay(0);
			expect(day).toBe(Weekday.SUNDAY);
		});

		it('should convert JS Monday (1) to ISO Monday (1)', () => {
			const day = weekdayFromJsDay(1);
			expect(day).toBe(Weekday.MONDAY);
		});

		it('should convert JS Saturday (6) to ISO Saturday (6)', () => {
			const day = weekdayFromJsDay(6);
			expect(day).toBe(Weekday.SATURDAY);
		});

		it('should throw for invalid jsDay', () => {
			expect(() => weekdayFromJsDay(-1)).toThrow(RangeError);
			expect(() => weekdayFromJsDay(7)).toThrow(RangeError);
		});
	});

	describe('dateToWeekday', () => {
		it('should convert a Date (UTC) to the correct Weekday', () => {
			// Sunday 2025-01-05T00:00:00Z
			const sunday = new Date(Date.UTC(2025, 0, 5));
			expect(dateToWeekday(sunday)).toBe(Weekday.SUNDAY);

			// Monday 2025-01-06T00:00:00Z
			const monday = new Date(Date.UTC(2025, 0, 6));
			expect(dateToWeekday(monday)).toBe(Weekday.MONDAY);

			// Wednesday 2025-01-08T00:00:00Z
			const wednesday = new Date(Date.UTC(2025, 0, 8));
			expect(dateToWeekday(wednesday)).toBe(Weekday.WEDNESDAY);
		});
	});
});
