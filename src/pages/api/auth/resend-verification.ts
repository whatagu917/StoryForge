import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { generateVerificationToken, sendVerificationEmail } from '@/lib/email';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'メールアドレスは必須です'
      });
    }

    // ユーザーの検索
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'ユーザーが見つかりません'
      });
    }

    // 新しい確認トークンの生成
    const verificationToken = generateVerificationToken();

    // ユーザー情報の更新
    await prisma.user.update({
      where: { email },
      data: {
        verificationToken,
      },
    });

    // 確認メールの送信
    await sendVerificationEmail(email, verificationToken);

    return res.status(200).json({
      success: true,
      message: '確認メールを再送信しました'
    });
  } catch (error: any) {
    console.error('Resend verification email error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || '確認メールの再送信に失敗しました'
    });
  }
} 