import { FastifyInstance } from 'fastify';

import { authRoutes } from './auth-routes';
import { usersRoutes } from './users-routes';
import { healthCheckApi } from './health-check-api';

export async function routes(app: FastifyInstance) {
	app.register(healthCheckApi, { prefix: '/' });

	app.register(authRoutes, { prefix: '/auth' });

	app.register(usersRoutes, { prefix: '/users' });
}
