# Meta 3.4 — Gestión de jugadores y rosters con JWT, cookies y CSRF

Aplicación completa de **jugadores y rosters** con frontend Vue 3 + Vuetify y
backend Node.js + Express + Sequelize + MySQL.

Incluye:

- CRUD de jugadores con detalle, búsqueda y filtros.
- CRUD de rosters.
- Asignación de jugadores a rosters como **Titular** o **Suplente**, cambio de
  condición y remoción.
- Autenticación con **JWT en cookie HttpOnly**.
- Autorización por roles **Admin** y **Público**.
- Protección **CSRF** con doble envío de token.
- Vistas de solo lectura para el rol Público y para visitantes sin sesión.

---

## 1. Cuentas de prueba

| Rol | Correo | Contraseña | Acceso |
|-----|--------|------------|--------|
| Admin | `admin@esports.local` | `Admin123!` | CRUD completo |
| Público | `publico@esports.local` | `Publico123!` | Solo lectura |

Los visitantes sin sesión también pueden consultar jugadores y rosters, porque
las lecturas de la API son públicas. Las escrituras siempre exigen Admin.

---

## 2. Cómo ejecutarlo

### Requisitos

- Node.js 18+
- MySQL 8 con la base `esports` de Meta 3.2 (usuario `esports_user`)

### Backend

```bash
cd backend
npm install
cp .env.example .env     # PowerShell: Copy-Item .env.example .env
npm run migrate
npm run seed             # solo la primera vez
npm run dev
```

> Si la base `esports` ya tiene los jugadores de Meta 3.2, `npm run seed`
> fallará por los nicknames duplicados. En ese caso ejecuta solo el seeder de
> usuarios:
>
> ```bash
> npx sequelize-cli db:seed --seed 20261027100000-datos-usuarios.js
> ```

Backend: `http://localhost:3000`

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Frontend: `http://localhost:5173`

### Prueba de humo del backend

Con el backend corriendo:

```bash
node tools/e2e.mjs
```

Cubre 37 escenarios: login, filtros, CRUD de jugadores, CRUD de rosters,
asignaciones, reglas RN-02/RN-03/RN-04, permisos de Público y CSRF.

---

## 3. Rutas del frontend

| Ruta | Acceso | Contenido |
|------|--------|-----------|
| `/` | Público | Redirige a `/consulta/jugadores` |
| `/login` | Público | Inicio de sesión |
| `/consulta/jugadores` | Público | Lista, búsqueda y detalle de jugadores |
| `/consulta/rosters` | Público | Lista y detalle de rosters |
| `/consulta/rosters/:id` | Público | Jugadores del roster en solo lectura |
| `/admin/jugadores` | Admin | CRUD de jugadores |
| `/admin/rosters` | Admin | CRUD de rosters |
| `/admin/rosters/:id` | Admin | Asignaciones Titular/Suplente |

El guard de Vue Router impide entrar a `/admin` sin una sesión con rol
`admin`. La seguridad real, de todas formas, está en el backend.

---

## 4. Funcionalidades del frontend

### Jugadores

- Listar (RF-02).
- Ver detalle consultando `GET /jugadores/:id` (RF-03).
- Crear (RF-01).
- Editar con reemplazo total (RF-04).
- Eliminar (RF-05).
- Buscar por nickname y filtrar por rol y estado (RF-06).
- Mensajes específicos para `400`, `401`, `403`, `404`, `409` y errores de red.

### Rosters

- Listar con filtros por tipo y temporada.
- Crear, editar y eliminar.
- Ver detalle con los jugadores asignados.
- Asignar jugadores como Titular o Suplente.
- Cambiar la condición de un jugador.
- Quitar un jugador del roster sin eliminarlo del sistema.

### Reglas de negocio mostradas en la interfaz

| Regla | Comportamiento |
|-------|----------------|
| RN-01 | Nickname único: el `409` se muestra al usuario |
| RN-02 | Máximo 5 titulares: el `409` explica el límite |
| RN-03 | Un titular por rol de juego: el `409` indica el conflicto |
| RN-04 | Un jugador puede estar en varios rosters |
| RN-05 | Al borrar un roster, los jugadores permanecen |
| — | Un jugador asignado no puede eliminarse: `409` |

---

## 5. API del backend

