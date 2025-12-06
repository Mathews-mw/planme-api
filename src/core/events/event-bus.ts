import { DomainEvent } from './domain-event';

export interface EventHandler<E extends DomainEvent> {
	handler(event: E): Promise<void>;
}

type HandlerMap = { [eventName: string]: EventHandler<DomainEvent>[] };

export class EventBus {
	private handlers: HandlerMap = {};

	public register<E extends DomainEvent>(eventClass: new (...args: any[]) => E, handler: EventHandler<E>) {
		const eventName = eventClass.name;

		this.handlers[eventName] = this.handlers[eventName] || [];
		this.handlers[eventName].push(handler as EventHandler<DomainEvent>);
	}

	public async publish(...events: Array<DomainEvent>): Promise<void> {
		for (const event of events) {
			const eventName = event.constructor.name;
			const handlers = this.handlers[eventName] || [];

			await Promise.all(handlers.map((h) => h.handler(event)));
		}
	}
}
