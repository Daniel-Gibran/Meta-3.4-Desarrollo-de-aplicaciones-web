import { Router } from 'express';

import { login, logout, me } from '../controllers/auth.controller.js';
import { callback, iniciar } from '../controllers/googleAuth.controller.js';
import { autenticar } from '../middlewares/auth.middleware.js';

const router = Router();

// ---------------------------------------------------------------------------
// Login local (Meta 3.4): correo y contraseña.
// ---------------------------------------------------------------------------

// Público: es la puerta de entrada, todavía no hay sesión.
router.post('/login', login);

// Requieren sesión. El logout además exige CSRF porque es un POST.
router.post('/logout', autenticar, logout);
router.get('/me', autenticar, me);

// ---------------------------------------------------------------------------
// Login con Google OAuth 2.0 (Meta 4.1).
//
// Son públicos porque son el mecanismo de entrada: el usuario todavía no tiene
// sesión. El callback crea las mismas cookies que el login local.
// ---------------------------------------------------------------------------

router.get('/google/login', iniciar);
router.get('/google/callback', callback);

export default router;
