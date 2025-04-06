import { NextApiRequest, NextApiResponse } from 'next';
import { getAuthHeader } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 認証ヘッダーを取得
  const authHeader = getAuthHeader(req);
  if (!authHeader) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    // ユーザーIDを取得
    const userId = authHeader.userId;
    if (!userId) {
      return res.status(401).json({ message: 'User ID not found' });
    }

    // GET: チャット履歴を取得
    if (req.method === 'GET') {
      const history = await prisma.chatHistory.findMany({
        where: {
          userId: userId,
        },
        orderBy: {
          timestamp: 'desc',
        },
        take: 50, // 最新50件まで取得
      });

      return res.status(200).json({
        success: true,
        history: history,
      });
    }

    // DELETE: チャット履歴をクリア
    if (req.method === 'DELETE') {
      await prisma.chatHistory.deleteMany({
        where: {
          userId: userId,
        },
      });

      return res.status(200).json({
        success: true,
        message: 'Chat history cleared successfully',
      });
    }

    // POST: 新しいチャットメッセージを保存
    if (req.method === 'POST') {
      const { role, content } = req.body;

      if (!role || !content) {
        return res.status(400).json({
          success: false,
          message: 'Role and content are required',
        });
      }

      const message = await prisma.chatHistory.create({
        data: {
          userId: userId,
          role,
          content,
          timestamp: new Date(),
        },
      });

      return res.status(201).json({
        success: true,
        message: message,
      });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Chat history error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
} 