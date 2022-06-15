import {
  all,
  one,
  save,
  update,
  searchOffre,
} from '../controller/OffresController';
import * as express from 'express';
import { authenticateToken } from '../middleware';

const offreRoutes = express.Router();

offreRoutes.get('/', authenticateToken, all);
offreRoutes.get('/get/:id', authenticateToken, one);
offreRoutes.post('/', authenticateToken, save);
offreRoutes.get('/search', authenticateToken, searchOffre);
offreRoutes.put('/:id', authenticateToken, update);
export default offreRoutes;
