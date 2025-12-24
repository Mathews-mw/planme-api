import z from 'zod';
import { FastifyInstance } from 'fastify/types/instance';
import { hasZodFastifySchemaValidationErrors } from 'fastify-type-provider-zod';

import { ForbiddenError } from '@/core/errors/forbidden-error';
import { BadRequestError } from '@/core/errors/bad-request-errors';
import { UnauthorizedError } from '@/core/errors/unauthorized-error';
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error';

type FastifyErrorHandler = FastifyInstance['errorHandler'];

export const errorHandler: FastifyErrorHandler = async (error, request, reply) => {
	if (error instanceof z.ZodError) {
		return reply.status(400).send({
			message: 'Validation error',
			errors: z.treeifyError(error),
		});
	}

	if (hasZodFastifySchemaValidationErrors(error)) {
		const errorsPayload = error.validation.map((err) => {
			return {
				instancePath: err.instancePath,
				message: err.message,
				// params: err.params,
			};
		});

		return reply.status(400).send({
			message: 'Validation Error',
			errors: errorsPayload,
		});
	}

	if (error instanceof BadRequestError) {
		return reply.status(400).send({
			code: error.code,
			message: error.message,
		});
	}

	if (error instanceof UnauthorizedError) {
		return reply.status(401).send({
			code: error.code,
			message: error.message,
		});
	}

	if (error instanceof ForbiddenError) {
		return reply.status(403).send({
			code: error.code,
			message: error.message,
		});
	}

	if (error instanceof ResourceNotFoundError) {
		return reply.status(404).send({
			code: error.code,
			message: error.message,
		});
	}

	// if (error instanceof HTTPError) {
	// 	if (error.response.url.includes('googleapis')) {
	// 		const errorJson = await error.response.json<{ error: string; error_description: string }>();

	// 		return reply.status(error.response.status).send({
	// 			code: errorJson.error,
	// 			provider: 'GOOGLE',
	// 			message: errorJson.error_description,
	// 		});
	// 	}

	// 	return reply.status(error.response.status).send({
	// 		code: error.response.statusText,
	// 		message: `HTTP Request Error: ${error.message}`,
	// 	});
	// }

	console.error('Unexpected error: ', error);

	return reply.status(500).send({ message: 'Internal server error' });
};
