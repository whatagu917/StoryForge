import { NextApiRequest, NextApiResponse } from 'next';
import { getAuthHeader } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authHeader = getAuthHeader(req);
  if (!authHeader) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const userId = authHeader.userId;
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ success: false, message: 'Invalid ID' });
  }

  if (req.method === 'GET') {
    try {
      const style = await prisma.styleProfile.findUnique({
        where: { id, userId },
      });

      if (!style) {
        return res.status(404).json({ success: false, message: 'Style not found' });
      }

      // embeddingを配列として正しく処理
      const responseStyle = { ...style };
      const settings = responseStyle.settings as any;
      if (settings.embedding && typeof settings.embedding === 'string') {
        try {
          settings.embedding = JSON.parse(settings.embedding);
        } catch (e) {
          console.error('Failed to parse embedding:', e);
          settings.embedding = null;
        }
      }

      return res.status(200).json({ success: true, data: responseStyle });
    } catch (error) {
      console.error('Failed to fetch style:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { name, description, settings } = req.body;

      if (!name || !description || !settings) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
      }

      // embeddingが配列の場合は文字列に変換して保存
      const processedSettings = { ...settings };
      if (processedSettings.embedding && Array.isArray(processedSettings.embedding)) {
        processedSettings.embedding = JSON.stringify(processedSettings.embedding);
      }

      const style = await prisma.styleProfile.update({
        where: { id, userId },
        data: {
          name,
          description,
          settings: processedSettings,
        },
      });

      // レスポンスではembeddingを配列として返す
      const responseStyle = { ...style };
      const responseSettings = responseStyle.settings as any;
      if (responseSettings.embedding && typeof responseSettings.embedding === 'string') {
        try {
          responseSettings.embedding = JSON.parse(responseSettings.embedding);
        } catch (e) {
          console.error('Failed to parse embedding in response:', e);
          responseSettings.embedding = null;
        }
      }

      return res.status(200).json({ success: true, data: responseStyle });
    } catch (error) {
      console.error('Failed to update style:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await prisma.styleProfile.delete({
        where: { id, userId },
      });

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Failed to delete style:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
} 