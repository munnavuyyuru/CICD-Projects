import type { Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase';
import { AppError } from './errors';

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header) {
    return next(new AppError(401, 'Missing Authorization header'));
  }

  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(new AppError(401, 'Invalid Authorization format. Use: Bearer <token>'));
  }

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return next(new AppError(401, 'Invalid or expired token'));
  }

  (req as unknown as Record<string, unknown>).user = {
    id: data.user.id,
    email: data.user.email ?? '',
  };

  next();
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header) {
    return next();
  }

  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next();
  }

  supabase.auth
    .getUser(token)
    .then(({ data }) => {
      if (data.user) {
        (req as unknown as Record<string, unknown>).user = {
          id: data.user.id,
          email: data.user.email ?? '',
        };
      }
      next();
    })
    .catch(() => next());
}
