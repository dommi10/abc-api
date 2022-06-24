import { Request, Response } from 'express';
import * as bcryptjs from 'bcryptjs';
import dayjs from 'dayjs';
import { AppDataSource } from '../data-source';
import { User, niveau as niveauType } from '../entity/User.entity';
import {
  EXPIRE_ACCESS_TOKEN,
  EXPIRE_DAILY_REFRESH_TOKEN,
  EXPIRE_REFRESH_TOKEN,
  generateRandomString,
  getComment,
  sendSMS,
  signToken,
  validateAsDigit,
  validateAsPassword,
  validateAsString,
  validateAsStringForQuery,
} from '../utils';
import { IRequest, UserType } from '../helpers';
import { saveRefreshToken } from './TokenController';
import { Abonnement } from '../entity/Abonnement.entity';
import { QueryRunner } from 'typeorm';
import { Acces } from '../entity/Access.entity';

export async function all(req: Request, res: Response) {
  try {
    const { skip, take } = req.query;

    if (
      !skip ||
      !validateAsDigit(skip as string) ||
      !take ||
      !validateAsDigit(take as string)
    )
      return res.json({ message: 'params invalid' });

    const total = await AppDataSource.getRepository(User).count();
    const users = await AppDataSource.getRepository(User).find({
      skip: Number.parseInt(skip as string),
      take: Number.parseInt(take as string),
      order: { createdAt: 'DESC' },
    });
    return res.json({ users, total });
  } catch (error) {
    console.log(error);
    return res.json({ message: 'Something went wrong, please try again' });
  }
}

export async function one(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!id || !validateAsDigit(id)) return res.json({ message: 'invalid id' });

    const user = await AppDataSource.getRepository(User).findOneBy({ id });

    if (!user) return res.json({ message: 'user not exist' });

    return res.json({ user });
  } catch (error) {
    console.log(error);
    return res.json({ message: 'something went wrong try again' });
  }
}

export async function me(req: IRequest, res: Response) {
  try {
    if (!req.user) return res.json({ message: 'user must be login' });

    const { id } = req.user;

    if (!id || !validateAsDigit(id)) return res.json({ message: 'invalid id' });

    const user = await AppDataSource.getRepository(User).findOne({
      where: { id },
      relations: {
        access: {
          entreprise: true,
        },
      },
    });

    if (!user) return res.json({ message: 'user not exist' });

    return res.json({ user });
  } catch (error) {
    console.log(error);
    return res.json({ message: 'something went wrong try again' });
  }
}

export async function saveUserByValues({
  username,
  loggedUser,
  niveau,
  comment,
  queryRunner,
}: {
  username: string;
  niveau: niveauType;
  comment: string;
  loggedUser: UserType;
  queryRunner: QueryRunner;
}): Promise<string | { username: string; password: string; acces: Acces }> {
  try {
    if (!loggedUser || loggedUser.niveau !== 'ADMIN')
      return "vous ne disposez pas assez d'autorisation pour effectuer cette action";

    if (!username || !validateAsString(username)) return 'username invalid';

    if (!niveau || !Object.values(niveauType).includes(niveau))
      return 'invalid niveau';

    if (
      await AppDataSource.getRepository(User).findOneBy({
        username: username.toLocaleLowerCase(),
      })
    )
      return 'user already exists';

    const password = generateRandomString(8);
    const user = new User();
    user.id = Date.now().toString();
    user.username = username.toLocaleLowerCase();
    user.password = bcryptjs.hashSync(password);
    user.niveau = niveau;
    user.comment = comment;

    await queryRunner.manager.save(user);

    const acces = new Acces();
    acces.id = Date.now().toString();
    acces.comment = comment;

    await queryRunner.manager.save(acces);

    const connectedUser = await AppDataSource.getRepository(User).findOneBy({
      id: loggedUser.id,
    });

    await queryRunner.manager
      .createQueryBuilder()
      .relation(Acces, 'user')
      .of(acces)
      .set(user);

    await queryRunner.manager
      .createQueryBuilder()
      .relation(Acces, 'savedBy')
      .of(acces)
      .set(connectedUser);

    return { username, password, acces };
  } catch (error) {
    console.log(error);
    return 'something went wrong try again';
  }
}

