import { Router } from 'express';

import { login, logout, me } from '../controllers/auth.controller.js';
import { autenticar } from '../middlewares/auth.middleware.js';

const router = Router();

// Público: es la puerta de entrada, todavía no hay sesión.
router.post('/login', login);

// Requieren sesión. El logout además exige CSRF porque es un POST.
router.post('/logout', autenticar, logout);
router.get('/me', autenticar, me);

export default router;
