export const DEPENDENCY_IDENTIFIERS = {
	ACCOUNTS_REPOSITORY: 'AccountsRepository',
	SESSIONS_REPOSITORY: 'SessionsRepository',
	USERS_REPOSITORY: 'UsersRepository',
} as const;

export type DependencyIdentifiers = (typeof DEPENDENCY_IDENTIFIERS)[keyof typeof DEPENDENCY_IDENTIFIERS];
