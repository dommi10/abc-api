import { Entity, Column, PrimaryColumn, OneToMany, ManyToOne } from 'typeorm';
import { Abonnement } from './Abonnement.entity';
import { Acces } from './Access.entity';
import { Campagne } from './Campagne.entity';
import { User } from './User.entity';

@Entity()
export class Entreprise {
  @PrimaryColumn()
  id!: string;

  @Column()
  nom!: string;

  @Column()
  type!: string;

  @Column()
  rccm!: string;

  @Column()
  impot!: string;

  @Column()
  idnat!: string;

  @Column()
  adresse!: string;

  @Column()
  ville!: string;

  @Column()
  province!: string;

  @Column()
  senderName!: string;

  @Column()
  nomRepresentant!: string;

  @Column()
  fonction!: string;

  @Column()
  tel!: string;

  @Column({ type: 'text' })
  comment!: string;

  @OneToMany(() => Acces, (access) => access.entreprise)
  access: Acces[] | undefined;

  @OneToMany(() => Campagne, (campagnes) => campagnes.entreprise)
  campagnes: Campagne[] | undefined;

  @OneToMany(() => Abonnement, (campagnes) => campagnes.entreprise)
  abonnements: Abonnement[] | undefined;

  @ManyToOne(() => User, (user) => user.savedEntreprise)
  savedBy: User | undefined;

  @Column({ type: 'timestamp', default: () => 'NOW()' })
  createdAt: Date | undefined;
}
