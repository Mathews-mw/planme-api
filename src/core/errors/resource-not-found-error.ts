import z from 'zod';

const code = z
	.union([z.literal('RESOURCE_NOT_FOUND_ERROR'), z.literal('RESOURCE_NOT_FOUND_ERROR')])
	.default('RESOURCE_NOT_FOUND_ERROR');

type Code = z.infer<typeof code>;

export class ResourceNotFoundError extends Error {
	readonly code: Code;

	constructor(message?: string, code?: Code) {
		super(message ?? 'Resource not found');
		this.code = code ?? 'RESOURCE_NOT_FOUND_ERROR';
		this.name = 'ResourceNotFoundError';

		Object.setPrototypeOf(this, ResourceNotFoundError.prototype);
	}
}