### Autenticación

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/v1/auth/login` | Valida credenciales y crea las cookies |
| `POST` | `/api/v1/auth/logout` | Elimina las cookies (JWT + CSRF) |
| `GET` | `/api/v1/auth/me` | Devuelve el usuario de la sesión |

### Jugadores

| Método | Endpoint | Acceso |
|--------|----------|--------|
| `GET` | `/api/v1/jugadores` | Público; admite `?rol`, `?estado`, `?search` |
| `GET` | `/api/v1/jugadores/:id` | Público |
| `POST` | `/api/v1/jugadores` | Admin |
| `PUT` | `/api/v1/jugadores/:id` | Admin |
| `DELETE` | `/api/v1/jugadores/:id` | Admin |

### Rosters

| Método | Endpoint | Acceso |
|--------|----------|--------|
| `GET` | `/api/v1/rosters` | Público; admite `?tipo`, `?temporada` |
| `GET` | `/api/v1/rosters/:id` | Público |
| `POST` | `/api/v1/rosters` | Admin |
| `PUT` | `/api/v1/rosters/:id` | Admin |
| `DELETE` | `/api/v1/rosters/:id` | Admin |

### Asignaciones

| Método | Endpoint | Acceso |
|--------|----------|--------|
| `GET` | `/api/v1/rosters/:id/jugadores` | Público |
| `POST` | `/api/v1/rosters/:id/jugadores` | Admin |
| `PUT` | `/api/v1/rosters/:id/jugadores/:id_jugador` | Admin |
| `DELETE` | `/api/v1/rosters/:id/jugadores/:id_jugador` | Admin |

### Auxiliares

`GET /api/v1/roles`, `/estados`, `/tipos-roster` y `/health`.

---

## 6. Autenticación y autorización

### Login

1. El frontend envía email y contraseña a `POST /auth/login`.
2. El backend compara con bcrypt contra `usuarios.password_hash`.
3. Si es correcto, firma un JWT con `sub`, `nombre`, `email`, `rol` y `csrf`.
4. Responde con dos cookies:

| Cookie | HttpOnly | Uso |
|--------|:--------:|-----|
| `jwt_token` | Sí | Identifica la sesión; JavaScript no la lee |
| `csrf_token` | No | El frontend la lee para la cabecera CSRF |

Atributos: `Path=/`, `SameSite=Strict`, `Max-Age=3600000` y `Secure` en
producción.

### Autorización

- `autenticar` valida el JWT y, en métodos inseguros, el token CSRF.
- `soloAdmin` exige `rol === 'admin'`.
- Las lecturas son públicas; las escrituras exigen Admin.
- El frontend usa guards y oculta acciones, pero el backend siempre vuelve a
  validar.

### Códigos de estado

| Código | Uso |
|--------|-----|
| `200` | Lectura, login, actualización |
| `201` | Creación de jugador, roster o asignación |
| `204` | Eliminación correcta |
| `400` | Datos inválidos o filtros incorrectos |
| `401` | Sin sesión, JWT inválido o expirado |
| `403` | Token CSRF inválido o rol insuficiente |
| `404` | Recurso inexistente |
| `409` | Regla de negocio: nickname repetido, 6.º titular, rol duplicado, jugador asignado |
| `413` | Cuerpo mayor a 100 KB |
| `500` | Error interno no controlado |

### Expiración de sesión

Si una petición de datos devuelve `401`, el frontend limpia el estado local y,
si estaba en `/admin`, redirige al login.

---

## 7. Protección CSRF

Se usa el patrón **double submit cookie**:

1. El backend genera un token aleatorio en el login.
2. Lo guarda en la cookie `csrf_token` y dentro del JWT firmado.
3. El interceptor de axios lee la cookie y envía la cabecera `x-csrf-token` en
   cada `POST`, `PUT`, `PATCH` y `DELETE`.
4. El backend compara la cabecera contra el valor firmado en el JWT.

Un sitio externo puede provocar que el navegador envíe la cookie JWT, pero no
puede leer la cookie CSRF ni el JWT para construir la cabecera. Además,
`SameSite=Strict` y el CORS con origen exacto agregan capas de protección.

CORS usa `origin: CLIENT_URL` y `credentials: true`; no se puede usar `*` con
cookies.

---

## 8. Estructura

```text
Meta3.4/
├── backend/
│   ├── src/
│   │   ├── controllers/       # auth, jugadores, rosters, asignaciones
│   │   ├── services/          # reglas de negocio
│   │   ├── middlewares/       # auth.middleware, errorHandler, notFound
│   │   ├── models/            # Sequelize (incluye Usuario)
│   │   ├── routes/            # endpoints y protección por rol
│   │   └── utils/             # ApiError, validaciones, serialización
│   ├── migrations/            # tablas, incluida usuarios
│   ├── seeders/               # datos iniciales y cuentas
│   └── .env.example
├── frontend/
│   └── src/
│       ├── components/        # MensajeError, ConfirmarDialog
│       ├── composables/       # useErrores
│       ├── layouts/           # AdminLayout, ConsultaLayout
│       ├── router/            # rutas y guard de Admin
│       ├── services/          # axios, auth, jugadores, rosters, errores
│       ├── stores/            # estado de sesión
│       ├── views/             # Login, Jugadores, Rosters, RosterDetail
│       └── utils/             # catálogos
│   ├── e2e/                   # suite de Playwright (Meta 4.2)
│   └── playwright.config.ts
├── tools/e2e.mjs              # prueba de humo del backend
└── README.md
```

---

## 9. Decisiones y límites

- Se reutiliza el backend de Meta 3.2 y se le agregó el módulo de usuarios y
  autenticación.
- No se usa API key en el login: una clave dentro del frontend no es secreta.
  Las credenciales de usuario la sustituyen.
- No hay refresh token; la sesión dura 1 hora.
- Logout borra las cookies, pero un JWT copiado seguiría válido hasta `exp`.
- No hay rate limiting ni bloqueo por intentos fallidos.
- El login no está protegido contra login CSRF.
- En producción se debe usar HTTPS, `Secure` en cookies y secretos fuertes.
- Las lecturas de la API son públicas por diseño; las escrituras son solo
  Admin.

---

## 10. Meta 4.2 ΓÇö Pruebas e2e con Playwright

La suite vive en `frontend/e2e/` y usa `@playwright/test`. Cubre el login local,
las funciones del rol P├║blico y todo el CRUD del panel Admin, incluida la regla
RN-03.

### Requisitos

- MySQL con la base `esports` migrada y sembrada.
- Backend y frontend se levantan solos (`webServer` de Playwright); si ya est├ín
  corriendo, los reutiliza.

### Ejecutar

```bash
cd frontend
npx playwright install chromium   # solo la primera vez
npm run test:e2e
```

Para ver la interfaz de Playwright:

```bash
npm run test:e2e:ui
```

### Proyectos

| Proyecto | Qu├⌐ prueba |
|----------|------------|
| `setup` | Inicia sesi├│n como Admin y guarda las cookies en `playwright/.auth/admin.json`. |
| `auth` | Login local, login inv├ílido, logout y protecci├│n CSRF. |
| `admin` | CRUD de jugadores, CRUD de rosters, detalle y asignaciones. |
| `publico` | Consulta sin sesi├│n, rol P├║blico y bloqueo del panel Admin. |

### Cobertura

| Funcionalidad | Prueba |
|---------------|--------|
| Login Admin | `login.spec.ts` |
| Login P├║blico | `login.spec.ts` |
| Login inv├ílido | `login.spec.ts` |
| Logout | `login.spec.ts` |
| JWT HttpOnly + CSRF | `login.spec.ts` |
| Crear jugador | `admin-jugadores.spec.ts` |
| Editar jugador | `admin-jugadores.spec.ts` |
| Eliminar jugador | `admin-jugadores.spec.ts` |
| Buscar / filtrar jugadores | `admin-jugadores.spec.ts` |
| Crear roster | `admin-rosters.spec.ts` |
| Editar roster | `admin-rosters.spec.ts` |
| Eliminar roster | `admin-rosters.spec.ts` |
| Filtrar rosters | `admin-rosters.spec.ts` |
| Detalle de roster | `admin-roster-detalle.spec.ts` |
| Asignar jugador | `admin-roster-detalle.spec.ts` |
| Cambiar Titular/Suplente | `admin-roster-detalle.spec.ts` |
| Quitar jugador | `admin-roster-detalle.spec.ts` |
| RN-03 (rol duplicado) | `admin-roster-detalle.spec.ts` |
| Consulta p├║blica | `publico-consulta.spec.ts` |
| Bloqueo del panel Admin | `publico-consulta.spec.ts` |

Cada prueba crea sus propios jugadores y rosters con un sufijo ├║nico y los
elimina al terminar, para no ensuciar la base de datos.
