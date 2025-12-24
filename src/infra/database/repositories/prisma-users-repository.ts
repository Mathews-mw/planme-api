import { prisma } from '../prisma';
import { UserMapper } from '../mappers/user/user-mapper';
import { User } from '@/domains/planme/models/entities/user';
import {
	IFindUniqueParams,
	IUserRepository,
} from '@/domains/planme/application/features/users/repositories/user-repository';

export class PrismaUsersRepository implements IUserRepository {
	async create(user: User) {
		const data = UserMapper.toPrisma(user);

		await prisma.user.create({
			data,
		});
	}

	async update(user: User) {
		const data = UserMapper.toPrisma(user);

		await prisma.user.update({
			data,
			where: {
				id: data.id,
			},
		});
	}

	async delete(user: User): Promise<void> {
		await prisma.user.delete({
			where: {
				id: user.id.toString(),
			},
		});
	}

	async findById(id: string) {
		const user = await prisma.user.findUnique({
			where: {
				id,
			},
		});

		if (!user) {
			return null;
		}

		return UserMapper.toDomain(user);
	}

	async findByEmail(email: string) {
		const user = await prisma.user.findUnique({
			where: {
				email,
			},
		});

		if (!user) {
			return null;
		}

		return UserMapper.toDomain(user);
	}

	async findUnique({ id, email }: IFindUniqueParams) {
		const user = await prisma.user.findUnique({
			where: {
				id,
				email,
			},
		});

		if (!user) {
			return null;
		}

		return UserMapper.toDomain(user);
	}
}
