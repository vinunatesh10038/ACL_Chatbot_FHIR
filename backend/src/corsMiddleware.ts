import { Request, Response, NextFunction } from 'express';

export const corsMiddleware = (req: Request, res: Response, next: NextFunction): Response | void => {
  const allowedOrigin = process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL_PRODUCTION
    : process.env.FRONTEND_URL_LOCAL;
  const origin = req.headers.origin;

  // Allow the specific origin if it matches
  if (origin === allowedOrigin) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    console.log(`Origin mismatch: ${origin} vs ${allowedOrigin}`);
  }

  // Allow credentials
  res.header('Access-Control-Allow-Credentials', 'true');

  // Allow specific HTTP methods
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

  // Allow specific headers
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');

  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  next();
};
