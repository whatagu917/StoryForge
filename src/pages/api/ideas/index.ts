import { NextApiRequest, NextApiResponse } from 'next';
import { getAuthHeader } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('Starting ideas endpoint...');
    console.log('Request method:', req.method);
    
    const authHeader = getAuthHeader(req);
    console.log('Auth header:', {
      exists: !!authHeader,
      userId: authHeader?.userId,
      authorization: authHeader?.Authorization ? 'present' : 'missing'
    });

    if (!authHeader) {
      console.log('No auth header found');
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const userId = authHeader.userId;
    console.log('User ID from auth header:', userId);

    if (!userId) {
      console.log('No user ID in auth header');
      return res.status(401).json({ success: false, message: 'ユーザーIDが見つかりません' });
    }

    if (req.method === 'GET') {
      try {
        console.log('Fetching ideas for user:', userId);
        const ideas = await prisma.idea.findMany({
          where: {
            userId,
          },
          orderBy: {
            createdAt: 'desc',
          },
        });
        console.log(`Found ${ideas.length} ideas`);
        return res.status(200).json({ success: true, data: ideas });
      } catch (error) {
        console.error('Database error when fetching ideas:', {
          error: error instanceof Error ? {
            message: error.message,
            name: error.name,
            stack: error.stack
          } : error
        });
        return res.status(500).json({ 
          success: false, 
          message: 'Internal server error',
          error: process.env.NODE_ENV === 'development' ? error : undefined
        });
      }
    }

    if (req.method === 'POST') {
      try {
        const { title, description, tags = [], aiGenerated = false } = req.body;
        console.log('Creating new idea:', { title, description, tags, aiGenerated });

        if (!title || !description) {
          console.log('Missing required fields');
          return res.status(400).json({ 
            success: false, 
            message: 'タイトルと説明は必須です' 
          });
        }

        const idea = await prisma.idea.create({
          data: {
            title,
            description,
            tags: tags || [],
            aiGenerated: aiGenerated || false,
            userId,
          },
        });
        console.log('Created idea:', idea.id);

        return res.status(201).json({ success: true, data: idea });
      } catch (error) {
        console.error('Failed to create idea:', {
          error: error instanceof Error ? {
            message: error.message,
            name: error.name,
            stack: error.stack
          } : error
        });
        return res.status(500).json({ 
          success: false, 
          message: 'アイデアの作成に失敗しました',
          error: process.env.NODE_ENV === 'development' ? error : undefined
        });
      }
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` });
  } catch (error) {
    console.error('Unexpected error in ideas endpoint:', {
      error: error instanceof Error ? {
        message: error.message,
        name: error.name,
        stack: error.stack
      } : error
    });
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
} 