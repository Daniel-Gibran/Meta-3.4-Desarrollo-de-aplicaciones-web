import { expect, test } from '@playwright/test'

import {
  abrirRoster,
  asignarJugador,
  crearJugador,
  crearRoster,
  eliminarJugador,
  eliminarRoster,
  filaEnRoster,
  filtrarRosters,
  idUnico,
  temporadaUnica,
} from './helpers'

/**
 * Detalle del roster (RF-09) y asignación de jugadores (RF-12, RF-13),
 * incluida la regla de negocio RN-03.
 */

test('RF-09 y RF-12: abre el detalle y asigna un jugador como Suplente', async ({ page }) => {
  const nickname = idUnico('jug')
  const roster = idUnico('detalle')
  const temporada = temporadaUnica()

  await crearJugador(page, nickname, { nombreReal: 'Jugador de roster' })
  await crearRoster(page, roster, temporada)
  await abrirRoster(page, roster, temporada)

  await expect(page.getByText(roster)).toBeVisible()
  await expect(page.getByText(/Titulares 0 \/ 5/)).toBeVisible()

  await asignarJugador(page, nickname, 'Suplente')

  const fila = filaEnRoster(page, nickname)
  await expect(fila).toContainText('Suplente')
  await expect(page.getByText(/Jugadores 1/)).toBeVisible()

  // Limpieza: primero se quita del roster y luego se borran los datos.
  await fila.getByTitle('Quitar del roster').click()
  await page.getByRole('dialog').getByRole('button', { name: 'Quitar' }).click()
  await expect(page.getByText(/Jugador removido del roster/)).toBeVisible()

  await eliminarRoster(page, roster, temporada)
  await eliminarJugador(page, nickname)
})

test('RF-12: cambia la condición de Suplente a Titular', async ({ page }) => {
  const nickname = idUnico('titular')
  const roster = idUnico('cambio')
  const temporada = temporadaUnica()

  await crearJugador(page, nickname)
  await crearRoster(page, roster, temporada)
  await abrirRoster(page, roster, temporada)

  await asignarJugador(page, nickname, 'Suplente')

  await filaEnRoster(page, nickname)
    .getByRole('button', { name: 'Hacer titular' })
    .click()

  await expect(page.getByText('Condición actualizada a Titular (200).')).toBeVisible()
  await expect(filaEnRoster(page, nickname)).toContainText('Titular')
  await expect(page.getByText(/Titulares 1 \/ 5/)).toBeVisible()

  await eliminarRoster(page, roster, temporada)
  await eliminarJugador(page, nickname)
})

test('RF-13: quita un jugador del roster sin eliminarlo del sistema', async ({ page }) => {
  const nickname = idUnico('quitar')
  const roster = idUnico('quitar')
  const temporada = temporadaUnica()

  await crearJugador(page, nickname)
  await crearRoster(page, roster, temporada)
  await abrirRoster(page, roster, temporada)

  await asignarJugador(page, nickname, 'Suplente')

  await filaEnRoster(page, nickname)
    .getByTitle('Quitar del roster')
    .click()

  const dialogo = page.getByRole('dialog')
  await expect(dialogo.getByText('Quitar jugador del roster')).toBeVisible()
  await dialogo.getByRole('button', { name: 'Quitar' }).click()

  await expect(page.getByText(/Jugador removido del roster/)).toBeVisible()
  await expect(page.getByText('Este roster todavía no tiene jugadores asignados')).toBeVisible()

  // El jugador sigue existiendo en el sistema: se comprueba contra la API.
  const encontrados = await page.evaluate(async (nick) => {
    const r = await fetch(
      `http://localhost:3000/api/v1/jugadores?search=${encodeURIComponent(nick)}`,
      { credentials: 'include' }
    )
    const datos = await r.json()
    return datos.count
  }, nickname)

  expect(encontrados, 'el jugador no debe eliminarse al quitarlo del roster').toBe(1)

  await eliminarRoster(page, roster, temporada)
  await eliminarJugador(page, nickname)
})

test('RN-03: rechaza dos titulares con el mismo rol en un roster', async ({ page }) => {
  const primero = idUnico('mid1')
  const segundo = idUnico('mid2')
  const roster = idUnico('rn03')
  const temporada = temporadaUnica()

  // Ambos se crean con el rol por defecto Mid.
  await crearJugador(page, primero)
  await crearJugador(page, segundo)
  await crearRoster(page, roster, temporada)
  await abrirRoster(page, roster, temporada)

  await asignarJugador(page, primero, 'Suplente')
  await asignarJugador(page, segundo, 'Suplente')

  await filaEnRoster(page, primero)
    .getByRole('button', { name: 'Hacer titular' })
    .click()
  await expect(page.getByText('Condición actualizada a Titular (200).')).toBeVisible()

  await filaEnRoster(page, segundo)
    .getByRole('button', { name: 'Hacer titular' })
    .click()

  await expect(page.getByText('El roster ya tiene un titular en el rol Mid')).toBeVisible()
  await expect(filaEnRoster(page, segundo)).toContainText('Suplente')

  // Limpieza: borrar el roster elimina las asignaciones y deja libres a los jugadores.
  await filtrarRosters(page, temporada)
  await eliminarRoster(page, roster, temporada)
  await eliminarJugador(page, primero)
  await eliminarJugador(page, segundo)
})
