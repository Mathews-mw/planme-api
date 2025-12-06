import z from 'zod';

const code = z
	.union([
		z.literal('BAD_REQUEST_ERROR'),
		z.literal('SAME_EMAIL_ERROR'),
		z.literal('SAME_USERNAME_ERROR'),
		z.literal('ROOM_ALREADY_EXISTS'),
		z.literal('OLD_PASSWORD_NOT_MATCH_ERROR'),
	])
	.default('BAD_REQUEST_ERROR');

type Code = z.infer<typeof code>;

export class BadRequestError extends Error {
	readonly code: Code;

	constructor(message?: string, code?: Code) {
		super(message ?? 'Bad Request Error'); // Passa a mensagem para a classe Error
		this.code = code ?? 'BAD_REQUEST_ERROR';
		this.name = 'BadRequestError'; // Define o nome do erro corretamente

		// Corrige o prototype para manter a cadeia de herança correta
		Object.setPrototypeOf(this, BadRequestError.prototype);
	}
}
