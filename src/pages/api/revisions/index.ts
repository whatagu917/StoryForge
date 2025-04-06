import { NextApiRequest, NextApiResponse } from 'next';
import { getAuthHeader } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('Starting revisions endpoint...');
    console.log('Request method:', req.method);
    console.log('Request headers:', {
      authorization: req.headers.authorization ? 'present' : 'missing',
      contentType: req.headers['content-type']
    });

    const authHeader = getAuthHeader(req);
    console.log('Auth header:', {
      exists: !!authHeader,
      userId: authHeader?.userId,
      authorization: authHeader?.Authorization ? 'present' : 'missing'
    });

    if (!authHeader) {
      console.log('Authentication failed: No auth header');
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const userId = authHeader.userId;
    console.log('User ID from auth header:', userId);

    if (!userId) {
      console.log('Authentication failed: No user ID in auth header');
      return res.status(401).json({ success: false, message: 'User ID not found' });
    }

    if (req.method === 'GET') {
      try {
        console.log('Attempting to fetch revisions for user:', userId);
        const revisions = await prisma.revision.findMany({
          where: {
            userId,
          },
          orderBy: {
            createdAt: 'desc',
          },
        });
        console.log(`Successfully fetched ${revisions.length} revisions`);
        return res.status(200).json({ success: true, data: revisions || [] });
      } catch (error) {
        console.error('Database error when fetching revisions:', {
          error: error instanceof Error ? {
            message: error.message,
            name: error.name,
            stack: error.stack
          } : error,
          userId
        });
        return res.status(500).json({ success: false, message: 'Internal server error' });
      }
    }

    if (req.method === 'POST') {
      try {
        const { content, previousContent, chapterId, storyId, type, chapterTitle, chapterNumber } = req.body;
        console.log('Creating new revision:', {
          chapterId,
          storyId,
          type,
          chapterTitle,
          chapterNumber,
          userId,
          contentLength: content?.length,
          previousContentLength: previousContent?.length
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
        console.log('Successfully created revision:', revision.id);
        return res.status(201).json({ success: true, data: revision });
      } catch (error) {
        console.error('Database error when creating revision:', {
          error: error instanceof Error ? {
            message: error.message,
            name: error.name,
            stack: error.stack
          } : error,
          userId
        });
        return res.status(500).json({ 
          success: false, 
          message: 'Internal server error', 
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    }

    if (req.method === 'DELETE') {
      try {
        console.log('Attempting to delete all revisions for user:', userId);
        await prisma.revision.deleteMany({
          where: {
            userId,
          },
        });
        console.log('Successfully deleted all revisions for user:', userId);
        return res.status(200).json({ success: true });
      } catch (error) {
        console.error('Database error when deleting revisions:', {
          error: error instanceof Error ? {
            message: error.message,
            name: error.name,
            stack: error.stack
          } : error,
          userId
        });
        return res.status(500).json({ success: false, message: 'Internal server error' });
      }
    }

    console.log('Method not allowed:', req.method);
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (error) {
    console.error('Unexpected error in revisions endpoint:', {
      error: error instanceof Error ? {
        message: error.message,
        name: error.name,
        stack: error.stack
      } : error,
      method: req.method,
      hasAuthHeader: !!req.headers.authorization
    });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
} 