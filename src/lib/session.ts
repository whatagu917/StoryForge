import { IronSessionData } from 'iron-session';

export interface SessionData extends IronSessionData {
  user?: {
    id: string;
    email: string;
    name: string;
    isGuest?: boolean;
  };
  isGuest?: boolean;
}

export const sessionOptions = {
  password: process.env.SECRET_COOKIE_PASSWORD as string,
  cookieName: 'storyforge-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
  },
};

// This is where we specify the typings of req.session.*
declare module 'iron-session' {
  interface IronSessionData {
    user?: {
      id: string;
      email: string;
      name: string;
      isGuest?: boolean;
    };
  }
} 