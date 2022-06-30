import {
  all,
  one,
  save,
  update,
  searchEntreprise,
  createDiffusion,
  sendDiffusion,
} from '../controller/EntrepriseController';
import * as express from 'express';
import { authenticateToken } from '../middleware';

const entrepriseRoutes = express.Router();

entrepriseRoutes.get('/', authenticateToken, all);
entrepriseRoutes.get('/get/:id', authenticateToken, one);
entrepriseRoutes.post('/', authenticateToken, save);
entrepriseRoutes.post('/diffusion', authenticateToken, createDiffusion);
entrepriseRoutes.post('/diffusion/validate', authenticateToken, sendDiffusion);
entrepriseRoutes.get('/search', authenticateToken, searchEntreprise);
entrepriseRoutes.put('/:id', authenticateToken, update);
export default entrepriseRoutes;
