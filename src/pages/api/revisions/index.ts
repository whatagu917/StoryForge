import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
  user: AuthUser
) {
  console.log('Revisions API called with method:', req.method);

  try {
    const userId = user.id;
    console.log('User ID from auth:', userId);

    // ゲストユーザーの場合は空の配列を返す
    // 注意: ゲストユーザーの識別方法が変更されたため、このチェックは不要になりました
    // ゲストユーザーは通常のObjectId形式のIDを持つようになりました

    if (req.method === 'GET') {
      console.log('Fetching revisions for user:', userId);
      try {
        const revisions = await prisma.revision.findMany({
          where: { userId: userId },
          orderBy: { updatedAt: 'desc' },
        });
        console.log(`Found ${revisions.length} revisions for user`);
        return res.status(200).json({
          success: true,
          data: revisions
        });
      } catch (dbError: any) {
        console.error('Database error when fetching revisions:', {
          error: dbError.message,
          stack: dbError.stack,
          code: dbError.code
        });
        return res.status(500).json({
          message: process.env.NODE_ENV === 'development'
            ? `Failed to fetch revisions: ${dbError.message}`
            : 'Failed to fetch revisions'
        });
      }
    }

    if (req.method === 'POST') {
      console.log('Creating new revision for user:', userId);
      const { content, previousContent, chapterId, storyId, type, chapterTitle, chapterNumber } = req.body;

      if (!content || !previousContent || !chapterId || !storyId || !type || !chapterTitle || typeof chapterNumber !== 'number') {
        console.log('Missing required fields:', {
          content: !!content,
          previousContent: !!previousContent,
          chapterId: !!chapterId,
          storyId: !!storyId,
          type: !!type,
          chapterTitle: !!chapterTitle,
          chapterNumber: typeof chapterNumber === 'number'
        });
        return res.status(400).json({ message: 'All fields are required' });
      }

      try {
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
        console.log('Created new revision:', revision.id);
        return res.status(201).json(revision);
      } catch (dbError: any) {
        console.error('Database error when creating revision:', {
          error: dbError.message,
          stack: dbError.stack,
          code: dbError.code
        });
        return res.status(500).json({
          message: process.env.NODE_ENV === 'development'
            ? `Failed to create revision: ${dbError.message}`
            : 'Failed to create revision'
        });
      }
    }

    if (req.method === 'DELETE') {
      console.log('Deleting revisions for user:', userId);
      try {
        // リクエストボディからrevisionIdsを取得
        const { revisionIds } = req.body;
        
        if (revisionIds && Array.isArray(revisionIds)) {
          // 特定のリビジョンを削除
          await prisma.revision.deleteMany({
            where: {
              id: { in: revisionIds },
              userId: userId,
            },
          });
        } else {
          // すべてのリビジョンを削除
          await prisma.revision.deleteMany({
            where: {
              userId: userId,
            },
          });
        }
        
        return res.status(200).json({
          success: true,
          message: 'Revisions deleted successfully'
        });
      } catch (dbError: any) {
        console.error('Database error when deleting revisions:', {
          error: dbError.message,
          stack: dbError.stack,
          code: dbError.code
        });
        return res.status(500).json({
          success: false,
          message: process.env.NODE_ENV === 'development'
            ? `Failed to delete revisions: ${dbError.message}`
            : 'Failed to delete revisions'
        });
      }
    }

    console.log('Method not allowed:', req.method);
    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error: any) {
    console.error('Revisions API error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return res.status(500).json({
      message: process.env.NODE_ENV === 'development'
        ? `Revisions API error: ${error.message}`
        : 'Internal server error'
    });
  }
}

export default withAuth(handler); 