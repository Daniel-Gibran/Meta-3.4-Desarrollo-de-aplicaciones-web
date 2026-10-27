/**
 * Configuración de la aplicación Express.
 *
 * El orden de los middlewares es lo que define el comportamiento global:
 *
 *   1. CORS          → para que el frontend pueda consumir la API con cookies.
 *   2. express.json  → para interpretar el body de las peticiones.
 *   3. cookieParser  → para leer el JWT y el token CSRF de las cookies.
 *   4. Logger        → para ver qué se pidió y con qué código respondió.
 *   5. Rutas         → /api/v1
 *   6. notFound      → 404 para rutas no definidas (SIEMPRE después de las rutas).
 *   7. errorHandler  → traduce cualquier error a JSON (SIEMPRE al final, y con
 *                      cuatro parámetros: sin `next` Express no lo reconoce).
 *
 * `app.js` se separa de `server.js` para poder importar la aplicación
 * configurada en pruebas sin levantar un servidor real.
 */

import 'dotenv/config';

import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';

import rutasApi from './routes/index.js';
import notFound from './middlewares/notFound.js';
import errorHandler from './middlewares/errorHandler.js';
import { MAX_TITULARES } from './utils/catalogos.js';

const app = express();

// ---------------------------------------------------------------------------
// 1. CORS
// ---------------------------------------------------------------------------
// `credentials: true` es obligatorio para que el navegador envíe y acepte las
// cookies de sesión. Con credenciales no se puede usar `origin: '*'`: hay que
// indicar explícitamente el origen del frontend.
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// ---------------------------------------------------------------------------
// 2. Interpretación del cuerpo de la petición y de las cookies
// ---------------------------------------------------------------------------
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ---------------------------------------------------------------------------
// 3. Registro de peticiones
// ---------------------------------------------------------------------------
app.use((req, res, next) => {
  const inicio = Date.now();

  res.on('finish', () => {
    const duracion = Date.now() - inicio;
    const marca = res.statusCode >= 500 ? '✖' : res.statusCode >= 400 ? '▲' : '✔';
    console.log(`${marca} ${req.method} ${req.originalUrl} → ${res.statusCode} (${duracion}ms)`);
  });

  next();
});

// ---------------------------------------------------------------------------
// Índice del API: qué hay y dónde está la documentación
// ---------------------------------------------------------------------------
app.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    name: 'API de Jugadores y Rosters',
    version: '1.0.0',
    documentacion: {
      swaggerUI: '/docs',
      openapi: '/docs/openapi.yaml',
    },
    reglasNegocio: {
      RN01: 'El nickname de un jugador debe ser único',
      RN02: `Un roster puede tener como máximo ${MAX_TITULARES} titulares`,
      RN03: 'No puede haber dos titulares con el mismo rol en un roster',
      RN04: 'Un jugador puede estar en varios rosters',
      RN05: 'Al eliminar un roster, los jugadores permanecen en el sistema',
    },
    endpoints: {
      jugadores: [
        'GET    /api/v1/jugadores',
        'GET    /api/v1/jugadores/:id',
        'POST   /api/v1/jugadores',
        'PUT    /api/v1/jugadores/:id',
        'DELETE /api/v1/jugadores/:id',
      ],
      rosters: [
        'GET    /api/v1/rosters',
        'GET    /api/v1/rosters/:id',
        'POST   /api/v1/rosters',
        'PUT    /api/v1/rosters/:id',
        'DELETE /api/v1/rosters/:id',
      ],
      asignaciones: [
        'GET    /api/v1/rosters/:id/jugadores',
        'POST   /api/v1/rosters/:id/jugadores',
        'PUT    /api/v1/rosters/:id/jugadores/:id_jugador',
        'DELETE /api/v1/rosters/:id/jugadores/:id_jugador',
      ],
      auxiliares: [
        'GET    /api/v1/roles',
        'GET    /api/v1/estados',
        'GET    /api/v1/tipos-roster',
        'GET    /api/v1/health',
      ],
    },
  });
});

// ---------------------------------------------------------------------------
// 4. Rutas de la API
// ---------------------------------------------------------------------------
app.use('/api/v1', rutasApi);

// ---------------------------------------------------------------------------
// 5. Ruta no encontrada
// ---------------------------------------------------------------------------
app.use(notFound);

// ---------------------------------------------------------------------------
// 6. Manejo de errores
// ---------------------------------------------------------------------------
app.use(errorHandler);

export default app;