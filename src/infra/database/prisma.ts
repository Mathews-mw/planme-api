import { env } from '@/env';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/generated/prisma/client';

const connectionString = `${env.DATABASE_URL}`;

const adapter = new PrismaPg({ connectionString }, { schema: 'planme' });
const prisma = new PrismaClient({ adapter, log: ['warn', 'error'] });

export { prisma };
