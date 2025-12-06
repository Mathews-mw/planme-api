import z from 'zod';

const code = z
	.union([
		z.literal('UNAUTHORIZED_ERROR'),
		z.literal('AUTH_EXPIRED_TOKEN_ERROR'),
		z.literal('AUTH_INVALID_TOKEN_ERROR'),
		z.literal('AUTH_NO_AUTHORIZATION_IN_COOKIE_ERROR'),
		z.literal('CREDENTIALS_TYPE_ERROR'),
		z.literal('AUTH_INVALID_CREDENTIALS_ERROR'),
	])
	.default('UNAUTHORIZED_ERROR');

type Code = z.infer<typeof code>;

export class UnauthorizedError extends Error {
	readonly code: Code;

	constructor(message?: string, code?: Code) {
		super(message ?? 'Unauthorized');
		this.code = code ?? 'UNAUTHORIZED_ERROR';

		this.name = 'UnauthorizedError';

		Object.setPrototypeOf(this, UnauthorizedError.prototype);
	}
}
