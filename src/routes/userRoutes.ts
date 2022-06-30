import {
  all,
  one,
  save,
  desactivate,
  activate,
  login,
  searchUser,
  me,
  updateNiveau,
  changePassword,
  changePasswordBySMS,
} from '../controller/UserController';
import * as express from 'express';
import { authenticateToken } from '../middleware';

const userRoutes = express.Router();

userRoutes.get('/', authenticateToken, all);
userRoutes.get('/get/:id', authenticateToken, one);
userRoutes.post('/', authenticateToken, save);
userRoutes.post('/login', login);
userRoutes.get('/search', authenticateToken, searchUser);
userRoutes.put('/active/:id', authenticateToken, activate);
userRoutes.put('/niveau/new/:id', authenticateToken, updateNiveau);
userRoutes.get('/password/reset/new/:id', authenticateToken, changePassword);
userRoutes.get('/password/reset/client/new/:username', changePasswordBySMS);
userRoutes.delete('/:id', authenticateToken, desactivate);
userRoutes.get('/me', authenticateToken, me);
export default userRoutes;
