import { Request, Response } from 'express';
import dayjs from 'dayjs';
import { AppDataSource } from '../data-source';
import { Abonnement } from '../entity/Abonnement.entity';
import { niveau as niveauType } from '../entity/User.entity';
import {
  getComment,
  validateAsDigit,
  validateAsStringForQuery,
} from '../utils';
import { IRequest } from '../helpers';
import { Offres } from '../entity/Offres.entity';
import { Entreprise } from '../entity/Entreprise.entity';
import { Forfait } from '../entity/Forfait.entity';

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

    const total = await AppDataSource.getRepository(Abonnement).count({
      where: {
        entreprise: {
          id: entrepriseId as string,
        },
      },
    });
    const abonnements = await AppDataSource.getRepository(Abonnement).find({
      where: {
        entreprise: {
          id: entrepriseId as string,
        },
      },
      skip: Number.parseInt(skip as string),
      take: Number.parseInt(take as string),
      relations: {
        activateBy: true,
        entreprise: true,
        savedBy: true,
        offre: true,
      },
      order: { createdAt: 'DESC' },
    });
    return res.json({ abonnements, total });
  } catch (error) {
    console.log(error);
    return res.json({ message: 'Something went wrong, please try again' });
  }
}

export async function one(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!id || !validateAsDigit(id)) return res.json({ message: 'invalid id' });

    const abonnements = await AppDataSource.getRepository(Abonnement).findOneBy(
      {
        id,
      },
    );

    if (!abonnements) return res.json({ message: 'abonnements not exist' });

    return res.json({ abonnements });
  } catch (error) {
    console.log(error);
    return res.json({ message: 'something went wrong try again' });
  }
}

export async function save(req: IRequest, res: Response) {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();
  try {
    const { offreId, entrepriseId } = req.body;
    const { user } = req;

    if (
      !user ||
      (user.niveau !== niveauType.AGENT &&
        user.niveau !== niveauType.VALIDATEUR &&
        user.niveau !== niveauType.ADMIN)
    )
      return res.json({
        message:
          "vous ne disposez pas assez d'autorisation pour effectuer cette action",
      });

    if (!offreId || !validateAsDigit(offreId))
      return res.json({ message: 'offre invalid' });

    if (!entrepriseId || !validateAsDigit(entrepriseId))
      return res.json({ message: 'entreprise incorrect' });

    const offre = await AppDataSource.getRepository(Offres).findOneBy({
      id: offreId as string,
    });

    if (!offre) return res.json({ message: 'offre indisponible' });

    const entreprise = await AppDataSource.getRepository(Entreprise).findOneBy({
      id: entrepriseId as string,
    });

    if (!entreprise) return res.json({ message: 'entreprise indisponible' });

    const abonnements = new Abonnement();
    abonnements.id = Date.now().toString();
    abonnements.dateDebut = new Date(dayjs().format());
    abonnements.dateFin = new Date(dayjs().add(30, 'day').format());
    abonnements.comment = getComment(req);
    await queryRunner.manager.save(abonnements);

    const connectedUser = await AppDataSource.getRepository(
      Abonnement,
    ).findOneBy({
      id: user.id,
    });

    await queryRunner.manager
      .createQueryBuilder()
      .relation(Abonnement, 'savedBy')
      .of(abonnements)
      .set(connectedUser);

    await queryRunner.manager
      .createQueryBuilder()
      .relation(Abonnement, 'entreprise')
      .of(abonnements)
      .set(entreprise);

    await queryRunner.manager
      .createQueryBuilder()
      .relation(Abonnement, 'offre')
      .of(abonnements)
      .set(offre);

    await queryRunner.commitTransaction();
    return res.json({ abonnements });
  } catch (error) {
    console.log(error);
    await queryRunner.rollbackTransaction();
    return res.json({ message: 'something went wrong try again' });
  } finally {
    // you need to release query runner which is manually created:
    await queryRunner.release();
  }
}

