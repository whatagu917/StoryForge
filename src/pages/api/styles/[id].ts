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
      const { name, description, settings } = req.body;

      const style = await prisma.styleProfile.update({
        where: {
          id: id as string,
          userId,
        },
        data: {
          name,
          description,
          settings,
        },
      });

      return res.status(200).json({ success: true, data: style });
    } catch (error) {
      console.error('Failed to update style:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await prisma.styleProfile.delete({
        where: {
          id: id as string,
          userId,
        },
      });

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Failed to delete style:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
} 