import { NextApiRequest, NextApiResponse } from 'next';
import { getAuthHeader } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { JsonValue } from '@prisma/client/runtime/library';
import dbConnect from '@/lib/dbConnect';
import Style from '@/models/Style';

interface StyleProfile {
  id: string;
  name: string;
  description: string;
  settings: JsonValue;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ProcessedStyleProfile extends Omit<StyleProfile, 'settings'> {
  settings: {
    embedding?: number[];
    sampleText?: string;
    strength?: number;
    [key: string]: any;
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('Connecting to database from styles endpoint...');
    await dbConnect();
    console.log('Database connected successfully in styles endpoint');

    const authHeader = getAuthHeader(req);
    if (!authHeader) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const userId = authHeader.userId;

    switch (req.method) {
      case 'GET':
        console.log('Fetching styles...');
        const styles = await Style.find({}).sort({ createdAt: -1 });
        console.log(`Found ${styles.length} styles`);
        return res.status(200).json({
          success: true,
          data: styles
        });

      case 'POST':
        console.log('Creating new style...');
        const { name, description, settings } = req.body;

        if (!name || !description || !settings) {
          return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        if (!userId) {
          return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const processedSettings = { ...settings };
        if (processedSettings.embedding && Array.isArray(processedSettings.embedding)) {
          processedSettings.embedding = JSON.stringify(processedSettings.embedding);
        }

        const style = await Style.create(req.body);
        console.log('Style created:', style._id);
        return res.status(201).json({
          success: true,
          data: style
        });

      default:
        return res.status(405).json({
          success: false,
          message: 'Method not allowed'
        });
    }
  } catch (error: any) {
    console.error('Styles endpoint error:', {
      method: req.method,
      message: error.message,
      code: error.code,
      name: error.name,
      stack: error.stack
    });

    return res.status(500).json({
      success: false,
      message: 'サーバーエラーが発生しました',
      error: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        code: error.code
      } : undefined
    });
  }
} 