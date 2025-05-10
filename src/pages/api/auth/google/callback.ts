import { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { code, error } = req.query;

  if (error) {
    console.error('OAuth error:', error);
    return res.status(400).json({ message: `OAuth error: ${error}` });
  }

  if (!code) {
    console.error('Authorization code is missing');
    return res.status(400).json({ message: 'Authorization code is required' });
  }

  try {
    console.log('Getting tokens with code:', code);
    const { tokens } = await oauth2Client.getToken(code as string);
    console.log('Tokens received:', tokens);

    if (!tokens.refresh_token) {
      console.error('No refresh token received');
      return res.status(400).json({ message: 'No refresh token received. Please try again.' });
    }

    oauth2Client.setCredentials(tokens);

    // リフレッシュトークンを表示
    res.status(200).json({
      message: 'Successfully authenticated',
      refreshToken: tokens.refresh_token
    });
  } catch (error) {
    console.error('Error getting tokens:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 