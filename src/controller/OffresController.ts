import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { Offres } from '../entity/Offres.entity';
import { niveau as niveauType, User } from '../entity/User.entity';
import {
  getComment,
  validateAsDigit,
  validateAsString,
  validateAsStringForQuery,
} from '../utils';
import { IRequest } from '../helpers';

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
    const offres = await AppDataSource.getRepository(Offres).find({
      skip: Number.parseInt(skip as string),
      take: Number.parseInt(take as string),
      order: { createdAt: 'DESC' },
    });
    return res.json({ offres, total });
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

    if (!offre) return res.json({ message: 'offre not exist' });

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

    if (!loggedUser || loggedUser.niveau !== niveauType.ADMIN)
      return res.json({
        message:
          "vous ne disposez pas assez d'autorisation pour effectuer cette action",
      });

    if (!designation || !validateAsString(designation))
      return res.json({ message: 'designation invalid' });

    if (!nombre || !validateAsDigit(nombre))
      return res.json({ message: 'nombre incorrect' });

    if (!frais || !validateAsDigit(frais))
      return res.json({ message: 'frais invalide' });

    await AppDataSource.getRepository(Offres).update(
      { designation: (designation as string).toLocaleLowerCase() },
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
      .relation(Offres, 'savedBy')
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
      return res.json({
        message:
          "vous ne disposez pas assez d'autorisation pour effectuer cette action",
      });

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
      .relation(Offres, 'savedBy')
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

      const offres = await AppDataSource.getRepository(Offres)
        .createQueryBuilder('user')
        .where('designation like :query', { query: `%${query}%` })
        .take(Number.parseFloat(take as string))
        .skip(Number.parseFloat(skip as string))
        .orderBy('createdAt', 'DESC')
        .getMany();

      return res.json({ offres, total });
    }
    return res.json({ message: 'invalid query' });
  } catch (error) {
    console.log(error);
    return res.json({ message: 'something went wrong, please try again' });
  }
}
