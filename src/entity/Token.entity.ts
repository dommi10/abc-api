import { PrimaryColumn, Column, Entity } from 'typeorm';

@Entity()
export class Token {
  @PrimaryColumn()
  id!: string;

  @Column({ type: 'text' })
  token!: string;

  @Column({ type: 'text' })
  refreshToken!: string;

  @Column({ type: 'boolean' })
  isUsed!: boolean;

  @Column({ type: 'timestamp', default: () => 'NOW()' })
  createdAt: Date | undefined;
}
