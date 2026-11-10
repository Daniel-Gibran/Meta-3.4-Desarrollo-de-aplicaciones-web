import { expect, test } from '@playwright/test'

import {
  buscarJugador,
  crearJugador,
  elegirEnSelect,
  eliminarJugador,
  idUnico,
  irAJugadores,
} from './helpers'

/**
 * Funcionalidades del módulo de jugadores (RF-01 a RF-06) en el panel Admin.
 * Cada prueba crea sus propios datos y los elimina al terminar.
 */

test('RF-01: crea un jugador y aparece en la tabla', async ({ page }) => {
  const nickname = idUnico('crear')

  await crearJugador(page, nickname, {
    nombreReal: 'Jugador de prueba',
    pais: 'México',
  })

  await buscarJugador(page, nickname)

  const fila = page.getByRole('row', { name: new RegExp(nickname) })
  await expect(fila).toContainText('Jugador de prueba')
  await expect(fila).toContainText('México')
  await expect(fila).toContainText('Mid')

  await eliminarJugador(page, nickname)
})

test('RF-04: edita el nombre real de un jugador', async ({ page }) => {
  const nickname = idUnico('editar')

  await crearJugador(page, nickname, { nombreReal: 'Nombre original' })
  await buscarJugador(page, nickname)

  await page.getByRole('row', { name: new RegExp(nickname) })
    .getByTitle('Editar')
    .click()

  const dialogo = page.getByRole('dialog')
  await expect(dialogo.getByText('Editar jugador')).toBeVisible()

  await dialogo.getByLabel('Nombre real').fill('Nombre actualizado')
  await dialogo.getByRole('button', { name: 'Guardar' }).click()

  await expect(page.getByText(/Jugador actualizado correctamente/)).toBeVisible()
  await expect(page.getByRole('row', { name: new RegExp(nickname) }))
    .toContainText('Nombre actualizado')

  await eliminarJugador(page, nickname)
})

test('RF-05: elimina un jugador con confirmación', async ({ page }) => {
  const nickname = idUnico('eliminar')

  await crearJugador(page, nickname)
  await buscarJugador(page, nickname)

  await page.getByRole('row', { name: new RegExp(nickname) })
    .getByTitle('Eliminar')
    .click()

  const dialogo = page.getByRole('dialog')
  await expect(dialogo.getByText('Eliminar jugador')).toBeVisible()
  await dialogo.getByRole('button', { name: 'Eliminar' }).click()

  await expect(page.getByText(/Jugador eliminado correctamente/)).toBeVisible()
  await expect(page.getByRole('row', { name: new RegExp(nickname) })).toHaveCount(0)
})

test('RF-06: busca por nickname y filtra por rol', async ({ page }) => {
  const nickname = idUnico('buscar')
  const otro = idUnico('otro')

  await crearJugador(page, nickname)
  await crearJugador(page, otro)

  await irAJugadores(page)
  await buscarJugador(page, nickname)

  await expect(page.getByRole('row', { name: new RegExp(nickname) })).toHaveCount(1)
  await expect(page.getByRole('row', { name: new RegExp(otro) })).toHaveCount(0)

  // El jugador se creó con el rol por defecto (Mid): el filtro debe mantenerlo.
  await elegirEnSelect(page, 'Rol', 'Mid')
  await expect(page.getByRole('row', { name: new RegExp(nickname) })).toBeVisible()

  // "Limpiar" quita los filtros y vuelve a mostrar el listado completo.
  await page.getByRole('button', { name: 'Limpiar' }).click()
  await expect(page.getByRole('textbox', { name: 'Buscar por nickname' })).toHaveValue('')
  await expect(page.getByText('No hay jugadores que coincidan con los filtros')).toHaveCount(0)

  await eliminarJugador(page, nickname)
  await eliminarJugador(page, otro)
})

test('valida que el nickname sea obligatorio antes de enviar', async ({ page }) => {
  await irAJugadores(page)
  await page.getByRole('button', { name: 'Nuevo jugador' }).click()

  const dialogo = page.getByRole('dialog')
  await dialogo.getByRole('button', { name: 'Guardar' }).click()

  await expect(dialogo.getByText('El nickname es obligatorio.')).toBeVisible()

  await dialogo.getByRole('button', { name: 'Cancelar' }).click()
  await expect(dialogo).toBeHidden()
})
