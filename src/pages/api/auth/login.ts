import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { generateToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { Types } from 'mongoose';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;
    console.log('Login attempt for email:', email);

    // 入力値の検証
    if (!email || !password) {
      console.error('Missing required fields:', { email: !!email, password: !!password });
      return res.status(400).json({
        message: 'メールアドレスとパスワードは必須です'
      });
    }

    // ユーザーの検索
    console.log('Searching for user...');
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      console.log('User not found for email:', email);
      return res.status(401).json({
        message: 'メールアドレスまたはパスワードが正しくありません'
      });
    }
    console.log('User found:', { id: user.id, email: user.email });

    // メール確認のチェック
    if (!user.emailVerified) {
      console.log('Email not verified for user:', user.id);
      return res.status(403).json({
        message: 'メールアドレスの確認が完了していません。確認メールをご確認ください。',
        needsVerification: true
      });
    }

    // パスワードの検証
    console.log('Verifying password...');
    try {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        console.log('Password verification failed for user:', user.id);
        return res.status(401).json({
          message: 'メールアドレスまたはパスワードが正しくありません'
        });
      }
      console.log('Password verification successful');
    } catch (passwordError) {
      console.error('Password comparison error:', passwordError);
      throw passwordError;
    }

    // JWTトークンの生成
    console.log('Generating JWT token...');
    let token;
    try {
      const tokenPayload = {
        id: user.id,
        email: user.email,
        username: user.username || '',
        emailVerified: user.emailVerified
      };
      console.log('Token payload:', tokenPayload);
      token = generateToken(tokenPayload);
      console.log('Token generated successfully:', token.substring(0, 20) + '...');
    } catch (tokenError) {
      console.error('Token generation error:', tokenError);
      throw tokenError;
    }

    // レスポンスを返す
    const userResponse = {
      id: user.id,
      email: user.email,
      username: user.username,
      emailVerified: user.emailVerified,
    };

    console.log('Login successful for user:', userResponse.id);
    res.status(200).json({
      message: 'ログインに成功しました',
      user: userResponse,
      token,
    });
  } catch (error: any) {
    console.error('Login error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({
      message: process.env.NODE_ENV === 'development' 
        ? `ログインに失敗しました: ${error.message}`
        : 'ログインに失敗しました'
    });
  }
} 