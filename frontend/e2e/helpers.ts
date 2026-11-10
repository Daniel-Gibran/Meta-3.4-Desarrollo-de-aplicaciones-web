import { expect, type Page } from '@playwright/test'

/**
 * Utilidades compartidas por las pruebas de la Meta 4.2.
 *
 * La aplicación usa Vuetify, así que los campos se localizan por su etiqueta y
 * los diálogos por su rol. Los datos de prueba llevan un sufijo único para no
 * chocar con los jugadores y rosters que ya existen en MySQL.
 */

export const ADMIN = {
  email: 'admin@esports.local',
  password: 'Admin123!',
}

export const PUBLICO = {
  email: 'publico@esports.local',
  password: 'Publico123!',
}

/** Sufijo único para nicknames y nombres de roster. */
export function idUnico (prefijo: string): string {
  return `${prefijo}_${Date.now().toString(36)}`
}

/**
 * Temporada de cuatro dígitos poco común, para que el filtro de rosters deje
 * ver solo los rosters creados por la prueba.
 */
export function temporadaUnica (): string {
  return String(7000 + (Date.now() % 1000))
}

/** Inicia sesión desde la pantalla de login (sin estado guardado). */
export async function iniciarSesion (
  page: Page,
  { email, password }: { email: string, password: string }
): Promise<void> {
  await page.goto('/login')
  await page.getByLabel('Correo').fill(email)
  await page.getByLabel('Contraseña').fill(password)
  await page.getByRole('button', { name: 'Iniciar sesión' }).click()
}

/** Abre el listado de jugadores en modo Admin. */
export async function irAJugadores (page: Page): Promise<void> {
  await page.goto('/admin/jugadores')
  await expect(page.getByRole('heading', { name: 'Jugadores' })).toBeVisible()
}

/** Abre el listado de rosters en modo Admin. */
export async function irARosters (page: Page): Promise<void> {
  await page.goto('/admin/rosters')
  await expect(page.getByRole('heading', { name: 'Rosters' })).toBeVisible()
}

/**
 * Selecciona una opción de un `v-select` de Vuetify.
 * Primero intenta por rol `option`; si el menú no lo expone, usa la lista.
 */
export async function elegirEnSelect (
  page: Page,
  etiqueta: string,
  texto: string
): Promise<void> {
  await page.getByRole('combobox', { name: etiqueta }).click({ force: true })

  const opcion = page.getByRole('option', { name: new RegExp(texto) })

  if (await opcion.count() > 0) {
    await opcion.first().click()
    return
  }

  await page
    .locator('.v-overlay-container .v-list-item')
    .filter({ hasText: texto })
    .first()
    .click()
}

/** Crea un jugador desde la interfaz y espera la confirmación 201. */
export async function crearJugador (
  page: Page,
  nickname: string,
  datos: { nombreReal?: string, pais?: string } = {}
): Promise<void> {
  await irAJugadores(page)
  await page.getByRole('button', { name: 'Nuevo jugador' }).click()

  const dialogo = page.getByRole('dialog')
  await expect(dialogo).toBeVisible()

  await dialogo.getByLabel(/Nickname/).fill(nickname)

  if (datos.nombreReal) {
    await dialogo.getByLabel('Nombre real').fill(datos.nombreReal)
  }

  if (datos.pais) {
    await dialogo.getByLabel('País').fill(datos.pais)
  }

  await dialogo.getByRole('button', { name: 'Guardar' }).click()
  await expect(page.getByText(/Jugador creado correctamente/)).toBeVisible()
}

/** Filtra la tabla de jugadores por nickname y espera la fila. */
export async function buscarJugador (page: Page, nickname: string): Promise<void> {
  await page.getByRole('textbox', { name: 'Buscar por nickname' }).fill(nickname)
  await page.getByRole('button', { name: 'Buscar', exact: true }).click()
  await expect(page.getByRole('row', { name: new RegExp(nickname) })).toBeVisible()
}

/** Elimina un jugador por su fila y confirma el diálogo. */
export async function eliminarJugador (page: Page, nickname: string): Promise<void> {
  await irAJugadores(page)
  await buscarJugador(page, nickname)

  await page.getByRole('row', { name: new RegExp(nickname) })
    .getByTitle('Eliminar')
    .click()

  await page.getByRole('dialog').getByRole('button', { name: 'Eliminar' }).click()
  await expect(page.getByText(/Jugador eliminado correctamente/)).toBeVisible()
}

/** Crea un roster desde la interfaz y espera la confirmación 201. */
export async function crearRoster (
  page: Page,
  nombre: string,
  temporada: string
): Promise<void> {
  await irARosters(page)
  await page.getByRole('button', { name: 'Nuevo roster' }).click()

  const dialogo = page.getByRole('dialog')
  await expect(dialogo).toBeVisible()

  await dialogo.getByLabel(/Nombre \*/).fill(nombre)
  await dialogo.getByLabel(/Temporada/).fill(temporada)

  await dialogo.getByRole('button', { name: 'Guardar' }).click()
  await expect(page.getByText(/Roster creado correctamente/)).toBeVisible()
}

/** Filtra la tabla de rosters por temporada. */
export async function filtrarRosters (page: Page, temporada: string): Promise<void> {
  await irARosters(page)
  await page.getByRole('textbox', { name: 'Temporada' }).fill(temporada)
  await page.getByRole('button', { name: 'Buscar', exact: true }).click()
}

/** Abre el detalle de un roster desde su fila. */
export async function abrirRoster (
  page: Page,
  nombre: string,
  temporada: string
): Promise<void> {
  await filtrarRosters(page, temporada)
  await page.getByRole('row', { name: new RegExp(nombre) })
    .getByTitle('Ver roster')
    .click()
  await expect(page.getByRole('heading', { name: 'Detalle del roster' })).toBeVisible()
}

/** Elimina un roster por su fila y confirma el diálogo. */
export async function eliminarRoster (
  page: Page,
  nombre: string,
  temporada: string
): Promise<void> {
  await filtrarRosters(page, temporada)

  await page.getByRole('row', { name: new RegExp(nombre) })
    .getByTitle('Eliminar')
    .click()

  await page.getByRole('dialog').getByRole('button', { name: 'Eliminar' }).click()
  await expect(page.getByText(/Roster eliminado correctamente/)).toBeVisible()
}

/** Asigna un jugador al roster abierto, con la condición indicada. */
export async function asignarJugador (
  page: Page,
  nickname: string,
  condicion: 'Titular' | 'Suplente' = 'Suplente'
): Promise<void> {
  await page.getByRole('button', { name: 'Asignar jugador' }).click()

  const dialogo = page.getByRole('dialog')
  await expect(dialogo).toBeVisible()

  await elegirEnSelect(page, 'Jugador *', nickname)

  if (condicion === 'Titular') {
    await elegirEnSelect(page, 'Condición *', 'Titular')
  }

  await dialogo.getByRole('button', { name: 'Asignar' }).click()
  await expect(page.getByText(new RegExp(`Jugador asignado como ${condicion}`))).toBeVisible()
}

/** Fila de la tabla de jugadores asignados, dentro del detalle del roster. */
export function filaEnRoster (page: Page, nickname: string) {
  return page.getByRole('row', { name: new RegExp(nickname) })
}
