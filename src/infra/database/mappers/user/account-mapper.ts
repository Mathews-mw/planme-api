import { UniqueEntityId } from '@/core/entities/unique-entity-id';
import { Account } from '@/domains/planme/models/entities/account';
import { Account as PrismaAccount } from '@/generated/prisma/client';

export class AccountMapper {
	static toDomain(data: PrismaAccount): Account {
		return Account.create(
			{
				userId: new UniqueEntityId(data.userId),
				provider: data.provider,
				providerAccountId: data.providerAccountId,
				createdAt: data.createdAt,
				updatedAt: data.updatedAt,
			},
			new UniqueEntityId(data.id)
		);
	}

	static toPrisma(data: Account): PrismaAccount {
		return {
			id: data.id.toString(),
			userId: data.userId.toString(),
			provider: data.provider,
			providerAccountId: data.providerAccountId,
			createdAt: data.createdAt,
			updatedAt: data.updatedAt ?? null,
		};
	}
}
