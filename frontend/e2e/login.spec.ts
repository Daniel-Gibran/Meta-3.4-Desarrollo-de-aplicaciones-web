import { expect, test } from '@playwright/test'

import { ADMIN, PUBLICO, iniciarSesion } from './helpers'

/**
 * Funcionalidad 1: inicio y cierre de sesión local (JWT en cookie HttpOnly).
 * Funcionalidad 2: protección CSRF de las escrituras.
 *
 * Este archivo corre en el proyecto `auth`, sin estado guardado, porque
 * justamente prueba el flujo de entrada.
 */

test('el Admin inicia sesión y llega al panel de administración', async ({ page }) => {
  await iniciarSesion(page, ADMIN)

  await expect(page).toHaveURL(/\/admin\/jugadores/)
  await expect(page.getByRole('heading', { name: 'Jugadores' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Nuevo jugador' })).toBeVisible()
})

test('el usuario Público inicia sesión y llega a la vista de consulta', async ({ page }) => {
  await iniciarSesion(page, PUBLICO)

  await expect(page).toHaveURL(/\/consulta\/jugadores/)
  await expect(page.getByRole('button', { name: 'Nuevo jugador' })).toHaveCount(0)
})

test('credenciales incorrectas muestran un mensaje de error', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Correo').fill('admin@esports.local')
  await page.getByLabel('Contraseña').fill('incorrecta')
  await page.getByRole('button', { name: 'Iniciar sesión' }).click()

  await expect(page.getByText('Email o contraseña incorrectos')).toBeVisible()
  await expect(page).toHaveURL(/\/login/)
})

test('el logout borra la sesión y regresa al login', async ({ page }) => {
  await iniciarSesion(page, ADMIN)
  await expect(page).toHaveURL(/\/admin\/jugadores/)

  await page.getByRole('button', { name: 'Salir' }).click()

  await expect(page).toHaveURL(/\/login/)

  // Después del logout, una ruta protegida vuelve a mandar al login.
  await page.goto('/admin/jugadores')
  await expect(page).toHaveURL(/\/login/)
})

test('la cookie del JWT es HttpOnly y una escritura sin CSRF se rechaza', async ({ page, context }) => {
  await iniciarSesion(page, ADMIN)
  await expect(page).toHaveURL(/\/admin\/jugadores/)

  const cookies = await context.cookies()
  const jwt = cookies.find((cookie) => cookie.name === 'jwt_token')
  const csrf = cookies.find((cookie) => cookie.name === 'csrf_token')

  expect(jwt, 'debe existir la cookie jwt_token').toBeTruthy()
  expect(jwt?.httpOnly, 'el JWT debe ser HttpOnly').toBe(true)
  expect(csrf, 'debe existir la cookie csrf_token').toBeTruthy()
  expect(csrf?.httpOnly, 'el CSRF debe ser legible por el frontend').toBe(false)

  // Misma petición que hace la aplicación, pero sin la cabecera x-csrf-token.
  const respuesta = await page.evaluate(async () => {
    const r = await fetch('http://localhost:3000/api/v1/jugadores', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nickname: 'sin_csrf',
        nombre_real: 'Prueba CSRF',
        pais: 'México',
        rol: 'Mid',
        estado: 'activo',
      }),
    })

    return { status: r.status, cuerpo: await r.json() }
  })

  expect(respuesta.status, 'sin cabecera CSRF la API debe responder 403').toBe(403)
  expect(String(respuesta.cuerpo.message)).toContain('CSRF')
})
