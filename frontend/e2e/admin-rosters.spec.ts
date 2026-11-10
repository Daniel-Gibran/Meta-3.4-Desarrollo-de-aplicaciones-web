import { expect, test } from '@playwright/test'

import {
  crearRoster,
  eliminarRoster,
  filtrarRosters,
  idUnico,
  temporadaUnica,
} from './helpers'

/**
 * Funcionalidades del módulo de rosters (RF-07 a RF-11) en el panel Admin.
 */

test('RF-07: crea un roster y aparece en la tabla', async ({ page }) => {
  const nombre = idUnico('roster')
  const temporada = temporadaUnica()

  await crearRoster(page, nombre, temporada)
  await filtrarRosters(page, temporada)

  const fila = page.getByRole('row', { name: new RegExp(nombre) })
  await expect(fila).toContainText('League of Legends')
  await expect(fila).toContainText('Principal')
  await expect(fila).toContainText(temporada)
  await expect(fila).toContainText('0 / 5')

  await eliminarRoster(page, nombre, temporada)
})

test('RF-10: edita el nombre de un roster', async ({ page }) => {
  const nombre = idUnico('editar')
  const nuevoNombre = `${nombre}_ok`
  const temporada = temporadaUnica()

  await crearRoster(page, nombre, temporada)
  await filtrarRosters(page, temporada)

  await page.getByRole('row', { name: new RegExp(nombre) })
    .getByTitle('Editar')
    .click()

  const dialogo = page.getByRole('dialog')
  await expect(dialogo.getByText('Editar roster')).toBeVisible()

  await dialogo.getByLabel(/Nombre \*/).fill(nuevoNombre)
  await dialogo.getByRole('button', { name: 'Guardar' }).click()

  await expect(page.getByText(/Roster actualizado correctamente/)).toBeVisible()

  await filtrarRosters(page, temporada)
  await expect(page.getByRole('row', { name: new RegExp(nuevoNombre) })).toBeVisible()

  await eliminarRoster(page, nuevoNombre, temporada)
})

test('RF-11: elimina un roster con confirmación', async ({ page }) => {
  const nombre = idUnico('borrar')
  const temporada = temporadaUnica()

  await crearRoster(page, nombre, temporada)
  await filtrarRosters(page, temporada)

  await page.getByRole('row', { name: new RegExp(nombre) })
    .getByTitle('Eliminar')
    .click()

  const dialogo = page.getByRole('dialog')
  await expect(dialogo.getByText('Eliminar roster')).toBeVisible()
  await dialogo.getByRole('button', { name: 'Eliminar' }).click()

  await expect(page.getByText(/Roster eliminado correctamente/)).toBeVisible()
  await expect(page.getByRole('row', { name: new RegExp(nombre) })).toHaveCount(0)
})

test('RF-08: filtra rosters por temporada y limpia el filtro', async ({ page }) => {
  const temporada = temporadaUnica()
  const primero = idUnico('filtro1')
  const segundo = idUnico('filtro2')

  await crearRoster(page, primero, temporada)
  await crearRoster(page, segundo, temporada)

  await filtrarRosters(page, temporada)

  await expect(page.getByRole('row', { name: new RegExp(primero) })).toBeVisible()
  await expect(page.getByRole('row', { name: new RegExp(segundo) })).toBeVisible()

  await page.getByRole('button', { name: 'Limpiar' }).click()
  await expect(page.getByRole('heading', { name: 'Rosters' })).toBeVisible()

  await eliminarRoster(page, primero, temporada)
  await eliminarRoster(page, segundo, temporada)
})
