/**
 * Rutas de asignación de jugadores a rosters.
 *
 * Montaje: /api/v1/rosters/:id/jugadores
 *
 * El `mergeParams` es imprescindible: sin él Express no pondría `:id` del
 * router padre en `req.params`, y el controlador no podría saber de qué roster
 * se trata. Es un detalle fácil de olvidar y que solo se detecta al probar.
 *
 * Este archivo se declara separado de rosters.routes.js para que las rutas que
 * necesitan `:id` de roster queden juntas y en un orden explícito.
 */

import { Router } from 'express';

import asignacionesController from '../controllers/asignaciones.controller.js';
import { autenticar, soloAdmin } from '../middlewares/auth.middleware.js';

const router = Router({ mergeParams: true });

// Lectura pública.
// RF-09, RF-12
router.get('/', asignacionesController.listarJugadores);

// Escrituras solo para Admin.
// RF-12
router.post('/', autenticar, soloAdmin, asignacionesController.asignar);

// RF-12 (cambio de Titular/Suplente)
router.put('/:id_jugador', autenticar, soloAdmin, asignacionesController.cambiarRol);

// RF-13
router.delete('/:id_jugador', autenticar, soloAdmin, asignacionesController.quitar);

export default router;