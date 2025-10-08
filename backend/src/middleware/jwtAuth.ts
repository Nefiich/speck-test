import { Request, Response, NextFunction } from 'express';
import JwtService, { JwtPayload } from '../services/JwtService';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const token = JwtService.extractTokenFromHeader(req.headers.authorization);

  if (!token) {
    return res.status(401).json({
      message: 'Access token required',
      authenticated: false
    });
  }

  try {
    const decoded = JwtService.verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      message: 'Invalid or expired access token',
      authenticated: false
    });
  }
}

export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const token = JwtService.extractTokenFromHeader(req.headers.authorization);

  if (token) {
    try {
      const decoded = JwtService.verifyAccessToken(token);
      req.user = decoded;
    } catch (error) {
      console.log('Invalid token in optional auth:', error);
    }
  }

  next();
}