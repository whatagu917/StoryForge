import { NextApiRequest, NextApiResponse } from 'next';
import { getAuthHeader } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authHeader = getAuthHeader(req);
  if (!authHeader) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const userId = authHeader.userId;

  if (req.method === 'GET') {
    try {
      const styles = await prisma.styleProfile.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      const processedStyles = styles.map(style => {
        const settings = style.settings as any;
        if (settings.embedding && typeof settings.embedding === 'string') {
          try {
            settings.embedding = JSON.parse(settings.embedding);
          } catch (e) {
            console.error('Failed to parse embedding:', e);
            settings.embedding = null;
          }
        }
        return style;
      });

      return res.status(200).json({ success: true, data: processedStyles });
    } catch (error) {
      console.error('Failed to fetch styles:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { name, description, settings } = req.body;

      if (!name || !description || !settings) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
      }

      const processedSettings = { ...settings };
      if (processedSettings.embedding && Array.isArray(processedSettings.embedding)) {
        processedSettings.embedding = JSON.stringify(processedSettings.embedding);
      }

      const style = await prisma.styleProfile.create({
        data: {
          name,
          description,
          settings: processedSettings,
          userId,
        },
      });

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

      return res.status(201).json({ success: true, data: responseStyle });
    } catch (error) {
      console.error('Failed to create style:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
} 