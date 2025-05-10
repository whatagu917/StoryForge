import { NextApiRequest, NextApiResponse } from 'next';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/session';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const session = await getIronSession<SessionData>(req, res, sessionOptions);
    
    if (!session.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    return res.status(200).json({
      user: session.user,
      isGuest: session.user.isGuest || false,
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 