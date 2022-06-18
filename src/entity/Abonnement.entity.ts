import { Entity, Column, PrimaryColumn, ManyToOne, OneToMany } from 'typeorm';
import { Entreprise } from './Entreprise.entity';
import { Forfait } from './Forfait.entity';
import { Offres } from './Offres.entity';
import { User } from './User.entity';

@Entity()
export class Abonnement {
  @PrimaryColumn()
  id!: string;

  @Column({ type: 'date' })
  dateDebut!: Date;

  @Column({ type: 'date' })
  dateFin!: Date;

  @Column({ type: 'int', default: 0 })
  statut!: number;

  @Column({ type: 'text' })
  comment!: string;

  @ManyToOne(() => User, (user) => user.abonnements)
  savedBy: User | undefined;

  @ManyToOne(() => User, (user) => user.activateAbonnements)
  activateBy: User | undefined;

  @ManyToOne(() => Entreprise, (entreprise) => entreprise.abonnements)
  entreprise: Entreprise | undefined;

  @ManyToOne(() => Offres, (offres) => offres.abonnements)
  offre: Offres | undefined;

  @OneToMany(() => Forfait, (abonnements) => abonnements.abonnements)
  forfaits: Forfait[] | undefined;

  @Column({ type: 'timestamp', default: () => 'NOW()' })
  createdAt: Date | undefined;
}
