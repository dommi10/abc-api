import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { verifyRefreshToken } from '../middleware';
import { Token } from '../entity/Token.entity';
import { EXPIRE_ACCESS_TOKEN, signToken } from '../utils';

export async function saveRefreshToken({
  token,
  refreshToken,
}: {
  token: string;
  refreshToken: string;
}): Promise<string | boolean> {
  try {
    const tempToken = new Token();
    tempToken.id = Date.now().toString();
    tempToken.token = token;
    tempToken.isUsed = false;
    tempToken.refreshToken = refreshToken;

    await AppDataSource.getRepository(Token).save(tempToken);
    return 'saved';
  } catch (error) {
    // there's an error
    return false;
  }
}

export async function refreshAccessToken({
  refreshToken,
}: {
  refreshToken: string;
}): Promise<boolean | string> {
  try {
    if (refreshToken) {
      const tokenValue = await AppDataSource.getRepository(Token).findOneBy({
        refreshToken,
      });

      // token not exist in whitelist
      if (!tokenValue) return true;

      // check if refreshToken is used
      if (tokenValue.isUsed) return false;

      const res = verifyRefreshToken({ refreshToken });

      if (typeof res === 'string') return false;

      const { id, username, niveau, statut, isSuper } = res;

      const token = signToken({
        user: {
          id,
          username,
          niveau,
          statut,
          superAdmin: isSuper,
        },
        expiresIn: EXPIRE_ACCESS_TOKEN,
      });

      const value = await saveRefreshToken({ token, refreshToken });

      if (typeof value !== 'string') return false;

      return token;
    }
    return false;
  } catch (error) {
    // there's an error
    console.log(error);
    return false;
  }
}

export async function refreshUserToken(req: Request, res: Response) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken)
      return res.json({ message: 'refreshToken must be provide' });
    const token = await refreshAccessToken({ refreshToken });
    if (typeof token !== 'string')
      return res.status(403).json({ message: 'user must be login' });
    return res.json({ token });
  } catch (error) {
    console.log(error);
    return res.json({ message: ' something went wrong try again' });
  }
}

export async function clearSession(req: Request, res: Response) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.json({ message: 'token must be provide' });
    const tokenRes = await deleteSession({ token });
    if (!tokenRes)
      return res
        .status(403)
        .json({ message: ' something went wrong try again' });
    return res.json({ token: 'clear session' });
  } catch (error) {
    console.log(error);
    return res.json({ message: ' something went wrong try again' });
  }
}

export async function deleteSession({
  token,
}: {
  token: string;
}): Promise<boolean> {
  try {
    if (token) {
      const tokenValue = await AppDataSource.getRepository(Token).findOneBy({
        token: token,
      });

      // token not exist in whitelist
      if (!tokenValue) return false;

      const { refreshToken } = tokenValue;

      await AppDataSource.getRepository(Token).update(
        { refreshToken },
        { isUsed: true },
      );

      return true;
    }
    return false;
  } catch (error) {
    // there's an error
    console.log(error);
    return false;
  }
}
