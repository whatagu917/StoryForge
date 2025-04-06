import { NextApiResponse } from 'next';

export class APIError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export function handleError(res: NextApiResponse, error: unknown) {
  console.error('API Error:', {
    error: error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: (error as any).code
    } : error
  });

  if (error instanceof APIError) {
    return res.status(error.statusCode).json({
      message: error.message,
      code: error.code
    });
  }

  const isDev = process.env.NODE_ENV === 'development';
  return res.status(500).json({
    message: isDev && error instanceof Error
      ? `Internal server error: ${error.message}`
      : 'Internal server error'
  });
} 