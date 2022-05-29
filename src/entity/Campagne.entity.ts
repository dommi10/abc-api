import { Entity, Column, PrimaryColumn, ManyToOne, OneToMany } from 'typeorm';
import { Entreprise } from './Entreprise.entity';
import { Transactions } from './Transactions.entity';
import { User } from './User.entity';

@Entity()
export class Campagne {
  @PrimaryColumn()
  id!: string;

  @Column()
  title!: string;

  @Column({ type: 'text' })
  message!: string;

  @Column({ type: 'text' })
  comment!: string;

  @ManyToOne(() => Entreprise, (Entreprise) => Entreprise.campagnes)
  entreprise: Entreprise | undefined;

  @ManyToOne(() => User, (User) => User.campagnes)
  savedBy: User | undefined;

  @OneToMany(() => Transactions, (transaction) => transaction.campagne)
  transactions: Transactions[] | undefined;

  @Column({ type: 'timestamp', default: () => 'NOW()' })
  createdAt: Date | undefined;
}
