import { expect, test as setup } from '@playwright/test'

import { ADMIN, iniciarSesion } from './helpers'

/**
 * Proyecto `setup`: inicia sesión una sola vez como Admin y guarda las cookies
 * en `playwright/.auth/admin.json`. El resto de pruebas de administración
 * reutilizan ese estado, así no repiten el login en cada caso.
 */
setup('inicia sesión como Admin y guarda el estado', async ({ page }) => {
  await iniciarSesion(page, ADMIN)

  await expect(page).toHaveURL(/\/admin\/jugadores/)

  await page.context().storageState({ path: 'playwright/.auth/admin.json' })
})
