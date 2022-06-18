import {
  all,
  one,
  save,
  update,
  searchCampagne,
} from '../controller/CampagneController';
import * as express from 'express';
import { authenticateToken } from '../middleware';

const campagneRoutes = express.Router();

campagneRoutes.get('/', authenticateToken, all);
campagneRoutes.get('/get/:id', authenticateToken, one);
campagneRoutes.post('/', authenticateToken, save);
campagneRoutes.get('/search', authenticateToken, searchCampagne);
campagneRoutes.put('/:id', authenticateToken, update);
export default campagneRoutes;
