import jwt from 'jsonwebtoken';
import { Response, NextFunction } from 'express';
import { IRequest, UserType } from '../helpers';
import * as dotenv from 'dotenv';

dotenv.config();

export function authenticateToken(
  req: IRequest,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  jwt.verify(
    token ?? '',
    process.env.PRIVATE_KEY ?? '',
    (_err: any, user: any) => {
      if (user) {
        req.user = user as UserType;
        next();
      } else {
        return res.status(401).json({ message: 'user must be login' });
      }
    },
  );
}

export function verifyRefreshToken({
  refreshToken,
}: {
  refreshToken: string;
}): any {
  return jwt.verify(refreshToken, process.env.PRIVATE_KEY ?? '');
}
