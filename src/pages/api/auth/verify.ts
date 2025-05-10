import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { token } = req.query;

  if (!token || typeof token !== 'string') {
    return res.status(400).json({ success: false, message: 'Invalid token' });
  }

  try {
    // トークンに一致するユーザーを検索
    const user = await prisma.user.findFirst({
      where: {
        verificationToken: token,
      },
    });

    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: '無効なトークンまたは期限切れのトークンです' 
      });
    }

    // ユーザーのメール確認状態を更新
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationToken: null,
        verificationExpires: null,
      },
    });

    // 成功レスポンスを返す
    return res.status(200).json({ 
      success: true, 
      message: 'メールアドレスの確認が完了しました' 
    });
  } catch (error) {
    console.error('Verification error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'メール確認中にエラーが発生しました' 
    });
  }
} 