import { User } from '@/domains/planme/models/entities/user';
import { UserResponseSchema } from '../../schemas/user/user-schema';

export class UserPresenter {
	static toHTTP(data: User): UserResponseSchema {
		return {
			id: data.id.toString(),
			name: data.name,
			email: data.email,
			timezone: data.timezone,
			avatar_url: data.avatarUrl ?? null,
			is_active: data.isActive,
			created_at: data.createdAt,
		};
	}
}
