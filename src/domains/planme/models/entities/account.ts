import z from 'zod';

import { Entity } from '@/core/entities/entity.js';
import { UniqueEntityId } from '@/core/entities/unique-entity-id.js';
import { Optional } from '@/core/types/optional.js';

export const accountProviderSchema = z.union([z.literal('CREDENTIALS'), z.literal('GOOGLE')]);

export type AccountProvider = z.infer<typeof accountProviderSchema>;

export interface IAccountProps {
	userId: UniqueEntityId;
	provider: AccountProvider;
	providerAccountId: string;
	createdAt: Date;
	updatedAt?: Date | null;
}

export class Account extends Entity<IAccountProps> {
	get userId() {
		return this.props.userId;
	}

	set userId(userId: UniqueEntityId) {
		this.props.userId = userId;
		this._touch();
	}

	get provider() {
		return this.props.provider;
	}

	set provider(provider: AccountProvider) {
		this.props.provider = provider;
		this._touch();
	}

	get providerAccountId() {
		return this.props.providerAccountId;
	}

	set providerAccountId(providerAccountId: string) {
		this.props.providerAccountId = providerAccountId;
		this._touch();
	}

	get createdAt() {
		return this.props.createdAt;
	}

	get updatedAt() {
		return this.props.updatedAt;
	}

	private _touch() {
		this.props.updatedAt = new Date();
	}

	static create(props: Optional<IAccountProps, 'createdAt'>, id?: UniqueEntityId) {
		const account = new Account(
			{
				...props,
				createdAt: props.createdAt ?? new Date(),
			},
			id
		);

		return account;
	}
}