export async function save(req: IRequest, res: Response) {
  try {
    const { username, password, niveau } = req.body;
    const { user: loggedUser } = req;

    if (!loggedUser || loggedUser.niveau !== 'ADMIN')
      return res.json({
        message:
          "vous ne disposez pas assez d'autorisation pour effectuer cette action",
      });

    if (!username || !validateAsString(username))
      return res.json({ message: 'username invalid' });

    if (!password || !validateAsPassword(password))
      return res.json({ message: 'password incorrect' });

    if (!niveau || !Object.values(niveauType).includes(niveau))
      return res.json({ message: 'invalid niveau' });

    if (
      await AppDataSource.getRepository(User).findOneBy({
        username: (username as string).toLocaleLowerCase(),
      })
    )
      return res.json({ message: 'user already exists' });
    const user = new User();
    user.id = Date.now().toString();
    user.username = (username as string).toLocaleLowerCase();
    user.password = bcryptjs.hashSync(password);
    user.niveau = niveau;
    user.comment = getComment(req);

    await AppDataSource.getRepository(User).save(user);

    return res.json({ user });
  } catch (error) {
    console.log(error);
    return res.json({ message: 'something went wrong try again' });
  }
}

export async function desactivate(req: IRequest, res: Response) {
  try {
    const { user } = req;
    const { id } = req.params;

    if (!user || user.niveau !== 'ADMIN')
      return res.json({
        message:
          "vous ne disposez pas assez d'autorisation pour effectuer cette action",
      });

    if (!id || !validateAsDigit(id)) return res.json({ message: 'id invalid' });

    const tempUser = await AppDataSource.getRepository(User).findOneBy({ id });

    if (!tempUser) return res.json({ message: 'user not exist' });

    await AppDataSource.getRepository(User).update({ id }, { statut: 0 });
    return res.json({ user: tempUser });
  } catch (error) {
    console.log(error);
    return res.json({ message: 'something went wrong try again' });
  }
}

export async function activate(req: IRequest, res: Response) {
  try {
    const { user } = req;
    const { id } = req.params;

    if (!user || user.niveau !== 'ADMIN')
      return res.json({
        message:
          "vous ne disposez pas assez d'autorisation pour effectuer cette action",
      });

    if (!id || !validateAsDigit(id)) return res.json({ message: 'id invalid' });

    const tempUser = await AppDataSource.getRepository(User).findOneBy({ id });

    if (!tempUser) return res.json({ message: 'user not exist' });

    await AppDataSource.getRepository(User).update({ id }, { statut: 1 });
    return res.json({ user: tempUser });
  } catch (error) {
    console.log(error);
    return res.json({ message: 'something went wrong try again' });
  }
}

export async function updateNiveau(req: IRequest, res: Response) {
  try {
    const { user } = req;
    const { id } = req.params;
    const { niveau } = req.body;

    if (!user || user.niveau !== 'ADMIN')
      return res.json({
        message:
          "vous ne disposez pas assez d'autorisation pour effectuer cette action",
      });

    if (!id || !validateAsDigit(id)) return res.json({ message: 'id invalid' });

    if (!niveau || !Object.values(niveauType).includes(niveau))
      return res.json({ message: 'invalid niveau' });

    const tempUser = await AppDataSource.getRepository(User).findOneBy({ id });

    if (!tempUser) return res.json({ message: 'user not exist' });

    await AppDataSource.getRepository(User).update({ id }, { niveau });
    tempUser.niveau = niveau;
    return res.json({ user: tempUser });
  } catch (error) {
    console.log(error);
    return res.json({ message: 'something went wrong try again' });
  }
}

export async function changePassword(req: IRequest, res: Response) {
  try {
    const { user } = req;
    const { id } = req.params;

    if (!user || user.niveau !== 'ADMIN')
      return res.json({
        message:
          "vous ne disposez pas assez d'autorisation pour effectuer cette action",
      });

    if (!id || !validateAsDigit(id)) return res.json({ message: 'id invalid' });

    const tempUser = await AppDataSource.getRepository(User).findOneBy({ id });

    if (!tempUser) return res.json({ message: 'user not exist' });

    const pass = generateRandomString(8);
    const password = bcryptjs.hashSync(pass);
    await AppDataSource.getRepository(User).update({ id }, { password });

    return res.json({ password: pass });
  } catch (error) {
    console.log(error);
    return res.json({ message: 'something went wrong try again' });
  }
}

