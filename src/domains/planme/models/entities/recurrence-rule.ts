import { Entity } from '@/core/entities/entity';
import { UniqueEntityId } from '@/core/entities/unique-entity-id';
import { Optional } from '@/core/types/optional';
import z from 'zod';

export const recurrenceFrequencySchema = z.union([
	z.literal('NONE'),
	z.literal('DAILY_INTERVAL').describe('A cada X dias'),
	z.literal('WEEKLY_DAYS').describe('Em dias específicos da semana (seg, qua, sex...).'),
	z.literal('MONTHLY_DAY_OF_MONTH').describe('No dia X de cada mês (ex: dia 10).'),
	z.literal('MONTHLY_WEEKDAYS_OF_MONTH').describe('Ex: terceira quarta-feira do mês, última sexta etc.'),
	z.literal('YEARLY_INTERVAL').describe('A cada X anos.'),
]);

export const recurrenceEndTypeSchema = z.union([
	z.literal('ONCE'),
	z.literal('NEVER'),
	z.literal('ON_DATE').describe('Termina em uma data definida'),
	z.literal('AFTER_OCCURRENCES').describe('Termina após X ocorrências'),
]);

export type IRecurrenceFrequency = z.infer<typeof recurrenceFrequencySchema>;
export type IRecurrenceEndType = z.infer<typeof recurrenceEndTypeSchema>;

export interface IRecurrenceRuleProps {
	frequency: IRecurrenceFrequency;
	endType: IRecurrenceEndType;
	startDateTime: Date;
	endDate?: Date | null;
	interval?: number | null;
	weekdaysBitmask?: number | null; // bitmask
	dayOfMonth?: number | null;
	weekOfMonth?: number | null;
	weekdayOfMonth?: number | null; // 1..5 or -1(last);
	maxOccurrences?: number | null;
}

export class RecurrenceRule extends Entity<IRecurrenceRuleProps> {
	get frequency() {
		return this.props.frequency;
	}

	set frequency(frequency: IRecurrenceFrequency) {
		this.props.frequency = frequency;
	}

	get endType() {
		return this.props.endType;
	}

	set endType(endType: IRecurrenceEndType) {
		this.props.endType = endType;
	}

	get startDateTime() {
		return this.props.startDateTime;
	}

	set startDateTime(startDateTime: Date) {
		this.props.startDateTime = startDateTime;
	}

	get endDate() {
		return this.props.endDate;
	}

	set endDate(endDate: Date | undefined | null) {
		this.props.endDate = endDate;
	}

	get interval() {
		return this.props.interval;
	}

	set interval(interval: number | undefined | null) {
		this.props.interval = interval;
	}

	get weekdaysBitmask() {
		return this.props.weekdaysBitmask;
	}

	set weekdaysBitmask(weekdaysBitmask: number | undefined | null) {
		this.props.weekdaysBitmask = weekdaysBitmask;
	}

	get dayOfMonth() {
		return this.props.dayOfMonth;
	}

	set dayOfMonth(dayOfMonth: number | undefined | null) {
		this.props.dayOfMonth = dayOfMonth;
	}

	get weekOfMonth() {
		return this.props.weekOfMonth;
	}

	set weekOfMonth(weekOfMonth: number | undefined | null) {
		this.props.weekOfMonth = weekOfMonth;
	}

	get weekdayOfMonth() {
		return this.props.weekdayOfMonth;
	}

	set weekdayOfMonth(weekdayOfMonth: number | undefined | null) {
		this.props.weekdayOfMonth = weekdayOfMonth;
	}

	get maxOccurrences() {
		return this.props.maxOccurrences;
	}

	set maxOccurrences(maxOccurrences: number | undefined | null) {
		this.props.maxOccurrences = maxOccurrences;
	}

	static create(props: Optional<IRecurrenceRuleProps, 'endType'>, id?: UniqueEntityId) {
		const maxOccurrences = props.endType === 'ONCE' ? 1 : props.maxOccurrences;

		const recurrenceRule = new RecurrenceRule(
			{
				...props,
				endType: props.endType ?? 'ONCE',
				maxOccurrences: maxOccurrences,
			},
			id
		);

		return recurrenceRule;
	}
}
