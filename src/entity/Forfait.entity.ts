import { Entity, Column, PrimaryColumn, ManyToOne, OneToMany } from 'typeorm';
import { Abonnement } from './Abonnement.entity';
import { Transactions } from './Transactions.entity';
import { User } from './User.entity';

@Entity()
export class Forfait {
  @PrimaryColumn()
  id!: string;

  @Column({ type: 'bigint', default: () => '0' })
  initial!: number;

  @Column({ type: 'bigint', default: () => '0' })
  entree!: number;

  @Column({ type: 'bigint', default: () => '0' })
  sortie!: number;

  @Column({ type: 'text' })
  comment!: string;

  @ManyToOne(() => Abonnement, (abonnements) => abonnements.forfaits)
  abonnements: Abonnement | undefined;

  @ManyToOne(() => User, (user) => user.forfaits)
  savedBy: User | undefined;

  @OneToMany(() => Transactions, (transaction) => transaction.forfait)
  transactions: Transactions[] | undefined;

  @Column({ type: 'timestamp', default: () => 'NOW()' })
  createdAt: Date | undefined;
}
