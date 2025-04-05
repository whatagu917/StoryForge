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
      const ideas = await prisma.idea.findMany({
        where: {
          userId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return res.status(200).json({ success: true, data: ideas });
    } catch (error) {
      console.error('Failed to fetch ideas:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { title, description, tags, aiGenerated } = req.body;

      const idea = await prisma.idea.create({
        data: {
          title,
          description,
          tags,
          aiGenerated,
          userId,
        },
      });

      return res.status(201).json({ success: true, data: idea });
    } catch (error) {
      console.error('Failed to create idea:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
} 