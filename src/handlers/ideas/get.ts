import { NextApiResponse } from 'next';
import { AuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/api/logging';
import { APIError } from '@/lib/api/errors';

export async function getIdeas(userId: string, res: NextApiResponse) {
  log.info('Fetching ideas', { userId });

  try {
    const ideas = await prisma.idea.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });

    log.info(`Found ideas`, { userId, count: ideas.length });
    return res.status(200).json(ideas);
  } catch (error) {
    log.error('Failed to fetch ideas', { userId, error });
    throw new APIError(500, 'Failed to fetch ideas');
  }
} 