import { NextApiResponse } from 'next';

export function sendSuccess<T>(res: NextApiResponse, data: T, statusCode = 200) {
  return res.status(statusCode).json(data);
}

export function sendError(res: NextApiResponse, message: string, statusCode = 400) {
  return res.status(statusCode).json({ message });
}

export function sendMethodNotAllowed(res: NextApiResponse) {
  return sendError(res, 'Method not allowed', 405);
}

export function sendUnauthorized(res: NextApiResponse) {
  return sendError(res, 'Unauthorized', 401);
}

export function sendBadRequest(res: NextApiResponse, message: string) {
  return sendError(res, message, 400);
} 