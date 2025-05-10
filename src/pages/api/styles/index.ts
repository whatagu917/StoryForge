import { NextApiRequest, NextApiResponse } from 'next';
import { getAuthHeader } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { JsonValue } from '@prisma/client/runtime/library';
import dbConnect from '@/lib/dbConnect';
import Style from '../../../models/Style';

interface StyleProfile {
  id: string;
  name: string;
  description: string;
  settings: JsonValue;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ProcessedStyleProfile extends Omit<StyleProfile, 'settings'> {
  settings: {
    embedding?: number[];
    sampleText?: string;
    strength?: number;
    [key: string]: any;
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authHeader = getAuthHeader(req);
  if (!authHeader) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const userId = authHeader.userId;

  if (req.method === 'GET') {
    try {
      const styles = await prisma.styleProfile.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      return res.status(200).json({ success: true, data: styles });
    } catch (error) {
      console.error('Failed to fetch styles:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { name, description, settings } = req.body;

      if (!name || !description || !settings) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
      }

      if (!userId) {
        return res.status(400).json({ success: false, message: 'User ID is required' });
      }

      const style = await prisma.styleProfile.create({
        data: {
          name: String(name),
          description: String(description),
          settings: settings,
          userId: String(userId)
        },
      });

      return res.status(201).json({ success: true, data: style });
    } catch (error) {
      console.error('Failed to create style:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
} 