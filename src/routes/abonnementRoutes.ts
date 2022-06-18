import {
  all,
  one,
  save,
  activate,
  searchAbonnement,
} from '../controller/AbonnementController';
import * as express from 'express';
import { authenticateToken } from '../middleware';

const campagneRoutes = express.Router();

campagneRoutes.get('/', authenticateToken, all);
campagneRoutes.get('/get/:id', authenticateToken, one);
campagneRoutes.post('/', authenticateToken, save);
campagneRoutes.get('/search', authenticateToken, searchAbonnement);
campagneRoutes.put('/activate/:id', authenticateToken, activate);
export default campagneRoutes;
