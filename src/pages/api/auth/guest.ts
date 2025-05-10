import { NextApiRequest, NextApiResponse } from 'next';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/session';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const session = await getIronSession<SessionData>(req, res, sessionOptions);

    // Check if user is already logged in
    if (session.user) {
      return res.status(400).json({ 
        message: 'Already authenticated',
        user: session.user
      });
    }

    const guestUser = {
      id: 'guest-' + Date.now(),
      email: 'guest@example.com',
      name: 'ゲストユーザー',
      isGuest: true
    };

    // Save guest user info to session
    session.user = guestUser;
    await session.save();

    return res.status(200).json({
      user: guestUser,
      isGuest: true,
    });
  } catch (error) {
    console.error('Guest login error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 