export async function changePasswordBySMS(req: IRequest, res: Response) {
  try {
    const { username } = req.params;

    if (!username || !validateAsString(username))
      return res.json({ message: 'username est invalide' });

    const tempUser = await AppDataSource.getRepository(User).findOneBy({
      username,
    });

    if (!tempUser) return res.json({ message: 'user not exist' });

    if (tempUser.niveau !== niveauType.USER) {
      return res.json({
        message:
          "veiller contancter votre l'administracteur pour changer votre mot de passe",
      });
    }

    if (!tempUser.access || !tempUser.access.entreprise)
      return res.json({
        message:
          "votre compte n'est pas lié, impossible de faire de changer votre mot de passe",
      });

    const abonnement = await AppDataSource.getRepository(Abonnement).findOne({
      where: {
        entreprise: {
          id: tempUser.access.entreprise.id,
        },
      },
      order: { createdAt: 'DESC' },
    });

    if (!abonnement)
      return res.json({
        message:
          "vous ne possède pas d'abonnement impossible  de changer votre mot de passe",
      });

    if (dayjs(dayjs(Date.now())).isBefore(dayjs(abonnement.dateFin)))
      return res.json({
        message:
          "vous ne possède pas d'abonnement actif impossible  de changer votre mot de passe",
      });
    const pass = generateRandomString(8);

    const password = bcryptjs.hashSync(pass);
    await AppDataSource.getRepository(User).update({ username }, { password });
    await sendSMS(
      tempUser.access.entreprise.tel.replace(' ', '').replace('+', ''),
      `Bonjour\n,votre nouveau mot de passe est : ${pass}`,
    );

    return res.json({ success: 'success' });
  } catch (error) {
    console.log(error);
    return res.json({ message: 'something went wrong try again' });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { username, password, stayLogged } = req.body;

    if (!username || !validateAsString(username))
      return res.json({ message: 'username invalid' });

    if (!password || !validateAsPassword(password))
      return res.json({ message: 'password incorrect' });

    const user = await AppDataSource.getRepository(User).findOne({
      where: { username },
      relations: {
        access: {
          entreprise: true,
        },
      },
    });

    if (!user || !bcryptjs.compareSync(password, user.password))
      return res.json({ message: 'username or password incorrect' });

    if (user.statut == 0)
      return res.json({
        message: 'access blocked, please contact administrator',
      });

    if (user.niveau === niveauType.USER) {
      if (!user.access || !user.access.entreprise)
        return res.json({
          message: "votre compte n'est pas lié",
        });
    }

    const token = signToken({
      user: {
        id: user.id,
        username: user.username,
        niveau: user.niveau,
        statut: user.statut,
        superAdmin: user.isSuper,
      },
      expiresIn: EXPIRE_ACCESS_TOKEN,
    });

    const refreshToken = signToken({
      user: {
        id: user.id,
        username: user.username,
        niveau: user.niveau,
        statut: user.statut,
        superAdmin: user.isSuper,
      },
      expiresIn: stayLogged ? EXPIRE_REFRESH_TOKEN : EXPIRE_DAILY_REFRESH_TOKEN,
    });

    const value = await saveRefreshToken({ token, refreshToken });

    if (typeof value !== 'string')
      return res.json({ message: ' something went wrong try again' });

    return res.json({ token, refreshToken });
  } catch (error) {
    console.log(error);
    return res.json({ message: 'something went wrong please try again' });
  }
}

export async function searchUser(req: Request, res: Response) {
  try {
    const { skip, take, query } = req.query;

    if (
      !skip ||
      !validateAsDigit(skip as string) ||
      !take ||
      !validateAsDigit(take as string)
    )
      return res.json({ message: 'params invalid' });

    // if search key doesn't provide
    if (!query || query?.toString().length < 2) {
      return await all(req, res);
    }

    if (query && validateAsStringForQuery('' + query)) {
      const total = await AppDataSource.getRepository(User)
        .createQueryBuilder('user')
        .where('username like :query', { query: `%${query}%` })
        .orWhere('niveau like :query', { query: `%${query}%` })
        .getCount();

      const users = await AppDataSource.getRepository(User)
        .createQueryBuilder('user')
        .where('username like :query', { query: `%${query}%` })
        .orWhere('niveau like :query', { query: `%${query}%` })
        .take(Number.parseFloat(take as string))
        .skip(Number.parseFloat(skip as string))
        .orderBy('createdAt', 'DESC')
        .getMany();

      return res.json({ user: users, total });
    }
    return res.json({ message: 'invalid query' });
  } catch (error) {
    console.log(error);
    return res.json({ message: 'something went wrong, please try again' });
  }
}
