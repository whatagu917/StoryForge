import { NextApiRequest, NextApiResponse } from 'next';
import { getAuthHeader } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authHeader = getAuthHeader(req);
  if (!authHeader) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const userId = authHeader.userId;
  const { id } = req.query;

  if (req.method === 'PUT') {
    try {
      const { title, description, tags } = req.body;

      const idea = await prisma.idea.update({
        where: {
          id: id as string,
          userId,
        },
        data: {
          title,
          description,
          tags,
        },
      });

      return res.status(200).json({ success: true, data: idea });
    } catch (error) {
      console.error('Failed to update idea:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await prisma.idea.delete({
        where: {
          id: id as string,
          userId,
        },
      });

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Failed to delete idea:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
} 