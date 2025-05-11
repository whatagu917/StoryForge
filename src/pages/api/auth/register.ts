import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { generateToken } from '@/lib/auth';
import { generateVerificationToken, sendVerificationEmail } from '@/lib/email';
import bcrypt from 'bcryptjs';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // メソッドの確認
  console.log('Request method:', req.method);
  
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // データベース接続
    console.log('Connecting to database...');
    await prisma.$connect();
    console.log('Database connected successfully');

    const { email, password, username } = req.body;
    console.log('Received registration data:', { email, username });

    // 入力値の検証
    if (!email || !password || !username) {
      console.log('Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'メールアドレス、パスワード、ユーザー名は必須です'
      });
    }

    // メールアドレスの重複チェック
    console.log('Checking for existing user...');
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    if (existingUser) {
      console.log('Email already exists:', email);
      return res.status(400).json({
        success: false,
        message: 'このメールアドレスは既に登録されています'
      });
    }

    // パスワードのハッシュ化
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 確認トークンの生成
    const verificationToken = generateVerificationToken();

    // ユーザーの作成
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        emailVerified: false,
        verificationToken,
      },
    });
    console.log('User created successfully:', user.id);

    // JWTトークンの生成
    const token = generateToken({
      id: user.id,
      email: user.email,
      username: user.username || '',
      emailVerified: user.emailVerified,
    });

    // 確認メールを送信
    await sendVerificationEmail(email, verificationToken);

    // レスポンスを返す
    const userResponse = {
      id: user.id,
      email: user.email,
      username: user.username,
    };

    console.log('Registration successful');
    return res.status(201).json({
      success: true,
      message: '登録が完了しました。確認メールをご確認ください。',
      user: userResponse,
      token,
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'ユーザー登録に失敗しました'
    });
  }
} 