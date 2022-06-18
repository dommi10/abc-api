import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { Campagne } from '../entity/Campagne.entity';
import { niveau as niveauType } from '../entity/User.entity';
import {
  getComment,
  validateAsDigit,
  validateAsString,
  validateAsStringForQuery,
} from '../utils';
import { IRequest } from '../helpers';

export async function all(req: Request, res: Response) {
  try {
    const { skip, take, entrepriseId } = req.query;

    if (
      !skip ||
      !validateAsDigit(skip as string) ||
      !take ||
      !validateAsDigit(take as string) ||
      !entrepriseId ||
      !validateAsDigit(entrepriseId as string)
    )
      return res.json({ message: 'params invalid' });

    const total = await AppDataSource.getRepository(Campagne).count({
      where: {
        entreprise: {
          id: entrepriseId as string,
        },
      },
    });
    const users = await AppDataSource.getRepository(Campagne).find({
      where: {
        entreprise: {
          id: entrepriseId as string,
        },
      },
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

    const campagne = await AppDataSource.getRepository(Campagne).findOneBy({
      id,
    });

    if (!campagne) return res.json({ message: 'campagne not exist' });

    return res.json({ campagne });
  } catch (error) {
    console.log(error);
    return res.json({ message: 'something went wrong try again' });
  }
}

export async function save(req: IRequest, res: Response) {
  try {
    const { title, message } = req.body;
    const { user } = req;

    if (
      !user ||
      (user.niveau !== niveauType.USER && user.niveau !== niveauType.ADMIN)
    )
      return res.json({
        message:
          "vous ne disposez pas assez d'autorisation pour effectuer cette action",
      });

    if (!title || !validateAsString(title))
      return res.json({ message: 'title invalid' });

    if (!message || !validateAsString(message))
      return res.json({ message: 'message incorrect' });

    const tempUser = await AppDataSource.getRepository(Campagne).findOneBy({
      title: (title as string).toLocaleLowerCase(),
    });

    if (!tempUser)
      return res.json({
        message: 'une campagne avec le meme intutilé exist déjà',
      });

    const campagne = new Campagne();
    campagne.id = Date.now().toString();
    campagne.title = (title as string).toLocaleLowerCase();
    campagne.message = message;
    campagne.comment = getComment(req);
    await AppDataSource.getRepository(Campagne).save(campagne);

    const connectedUser = await AppDataSource.getRepository(Campagne).findOneBy(
      {
        id: user.id,
      },
    );

    await AppDataSource.createQueryBuilder()
      .relation(Campagne, 'savedBy')
      .of(campagne)
      .set(connectedUser);

    return res.json({ campagne });
  } catch (error) {
    console.log(error);
    return res.json({ message: 'something went wrong try again' });
  }
}

export async function update(req: IRequest, res: Response) {
  try {
    const { id } = req.params;

    const { title, message } = req.body;
    const { user } = req;

    if (
      !user ||
      (user.niveau !== niveauType.USER && user.niveau !== niveauType.ADMIN)
    )
      return res.json({
        message:
          "vous ne disposez pas assez d'autorisation pour effectuer cette action",
      });

    if (!id || !validateAsDigit(id)) return res.json({ message: 'id invalid' });

    const tempUser = await AppDataSource.getRepository(Campagne).findOneBy({
      id,
    });

    if (!title || !validateAsString(title))
      return res.json({ message: 'title invalid' });

    if (!message || !validateAsString(message))
      return res.json({ message: 'message incorrect' });

    if (!tempUser) return res.json({ message: 'campagne not exist' });

    const campagne = new Campagne();
    campagne.id = id;
    campagne.title = (title as string).toLocaleLowerCase();
    campagne.message = message;
    campagne.comment = getComment(req);
    await AppDataSource.getRepository(Campagne).update({ id }, { ...campagne });

    const connectedUser = await AppDataSource.getRepository(Campagne).findOneBy(
      {
        id: user.id,
      },
    );

    await AppDataSource.createQueryBuilder()
      .relation(Campagne, 'savedBy')
      .of(campagne)
      .set(connectedUser);

    return res.json({ campagne });
  } catch (error) {
    console.log(error);
    return res.json({ message: 'something went wrong try again' });
  }
}

export async function searchCampagne(req: Request, res: Response) {
  try {
    const { skip, take, query, entrepriseId } = req.query;

    if (
      !skip ||
      !validateAsDigit(skip as string) ||
      !take ||
      !validateAsDigit(take as string) ||
      !entrepriseId ||
      !validateAsDigit(entrepriseId as string)
    )
      return res.json({ message: 'params invalid' });

    // if search key doesn't provide
    if (!query || query?.toString().length < 2) {
      return await all(req, res);
    }

    if (query && validateAsStringForQuery('' + query)) {
      const total = await AppDataSource.getRepository(Campagne)
        .createQueryBuilder('campagne')
        .where(
          '(title like :query or message like :query ) and entrepriseId = :entrepriseId',
          { query: `%${query}%`, entrepriseId },
        )
        .getCount();

      const users = await AppDataSource.getRepository(Campagne)
        .createQueryBuilder('campagne')
        .where(
          '(title like :query or message like :query ) and entrepriseId = :entrepriseId',
          { query: `%${query}%`, entrepriseId },
        )
        .take(Number.parseFloat(take as string))
        .skip(Number.parseFloat(skip as string))
        .orderBy('createdAt', 'DESC')
        .getMany();

      return res.json({ campagne: users, total });
    }
    return res.json({ message: 'invalid query' });
  } catch (error) {
    console.log(error);
    return res.json({ message: 'something went wrong, please try again' });
  }
}
