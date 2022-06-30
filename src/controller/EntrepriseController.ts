import { Request, Response } from 'express';
import * as bcryptjs from 'bcryptjs';
import dayjs from 'dayjs';
import { AppDataSource } from '../data-source';
import { Entreprise } from '../entity/Entreprise.entity';
import { niveau as niveauType, User } from '../entity/User.entity';
import {
  formatToNumber,
  generateRandomString,
  getComment,
  validateAsDigit,
  validateAsPhoneNumber,
  validateAsString,
  validateAsStringForQuery,
} from '../utils';
import { IRequest } from '../helpers';
import { saveUserByValues } from './UserController';
import { Like } from 'typeorm';
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

    const total = await AppDataSource.getRepository(Entreprise).count();
    const entreprises = await AppDataSource.getRepository(Entreprise).find({
      skip: Number.parseInt(skip as string),
      take: Number.parseInt(take as string),
      order: { createdAt: 'DESC' },
    });
    return res.json({ entreprises, total });
  } catch (error) {
    console.log(error);
    return res.json({ message: 'Something went wrong, please try again' });
  }
}

export async function one(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!id || !validateAsDigit(id)) return res.json({ message: 'invalid id' });

    const entreprise = await AppDataSource.getRepository(Entreprise).findOneBy({
      id,
    });

    if (!entreprise) return res.json({ message: 'entreprise not exist' });

    return res.json({ entreprise });
  } catch (error) {
    console.log(error);
    return res.json({ message: 'something went wrong try again' });
  }
}

export async function save(req: IRequest, res: Response) {
  const password = generateRandomString(8);
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const {
      nom,
      type,
      rccm,
      impot,
      idnat,
      adresse,
      ville,
      province,
      senderName,
      nomRepresentant,
      fonction,
      tel,
    } = req.body;
    const { user: loggedUser } = req;

    if (!loggedUser || loggedUser.niveau !== niveauType.ADMIN)
      return res.json({
        message:
          "vous ne disposez pas assez d'autorisation pour effectuer cette action",
      });

    if (!nom || !validateAsString(nom))
      return res.json({ message: 'nom invalid' });

    if (!type || !validateAsString(type))
      return res.json({ message: 'type incorrect' });

    if (!rccm || !validateAsString(rccm))
      return res.json({ message: 'rccm incorrecte' });

    if (!impot || !validateAsString(impot))
      return res.json({ message: 'impot incorrect' });

    if (!adresse || !validateAsString(adresse))
      return res.json({ message: 'adresse incorrect' });

    if (!idnat || !validateAsString(idnat))
      return res.json({ message: 'idnat incorrect' });

    if (!ville || !validateAsString(ville))
      return res.json({ message: 'ville incorrect' });

    if (!province || !validateAsString(province))
      return res.json({ message: 'province incorrect' });

    if (!senderName || !validateAsString(senderName))
      return res.json({ message: 'senderName incorrect' });

    if (!nomRepresentant || !validateAsString(nomRepresentant))
      return res.json({ message: 'nomRepresentant incorrect' });

    if (!fonction || !validateAsString(fonction))
      return res.json({ message: 'fonction incorrect' });

    if (!tel || !validateAsPhoneNumber(tel))
      return res.json({ message: 'numero de tel incorrect' });

    const entreprise = new Entreprise();
    entreprise.id = Date.now().toString();
    entreprise.nom = (nom as string).toLocaleLowerCase();
    entreprise.rccm = rccm;
    entreprise.type = type;
    entreprise.impot = impot;
    entreprise.comment = getComment(req);
    entreprise.idnat = idnat;
    entreprise.adresse = adresse;
    entreprise.ville = ville;
    entreprise.province = province;
    entreprise.senderName = senderName;
    entreprise.nomRepresentant = nomRepresentant;
    entreprise.fonction = fonction;
    entreprise.tel = formatToNumber(tel);
    await queryRunner.manager.save(entreprise);

    const user = await AppDataSource.getRepository(User).findOne({
      where: {
        username: Like('user-%'),
      },
      order: { createdAt: 'DESC' },
    });

    let username = 'user-0001';

    if (user) {
      const order =
        Number.parseInt(
          user.username
            .toString()
            .substring(user.username.toString().lastIndexOf('-') + 1),
        ) + 1;

      if (order < 10) username = `user-000${order}`;
      else if (order >= 10 && order < 100) username = `user-00${order}`;
      else if (order >= 100 && order < 1000) username = `user-0${order}`;
      else username = `user-${order}`;
    }

    const saveUser = await saveUserByValues({
      username,
      loggedUser,
      niveau: niveauType.USER,
      queryRunner,
      comment: getComment(req),
      password,
    });

    if (typeof saveUser === 'string') {
      await queryRunner.rollbackTransaction();
      return res.json({ message: saveUser });
    }

    const connectedUser = await AppDataSource.getRepository(User).findOneBy({
      id: loggedUser.id,
    });

    await queryRunner.manager
      .createQueryBuilder()
      .relation(Entreprise, 'savedBy')
      .of(entreprise)
      .set(connectedUser);

    await queryRunner.manager
      .createQueryBuilder()
      .relation(Acces, 'entreprise')
      .of(saveUser.acces)
      .set(entreprise);

    await queryRunner.commitTransaction();

    return res.json({ entreprise, user: saveUser });
  } catch (error) {
    console.log(error);
    await queryRunner.rollbackTransaction();
    return res.json({ message: 'something went wrong try again' });
  } finally {
    // you need to release query runner which is manually created:
    await queryRunner.release();
  }
}

