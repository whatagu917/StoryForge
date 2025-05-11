import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { generateToken } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '許可されていないメソッドです' });
  }

  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: 'リフレッシュトークンが提供されていません' });
    }

    // DBからリフレッシュトークンを検索
    const tokenRecord = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!tokenRecord || tokenRecord.expires < new Date()) {
      return res.status(401).json({ message: '無効または期限切れのリフレッシュトークンです' });
    }

    // ユーザーを取得
    const user = await prisma.user.findUnique({ where: { id: tokenRecord.userId } });
    if (!user) {
      return res.status(401).json({ message: 'ユーザーが見つかりません' });
    }

    // 新しいアクセストークンを発行
    const newAccessToken = generateToken({
      id: user.id,
      email: user.email,
      username: user.username || '',
      emailVerified: user.emailVerified,
    });

    return res.status(200).json({ accessToken: newAccessToken });
  } catch (error: any) {
    console.error('リフレッシュトークンエラー:', error);
    return res.status(500).json({ message: error.message || 'サーバーエラーが発生しました' });
  }
} 