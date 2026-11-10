import { expect, test } from '@playwright/test'

import { PUBLICO, iniciarSesion } from './helpers'

/**
 * Funcionalidades del rol Público: consulta de solo lectura, sin acciones de
 * administración (RF-02, RF-03, RF-08, RF-09 en modo lectura).
 */

test('consulta jugadores sin iniciar sesión y no ve acciones de Admin', async ({ page }) => {
  await page.goto('/consulta/jugadores')

  await expect(page.getByRole('heading', { name: 'Jugadores' })).toBeVisible()
  await expect(page.getByText('Consulta de jugadores en modo lectura.')).toBeVisible()
  await expect(page.locator('.v-data-table')).toBeVisible()

  await expect(page.getByRole('button', { name: 'Nuevo jugador' })).toHaveCount(0)
  await expect(page.getByTitle('Editar')).toHaveCount(0)
  await expect(page.getByTitle('Eliminar')).toHaveCount(0)
})

test('consulta rosters sin iniciar sesión y no ve acciones de Admin', async ({ page }) => {
  await page.goto('/consulta/rosters')

  await expect(page.getByRole('heading', { name: 'Rosters' })).toBeVisible()
  await expect(page.getByText('Consulta de rosters en modo lectura.')).toBeVisible()
  await expect(page.locator('.v-data-table')).toBeVisible()

  await expect(page.getByRole('button', { name: 'Nuevo roster' })).toHaveCount(0)
  await expect(page.getByTitle('Editar')).toHaveCount(0)
  await expect(page.getByTitle('Eliminar')).toHaveCount(0)
})

test('un visitante no puede entrar al panel Admin', async ({ page }) => {
  await page.goto('/admin/jugadores')

  await expect(page).toHaveURL(/\/login/)
  await expect(page.getByRole('button', { name: 'Iniciar sesión' })).toBeVisible()
})

test('el rol Público entra a consulta y no puede abrir el panel Admin', async ({ page }) => {
  await iniciarSesion(page, PUBLICO)

  await expect(page).toHaveURL(/\/consulta\/jugadores/)
  await expect(page.getByRole('button', { name: 'Nuevo jugador' })).toHaveCount(0)

  await page.goto('/admin/jugadores')
  await expect(page).toHaveURL(/\/consulta\/jugadores/)
  await expect(page.getByRole('button', { name: 'Nuevo jugador' })).toHaveCount(0)
})
