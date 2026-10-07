import { prisma } from '../lib/prisma';

export const usageLogRepository = {
  async create(data: {
    userId: string;
    action: string;
    tokens: number;
    costUsd: number;
    metadata?: string;
  }) {
    return prisma.usageLog.create({ data });
  },
};
