/**
 * Rutas de rosters.
 *
 * Montaje: /api/v1/rosters
 */

import { Router } from 'express';

import rostersController from '../controllers/rosters.controller.js';
import { autenticar, soloAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

// Lecturas públicas.
// RF-08
router.get('/', rostersController.listar);

// RF-09
router.get('/:id', rostersController.obtenerPorId);

// Escrituras solo para Admin.
// RF-07
router.post('/', autenticar, soloAdmin, rostersController.crear);

// RF-10
router.put('/:id', autenticar, soloAdmin, rostersController.actualizar);

// RF-11
router.delete('/:id', autenticar, soloAdmin, rostersController.eliminar);

export default router;