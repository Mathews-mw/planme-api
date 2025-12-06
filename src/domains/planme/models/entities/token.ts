import z from 'zod';

import { Entity } from '@/core/entities/entity';
import { Optional } from '@/core/types/optional';
import { UniqueEntityId } from '@/core/entities/unique-entity-id';

export const tokenTypeSchema = z.union([z.literal('PASSWORD_RECOVER'), z.literal('PASSWORD_RESET')]);

export type TokenType = z.infer<typeof tokenTypeSchema>;

export interface ITokenProps {
	userId: UniqueEntityId;
	type: TokenType;
	createdAt: Date;
}

export class Token extends Entity<ITokenProps> {
	get userId() {
		return this.props.userId;
	}

	set userId(userId: UniqueEntityId) {
		this.props.userId = userId;
	}

	get type() {
		return this.props.type;
	}

	set type(type: TokenType) {
		this.props.type = type;
	}

	get createdAt() {
		return this.props.createdAt;
	}

	static create(props: Optional<ITokenProps, 'createdAt'>, id?: UniqueEntityId) {
		const token = new Token(
			{
				...props,
				createdAt: props.createdAt ?? new Date(),
			},
			id
		);

		return token;
	}
}
