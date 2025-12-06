import { Entity } from '@/core/entities/entity';
import { Optional } from '@/core/types/optional';
import { UniqueEntityId } from '@/core/entities/unique-entity-id';

export interface IUserProps {
	name: string;
	email: string;
	password?: string | null;
	avatarUrl?: string | null;
	timezone: string;
	isActive: boolean;
	createdAt: Date;
	updatedAt?: Date | null;
}

export class User extends Entity<IUserProps> {
	get name() {
		return this.props.name;
	}

	set name(name: string) {
		this.props.name = name;
		this._touch();
	}

	get email() {
		return this.props.email;
	}

	set email(email: string) {
		this.props.email = email;
		this._touch();
	}

	get password() {
		return this.props.password;
	}

	set password(password: string | null | undefined) {
		this.props.password = password;
		this._touch();
	}

	get avatarUrl() {
		return this.props.avatarUrl;
	}

	set avatarUrl(avatarUrl: string | undefined | null) {
		this.props.avatarUrl = avatarUrl;
		this._touch();
	}

	get timezone() {
		return this.props.timezone;
	}

	set timezone(timezone: string) {
		this.props.timezone = timezone;
		this._touch();
	}

	get isActive() {
		return this.props.isActive;
	}

	set isActive(isActive: boolean) {
		this.props.isActive = isActive;
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

	static create(props: Optional<IUserProps, 'timezone' | 'isActive' | 'createdAt' | 'updatedAt'>, id?: UniqueEntityId) {
		const user = new User(
			{
				...props,
				timezone: props.timezone ?? 'America/Sao_Paulo',
				isActive: props.isActive ?? true,
				createdAt: props.createdAt ?? new Date(),
			},
			id
		);

		return user;
	}
}
