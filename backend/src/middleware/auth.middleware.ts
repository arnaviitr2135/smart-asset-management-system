import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'culttrack-super-secret-key';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'ADMIN' | 'USER';
  };
}

export function authenticateJWT(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid or expired token' });
      }
      req.user = decoded as AuthenticatedRequest['user'];
      next();
    });
  } else {
    res.status(401).json({ error: 'Authorization header is missing or malformed' });
  }
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin privileges required' });
  }

  next();
}
