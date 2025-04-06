import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/api/logging';
import { APIError } from '@/lib/api/errors';

interface CreateIdeaData {
  title: string;
  description: string;
  tags?: string[];
  aiGenerated?: boolean;
}

export async function createIdea(userId: string, data: CreateIdeaData, res: NextApiResponse) {
  log.info('Creating new idea', { userId });

  const { title, description, tags = [], aiGenerated = false } = data;

  if (!title || !description) {
    log.warn('Missing required fields', { userId, title: !!title, description: !!description });
    throw new APIError(400, 'Title and description are required');
  }

  try {
    const idea = await prisma.idea.create({
      data: {
        title,
        description,
        tags,
        aiGenerated,
        userId,
      },
    });

    log.info('Created new idea', { userId, ideaId: idea.id });
    return res.status(201).json(idea);
  } catch (error) {
    log.error('Failed to create idea', { userId, error });
    throw new APIError(500, 'Failed to create idea');
  }
} 