import { NextApiRequest, NextApiResponse } from 'next';
import { AuthUser } from '@/lib/auth';
import { log } from '@/lib/api/logging';
import { handleError } from '@/lib/api/errors';
import { sendMethodNotAllowed } from '@/lib/api/responses';
import { getIdeas } from './get';
import { createIdea } from './create';

export async function ideasHandler(
  req: NextApiRequest,
  res: NextApiResponse,
  user: AuthUser
) {
  log.info('Ideas API called', { 
    userId: user.id,
    method: req.method,
    path: req.url
  });

  try {
    switch (req.method) {
      case 'GET':
        return await getIdeas(user.id, res);
      case 'POST':
        return await createIdea(user.id, req.body, res);
      default:
        return sendMethodNotAllowed(res);
    }
  } catch (error) {
    return handleError(res, error);
  }
} 