import { User } from '@/domains/planme/models/entities/user';
import { User as PrismaUser } from '@/generated/prisma/client';
import { UniqueEntityId } from '@/core/entities/unique-entity-id';

export class UserMapper {
	static toDomain(data: PrismaUser): User {
		return User.create(
			{
				name: data.name,
				email: data.email,
				password: data.password,
				timezone: data.timezone,
				avatarUrl: data.avatarUrl,
				isActive: data.isActive,
				createdAt: data.createdAt,
				updatedAt: data.updatedAt,
			},
			new UniqueEntityId(data.id)
		);
	}

	static toPrisma(data: User): PrismaUser {
		return {
			id: data.id.toString(),
			name: data.name,
			email: data.email,
			password: data.password ?? null,
			timezone: data.timezone,
			avatarUrl: data.avatarUrl ?? null,
			isActive: data.isActive,
			createdAt: data.createdAt,
			updatedAt: data.updatedAt ?? null,
		};
	}
}
