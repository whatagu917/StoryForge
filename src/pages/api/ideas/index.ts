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
      const { title, description, tags = [], aiGenerated = false } = req.body;

      // Validate required fields
      if (!title || !description) {
        return res.status(400).json({ 
          success: false, 
          message: 'タイトルと説明は必須です' 
        });
      }

      // Use userId from auth header instead of request body
      const idea = await prisma.idea.create({
        data: {
          title,
          description,
          tags: tags || [],
          aiGenerated: aiGenerated || false,
          userId,
        },
      });

      return res.status(201).json({ success: true, data: idea });
    } catch (error) {
      console.error('Failed to create idea:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'アイデアの作成に失敗しました',
        error: error instanceof Error ? error.message : '不明なエラー'
      });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` });
} 