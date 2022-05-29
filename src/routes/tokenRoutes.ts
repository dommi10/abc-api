import * as express from 'express';
import { clearSession, refreshUserToken } from '../controller/TokenController';
import { authenticateToken } from '../middleware';

const tokenRoutes = express.Router();

// define routes for get users
tokenRoutes.post('/refresh', refreshUserToken);
tokenRoutes.post('/deleteSession', authenticateToken, clearSession);

export default tokenRoutes;