export async function activate(req: IRequest, res: Response) {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();
  try {
    const { id } = req.params;

    const { user } = req;

    if (!user || user.niveau !== niveauType.VALIDATEUR)
      return res.json({
        message:
          "vous ne disposez pas assez d'autorisation pour effectuer cette action",
      });

    if (!id || !validateAsDigit(id)) return res.json({ message: 'id invalid' });

    const abonnement = await AppDataSource.getRepository(Abonnement).findOne({
      where: { id },
      relations: {
        offre: true,
        entreprise: true,
      },
    });

    if (!abonnement) return res.json({ message: 'abonnement non trouvé' });

    await queryRunner.manager.update(
      Abonnement,
      { id },
      { comment: getComment(req), statut: 1 },
    );

    const tempForfait = await AppDataSource.getRepository(Forfait).findOne({
      where: {
        abonnements: {
          entreprise: {
            id: abonnement.entreprise?.id,
          },
        },
      },
      order: { createdAt: 'DESC' },
    });

    const forfait = new Forfait();
    forfait.id = Date.now().toString();
    forfait.initial = tempForfait
      ? tempForfait.initial + tempForfait.entree - tempForfait.sortie
      : 0;
    forfait.entree = abonnement.offre?.nombre ?? 0;
    forfait.entree = abonnement.offre?.nombre ?? 0;
    forfait.sortie = 0;
    forfait.comment = getComment(req);

    const connectedUser = await AppDataSource.getRepository(
      Abonnement,
    ).findOneBy({
      id: user.id,
    });

    await queryRunner.manager
      .createQueryBuilder()
      .relation(Abonnement, 'activateBy')
      .of(abonnement)
      .set(connectedUser);

    await queryRunner.manager
      .createQueryBuilder()
      .relation(Forfait, 'savedBy')
      .of(forfait)
      .set(connectedUser);

    await queryRunner.manager
      .createQueryBuilder()
      .relation(Forfait, 'abonnements')
      .of(forfait)
      .set(abonnement);

    await queryRunner.commitTransaction();
    return res.json({ succes: true });
  } catch (error) {
    console.log(error);
    await queryRunner.rollbackTransaction();
    return res.json({ message: 'something went wrong try again' });
  } finally {
    // you need to release query runner which is manually created:
    await queryRunner.release();
  }
}

export async function searchAbonnement(req: Request, res: Response) {
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
      const total = await AppDataSource.getRepository(Abonnement)
        .createQueryBuilder('abonnements')
        .leftJoinAndSelect('abonnements.entreprise', 'entreprise')
        .leftJoinAndSelect('abonnements.activateBy', 'activateBy')
        .leftJoinAndSelect('abonnements.savedBy', 'savedBy')
        .leftJoinAndSelect('abonnements.offre', 'offre')
        .where(
          '(offre.designation like :query or savedBy.username like :query or activateBy.username like :query ) and entrepriseId = :entrepriseId',
          { query: `%${query}%`, entrepriseId },
        )
        .getCount();

      const abonnements = await AppDataSource.getRepository(Abonnement)
        .createQueryBuilder('abonnements')
        .leftJoinAndSelect('abonnements.entreprise', 'entreprise')
        .leftJoinAndSelect('abonnements.activateBy', 'activateBy')
        .leftJoinAndSelect('abonnements.savedBy', 'savedBy')
        .leftJoinAndSelect('abonnements.offre', 'offre')
        .where(
          '(offre.designation like :query or savedBy.username like :query or activateBy.username like :query ) and entrepriseId = :entrepriseId',
          { query: `%${query}%`, entrepriseId },
        )
        .take(Number.parseFloat(take as string))
        .skip(Number.parseFloat(skip as string))
        .orderBy('createdAt', 'DESC')
        .getMany();

      return res.json({ abonnements: abonnements, total });
    }
    return res.json({ message: 'invalid query' });
  } catch (error) {
    console.log(error);
    return res.json({ message: 'something went wrong, please try again' });
  }
}
