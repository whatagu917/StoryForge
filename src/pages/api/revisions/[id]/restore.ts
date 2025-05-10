import { NextApiRequest, NextApiResponse } from 'next';
import { getAuthHeader } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const authHeader = getAuthHeader(req);
  if (!authHeader) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const userId = authHeader.userId;
  
  // ゲストユーザーの場合はエラーを返す
  // 注意: ゲストユーザーの識別方法が変更されたため、このチェックは不要になりました
  // ゲストユーザーは通常のObjectId形式のIDを持つようになりました

  const { id } = req.query;

  try {
    // Get the revision
    const revision = await prisma.revision.findFirst({
      where: {
        id: id as string,
        userId,
      },
    });

    if (!revision) {
      return res.status(404).json({ success: false, message: 'Revision not found' });
    }

    // Update the chapter content
    await prisma.chapter.update({
      where: {
        id: revision.chapterId,
      },
      data: {
        content: revision.content,
      },
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Failed to restore revision:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
} 