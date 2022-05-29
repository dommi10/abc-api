import { Entity, Column, PrimaryColumn, ManyToOne, OneToMany } from 'typeorm';
import { User } from './User.entity';

@Entity()
export class Offres {
  @PrimaryColumn()
  id!: string;

  @Column()
  designation!: string;

  @Column({ type: 'bigint', default: () => '0' })
  nombre!: number;

  @Column({ type: 'float', default: () => '0' })
  frais!: number;

  @Column({ type: 'int', default: 0 })
  statut!: number;

  @Column({ type: 'text' })
  comment!: string;

  @ManyToOne(() => User, (User) => User.offres)
  savedBy: User | undefined;

  @Column({ type: 'timestamp', default: () => 'NOW()' })
  createdAt: Date | undefined;
}
