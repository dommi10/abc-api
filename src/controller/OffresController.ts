import { Request, Response } from 'express';
import * as bcryptjs from 'bcryptjs';
import dayjs from 'dayjs';
import { AppDataSource } from '../data-source';
import { Offres } from '../entity/Offres.entity';
import { niveau as niveauType, User } from '../entity/User.entity';
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
import { IRequest } from '../helpers';
import { saveRefreshToken } from './TokenController';
import { Abonnement } from '../entity/Abonnement.entity';

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

    const total = await AppDataSource.getRepository(Offres).count();
    const users = await AppDataSource.getRepository(Offres).find({
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

    const offre = await AppDataSource.getRepository(Offres).findOneBy({ id });

    if (!offre) return res.json({ message: 'user not exist' });

    return res.json({ offre });
  } catch (error) {
    console.log(error);
    return res.json({ message: 'something went wrong try again' });
  }
}

export async function save(req: IRequest, res: Response) {
  try {
    const { designation, nombre, frais } = req.body;
    const { user: loggedUser } = req;

    if (!loggedUser || loggedUser.niveau !== 'ADMIN')
      return res.json({ message: 'acces denied' });

    if (!designation || !validateAsString(designation))
      return res.json({ message: 'designation invalid' });

    if (!nombre || !validateAsDigit(nombre))
      return res.json({ message: 'nombre incorrect' });

    if (!frais || !validateAsDigit(frais))
      return res.json({ message: 'frais niveau' });

    await AppDataSource.getRepository(Offres).update(
      { statut: 1 },
      { statut: 0 },
    );

    const offre = new Offres();
    offre.id = Date.now().toString();
    offre.designation = (designation as string).toLocaleLowerCase();
    offre.frais = Number.parseFloat(frais);
    offre.nombre = Number.parseFloat(nombre);
    offre.comment = getComment(req);
    offre.statut = 1;
    await AppDataSource.getRepository(Offres).save(offre);

    const connectedUser = await AppDataSource.getRepository(User).findOneBy({
      id: loggedUser.id,
    });

    await AppDataSource.createQueryBuilder()
      .relation(Offres, 'user')
      .of(offre)
      .set(connectedUser);

    return res.json({ offre });
  } catch (error) {
    console.log(error);
    return res.json({ message: 'something went wrong try again' });
  }
}

export async function update(req: IRequest, res: Response) {
  try {
    const { id } = req.params;

    const { designation, nombre, frais } = req.body;
    const { user } = req;

    if (!user || user.niveau !== 'ADMIN')
      return res.json({ message: 'acces denied' });

    if (!id || !validateAsDigit(id)) return res.json({ message: 'id invalid' });

    const tempUser = await AppDataSource.getRepository(Offres).findOneBy({
      id,
    });

    if (!designation || !validateAsString(designation))
      return res.json({ message: 'designation invalid' });

    if (!nombre || !validateAsDigit(nombre))
      return res.json({ message: 'nombre incorrect' });

    if (!frais || !validateAsDigit(frais))
      return res.json({ message: 'frais niveau' });

    if (!tempUser) return res.json({ message: 'offre not exist' });

    await AppDataSource.getRepository(Offres).update({ id }, { statut: 0 });
    const offre = new Offres();
    offre.id = id;
    offre.designation = (designation as string).toLocaleLowerCase();
    offre.frais = Number.parseFloat(frais);
    offre.nombre = Number.parseFloat(nombre);
    offre.comment = getComment(req);
    await AppDataSource.getRepository(Offres).update({ id }, { ...offre });

    const connectedUser = await AppDataSource.getRepository(User).findOneBy({
      id: user.id,
    });

    await AppDataSource.createQueryBuilder()
      .relation(Offres, 'user')
      .of(offre)
      .set(connectedUser);

    return res.json({ offre });
  } catch (error) {
    console.log(error);
    return res.json({ message: 'something went wrong try again' });
  }
}

export async function searchOffre(req: Request, res: Response) {
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
      const total = await AppDataSource.getRepository(Offres)
        .createQueryBuilder('user')
        .where('designation like :query', { query: `%${query}%` })
        .getCount();

      const users = await AppDataSource.getRepository(Offres)
        .createQueryBuilder('user')
        .where('designation like :query', { query: `%${query}%` })
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
