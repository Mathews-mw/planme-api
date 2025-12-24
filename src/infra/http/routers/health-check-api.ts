import { z } from 'zod';
import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';

export async function healthCheckApi(app: FastifyInstance) {
	app.withTypeProvider<ZodTypeProvider>().get(
		'/health/check',
		{
			schema: {
				response: {
					200: z.object({
						status: z.string(),
						message: z.string(),
						version: z.string().optional(),
					}),
				},
			},
		},
		async (_, reply) => {
			return reply.status(200).send({
				status: 'ACTIVE',
				message: 'The API is working!',
				version: process.env.npm_package_version,
			});
		}
	);
}
