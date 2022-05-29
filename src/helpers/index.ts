import { Request } from 'express';
import { niveau } from '../entity/User.entity';

export interface UserType {
  id: string;
  username: string;
  niveau: niveau;
  statut: number;
  superAdmin: number;
}

export interface IRequest extends Request {
  user?: UserType;
}
