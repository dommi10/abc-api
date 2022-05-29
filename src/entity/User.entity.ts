import { Entity, Column, PrimaryColumn, OneToMany, OneToOne } from 'typeorm';
import { Abonnement } from './Abonnement.entity';
import { Acces } from './Access.entity';
import { Campagne } from './Campagne.entity';
import { Entreprise } from './Entreprise.entity';
import { Forfait } from './Forfait.entity';
import { Offres } from './Offres.entity';
import { Transactions } from './Transactions.entity';

export enum niveau {
  ADMIN = 'ADMIN',
  USER = 'USER',
  VALIDATEUR = 'VALIDATEUR',
}

@Entity()
export class User {
  @PrimaryColumn()
  id!: string;

  @Column()
  username!: string;

  @Column()
  password!: string;

  @Column({ type: 'enum', enum: niveau, default: niveau.USER })
  niveau!: niveau;

  @Column({ type: 'int', default: 0 })
  statut!: number;

  @Column({ type: 'int', default: 0 })
  isSuper!: number;

  @Column({ type: 'text' })
  comment!: string;

  @OneToOne(() => Acces, (access) => access.user)
  access: Acces | undefined;

  @OneToMany(() => Acces, (access) => access.savedBy)
  savedAccess: Acces[] | undefined;

  @OneToMany(() => Entreprise, (savedEntreprise) => savedEntreprise.savedBy)
  savedEntreprise: Entreprise[] | undefined;

  @OneToMany(() => Campagne, (campagne) => campagne.savedBy)
  campagnes: Campagne[] | undefined;

  @OneToMany(() => Offres, (offres) => offres.savedBy)
  offres: Offres[] | undefined;

  @OneToMany(() => Transactions, (transactions) => transactions.savedBy)
  transactions: Transactions[] | undefined;

  @OneToMany(() => Abonnement, (abonnements) => abonnements.savedBy)
  abonnements: Abonnement[] | undefined;

  @OneToMany(() => Forfait, (forfaits) => forfaits.savedBy)
  forfaits: Forfait[] | undefined;

  @OneToMany(() => Abonnement, (abonnements) => abonnements.activateBy)
  activateAbonnements: Abonnement[] | undefined;

  @Column({ type: 'timestamp', default: () => 'NOW()' })
  createdAt: Date | undefined;
}
