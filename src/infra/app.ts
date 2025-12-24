import 'reflect-metadata';
import '@/shared/di/containers/index';

import path from 'node:path';
import fastify from 'fastify';
import { cwd } from 'node:process';
import fastifyJwt from '@fastify/jwt';
import { readFileSync } from 'node:fs';
import fastifyCors from '@fastify/cors';
import fastifyCookie from '@fastify/cookie';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { jsonSchemaTransform, serializerCompiler, validatorCompiler, ZodTypeProvider } from 'fastify-type-provider-zod';

import { env } from '@/env';
import { routes } from './http/routers';
import { errorHandler } from './error-handler';

export const app = fastify().withTypeProvider<ZodTypeProvider>();

app.register(fastifyCookie);

app.setSerializerCompiler(serializerCompiler);
app.setValidatorCompiler(validatorCompiler);

app.register(fastifySwagger, {
	openapi: {
		info: {
			title: 'Firefly Chat API',
			description: 'An API from Firefly Chat Services',
			version: `${process.env.npm_package_version}`,
		},
		components: {
			securitySchemes: {
				bearerAuth: {
					type: 'http',
					scheme: 'bearer',
					bearerFormat: 'JWT',
				},
			},
		},
	},
	transform: jsonSchemaTransform,
});

app.setErrorHandler(errorHandler);

app.register(fastifySwaggerUi, {
	routePrefix: '/api/docs',
});

app.register(fastifyJwt, {
	secret: {
		private: readFileSync(path.resolve(cwd(), 'jwtRS256.key'), 'utf8'),
		public: readFileSync(path.resolve(cwd(), 'jwtRS256.key.pub'), 'utf8'),
	},
	cookie: {
		cookieName: env.JWT_COOKIE_NAME,
		signed: false,
	},
	sign: {
		expiresIn: '1d',
		algorithm: 'RS256',
	},
});

app.register(fastifyCors, {
	origin: ['http://localhost:3000'],
	credentials: true,
	methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
});

// Debug only
app.addHook('onRequest', (request, reply, done) => {
	console.log(`[Method: ${request.method}] - [Protocol: ${request.protocol}] - [Url: ${request.url}]`);
	done();
});

app.register(routes, { prefix: '/api' });
