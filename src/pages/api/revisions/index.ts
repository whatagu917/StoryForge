import { NextApiRequest, NextApiResponse } from 'next';
import { getAuthHeader } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authHeader = getAuthHeader(req);
  if (!authHeader) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const userId = authHeader.userId;

  if (req.method === 'GET') {
    try {
      const revisions = await prisma.revision.findMany({
        where: {
          userId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return res.status(200).json({ success: true, data: revisions || [] });
    } catch (error) {
      console.error('Failed to fetch revisions:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { content, previousContent, chapterId, storyId, type, chapterTitle, chapterNumber } = req.body;

      if (!userId) {
        return res.status(401).json({ success: false, message: 'User ID not found' });
      }

      console.log('Creating revision with data:', {
        content,
        previousContent,
        chapterId,
        storyId,
        type,
        chapterTitle,
        chapterNumber,
        userId,
      });

      const revision = await prisma.revision.create({
        data: {
          content,
          previousContent,
          chapterId,
          storyId,
          type,
          chapterTitle,
          chapterNumber,
          userId,
        },
      });

      return res.status(201).json({ success: true, data: revision });
    } catch (error) {
      console.error('Failed to create revision:', error);
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      return res.status(500).json({ success: false, message: 'Internal server error', error: error instanceof Error ? error.message : String(error) });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await prisma.revision.deleteMany({
        where: {
          userId,
        },
      });

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Failed to delete revisions:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
} 