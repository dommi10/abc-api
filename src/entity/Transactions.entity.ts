import { Entity, Column, PrimaryColumn, ManyToOne } from 'typeorm';
import { Campagne } from './Campagne.entity';
import { Forfait } from './Forfait.entity';
import { User } from './User.entity';

@Entity()
export class Transactions {
  @PrimaryColumn()
  id!: string;

  @Column({ type: 'bigint', default: () => '0' })
  contactNumber!: number;

  @Column({ type: 'bigint', default: () => '0' })
  success!: number;

  @Column({ type: 'bigint', default: () => '0' })
  messageNumber!: number;

  @Column()
  operator!: string;

  @Column({ type: 'text' })
  comment!: string;

  @ManyToOne(() => User, (User) => User.transactions)
  savedBy: User | undefined;

  @ManyToOne(() => Campagne, (campagne) => campagne.transactions)
  campagne: Campagne | undefined;

  @ManyToOne(() => Forfait, (abonnements) => abonnements.transactions)
  forfait: Forfait | undefined;

  @Column({ type: 'timestamp', default: () => 'NOW()' })
  createdAt: Date | undefined;
}
