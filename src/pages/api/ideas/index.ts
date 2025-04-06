import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
  user: AuthUser
) {
  console.log('Ideas API called with method:', req.method);

  try {
    const userId = user.id;
    console.log('User ID from auth:', userId);

    if (req.method === 'GET') {
      console.log('Fetching ideas for user:', userId);
      try {
        const ideas = await prisma.idea.findMany({
          where: { userId: userId },
          orderBy: { updatedAt: 'desc' },
        });
        console.log(`Found ${ideas.length} ideas for user`);
        return res.status(200).json(ideas);
      } catch (dbError: any) {
        console.error('Database error when fetching ideas:', {
          error: dbError.message,
          stack: dbError.stack,
          code: dbError.code
        });
        return res.status(500).json({
          message: process.env.NODE_ENV === 'development'
            ? `Failed to fetch ideas: ${dbError.message}`
            : 'Failed to fetch ideas'
        });
      }
    }

    if (req.method === 'POST') {
      console.log('Creating new idea for user:', userId);
      const { title, description, tags = [], aiGenerated = false } = req.body;

      if (!title || !description) {
        console.log('Missing required fields:', { title: !!title, description: !!description });
        return res.status(400).json({ message: 'Title and description are required' });
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
        console.log('Created new idea:', idea.id);
        return res.status(201).json(idea);
      } catch (dbError: any) {
        console.error('Database error when creating idea:', {
          error: dbError.message,
          stack: dbError.stack,
          code: dbError.code
        });
        return res.status(500).json({
          message: process.env.NODE_ENV === 'development'
            ? `Failed to create idea: ${dbError.message}`
            : 'Failed to create idea'
        });
      }
    }

    console.log('Method not allowed:', req.method);
    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error: any) {
    console.error('Unexpected error in ideas API:', {
      error: error.message,
      stack: error.stack,
      name: error.name
    });
    return res.status(500).json({
      message: process.env.NODE_ENV === 'development'
        ? `Internal server error: ${error.message}`
        : 'Internal server error'
    });
  }
}

export default withAuth(handler); 