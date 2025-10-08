import { Router } from 'express';
import * as AuthController from '../controllers/AuthController';
import { authenticateToken } from '../middleware/jwtAuth';

const router = Router();

// OAuth routes
router.get('/google', AuthController.googleLogin);
router.get('/google/callback', AuthController.googleCallback);

// JWT routes
router.post('/refresh', AuthController.refreshToken);
router.post('/logout', AuthController.logout);
router.post('/logout-all', authenticateToken, AuthController.logoutAll);

// Protected routes
router.get('/verify', authenticateToken, AuthController.verifyAuth);

export default router;