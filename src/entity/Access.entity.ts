import {
  Entity,
  Column,
  PrimaryColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { Entreprise } from './Entreprise.entity';
import { User } from './User.entity';

@Entity()
export class Acces {
  @PrimaryColumn()
  id!: string;

  @Column({ type: 'text' })
  comment!: string;

  @ManyToOne(() => Entreprise, (entreprise) => entreprise.access)
  entreprise!: Entreprise;

  @OneToOne(() => User, (user) => user.access)
  user: User | undefined;

  @ManyToOne(() => User, (user) => user.savedAccess)
  savedBy: User | undefined;

  @Column({ type: 'timestamp', default: () => 'NOW()' })
  createdAt: Date | undefined;
}
