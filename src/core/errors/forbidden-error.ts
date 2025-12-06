import { z } from 'zod';

const code = z
	.union([
		z.literal('FORBIDDEN_ERROR'),
		z.literal('SAME_EMAIL_ERROR'),
		z.literal('INSUFFICIENT_PERMISSION_ERROR'),
		z.literal('OLD_PASSWORD_NOT_MATCH_ERROR'),
	])
	.default('FORBIDDEN_ERROR');

type Code = z.infer<typeof code>;

export class ForbiddenError extends Error {
	readonly code: Code;

	constructor(message?: string, code?: Code) {
		super(message ?? 'Forbidden Error');
		this.code = code ?? 'FORBIDDEN_ERROR';
		this.name = 'ForbiddenError';

		// Corrige o prototype para manter a cadeia de herança correta
		Object.setPrototypeOf(this, ForbiddenError.prototype);
	}
}