export async function update(req: IRequest, res: Response) {
  try {
    const { id } = req.params;
    const {
      nom,
      type,
      rccm,
      impot,
      idnat,
      adresse,
      ville,
      province,
      senderName,
      nomRepresentant,
      fonction,
      tel,
    } = req.body;
    const { user } = req;

    if (!user || user.niveau !== niveauType.ADMIN)
      return res.json({
        message:
          "vous ne disposez pas assez d'autorisation pour effectuer cette action",
      });

    if (!id || !validateAsDigit(id)) return res.json({ message: 'id invalid' });

    const tempUser = await AppDataSource.getRepository(Entreprise).findOneBy({
      id,
    });

    if (!tempUser) return res.json({ message: 'entreprise non trouve' });

    if (!nom || !validateAsString(nom))
      return res.json({ message: 'nom invalid' });

    if (!type || !validateAsString(type))
      return res.json({ message: 'type incorrect' });

    if (!rccm || !validateAsString(rccm))
      return res.json({ message: 'rccm incorrecte' });

    if (!impot || !validateAsString(impot))
      return res.json({ message: 'impot incorrect' });

    if (!adresse || !validateAsString(adresse))
      return res.json({ message: 'adresse incorrect' });

    if (!idnat || !validateAsString(idnat))
      return res.json({ message: 'idnat incorrect' });

    if (!ville || !validateAsString(ville))
      return res.json({ message: 'ville incorrect' });

    if (!province || !validateAsString(province))
      return res.json({ message: 'province incorrect' });

    if (!senderName || !validateAsString(senderName))
      return res.json({ message: 'senderName incorrect' });

    if (!nomRepresentant || !validateAsString(nomRepresentant))
      return res.json({ message: 'nomRepresentant incorrect' });

    if (!fonction || !validateAsString(fonction))
      return res.json({ message: 'fonction incorrect' });

    if (!tel || !validateAsPhoneNumber(tel))
      return res.json({ message: 'numero de tel incorrect' });

    const entreprise = new Entreprise();
    entreprise.id = id;
    entreprise.nom = (nom as string).toLocaleLowerCase();
    entreprise.rccm = rccm;
    entreprise.type = type;
    entreprise.impot = impot;
    entreprise.comment = getComment(req);
    entreprise.idnat = idnat;
    entreprise.adresse = adresse;
    entreprise.ville = ville;
    entreprise.province = province;
    entreprise.senderName = senderName;
    entreprise.nomRepresentant = nomRepresentant;
    entreprise.fonction = fonction;
    entreprise.tel = formatToNumber(tel);
    await AppDataSource.getRepository(Entreprise).update(
      { id },
      { ...entreprise },
    );

    const connectedUser = await AppDataSource.getRepository(User).findOneBy({
      id: user.id,
    });

    await AppDataSource.createQueryBuilder()
      .relation(Entreprise, 'savedBy')
      .of(entreprise)
      .set(connectedUser);

    return res.json({ entreprise });
  } catch (error) {
    console.log(error);
    return res.json({ message: 'something went wrong try again' });
  }
}

export async function searchEntreprise(req: Request, res: Response) {
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
      const total = await AppDataSource.getRepository(Entreprise)
        .createQueryBuilder('user')
        .where(
          'nom like :query or rccm like :query or idnat like :query or senderName like :query or ville like :query or province like :query ',
          { query: `%${query}%` },
        )
        .getCount();

      const entreprises = await AppDataSource.getRepository(Entreprise)
        .createQueryBuilder('user')
        .where(
          'nom like :query or rccm like :query or idnat like :query or senderName like :query or ville like :query or province like :query ',
          { query: `%${query}%` },
        )
        .take(Number.parseFloat(take as string))
        .skip(Number.parseFloat(skip as string))
        .orderBy('createdAt', 'DESC')
        .getMany();

      return res.json({ entreprises, total });
    }
    return res.json({ message: 'invalid query' });
  } catch (error) {
    console.log(error);
    return res.json({ message: 'something went wrong, please try again' });
  }
}
