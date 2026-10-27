/**
 * Rutas de jugadores.
 *
 * Este archivo solo declara qué combinación de verbo y ruta existe, y a qué
 * controlador corresponde. No contiene lógica: toda la lógica de negocio
 * vive en los services.
 *
 * Montaje: /api/v1/jugadores
 */

import { Router } from 'express';

import jugadoresController from '../controllers/jugadores.controller.js';
import { autenticar, soloAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

// Lecturas públicas: el rol Público puede consultar.
// RF-02, RF-06
router.get('/', jugadoresController.listar);

// RF-03
router.get('/:id', jugadoresController.obtenerPorId);

// Escrituras solo para Admin. Cada una exige sesión (JWT + CSRF) y rol admin.
// RF-01
router.post('/', autenticar, soloAdmin, jugadoresController.crear);

// RF-04
router.put('/:id', autenticar, soloAdmin, jugadoresController.actualizar);

// RF-05
router.delete('/:id', autenticar, soloAdmin, jugadoresController.eliminar);

export default router;