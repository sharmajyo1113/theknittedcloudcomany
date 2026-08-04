'use strict';

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

// Prisma 7 requires an explicit driver adapter — plain `new PrismaClient()`
// relying on DATABASE_URL alone no longer works.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

module.exports = { prisma };
