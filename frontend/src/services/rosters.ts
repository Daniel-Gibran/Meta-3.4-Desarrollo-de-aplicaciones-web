import api from './api'

import type {
  DatosAsignacion,
  DatosRoster,
  FiltrosRosters,
  Roster,
  RosterDetalle,
  RolEnRoster,
} from '@/types'

// GET /rosters con filtros opcionales por tipo y temporada.
export async function listarRosters (filtros: FiltrosRosters = {}): Promise<Roster[]> {
  const { data } = await api.get<{ data: Roster[] }>('/rosters', { params: filtros })

  return data.data
}

// GET /rosters/:id (incluye los jugadores asignados).
export async function obtenerRoster (id: number): Promise<RosterDetalle> {
  const { data } = await api.get<{ data: RosterDetalle }>(`/rosters/${id}`)

  return data.data
}

// POST /rosters
export async function crearRoster (datos: DatosRoster): Promise<Roster> {
  const { data } = await api.post<{ data: Roster }>('/rosters', datos)

  return data.data
}

// PUT /rosters/:id
export async function actualizarRoster (id: number, datos: DatosRoster): Promise<Roster> {
  const { data } = await api.put<{ data: Roster }>(`/rosters/${id}`, datos)

  return data.data
}

// DELETE /rosters/:id
export async function eliminarRoster (id: number): Promise<void> {
  await api.delete(`/rosters/${id}`)
}

// POST /rosters/:id/jugadores
export async function asignarJugador (rosterId: number, datos: DatosAsignacion): Promise<void> {
  await api.post(`/rosters/${rosterId}/jugadores`, datos)
}

// PUT /rosters/:id/jugadores/:id_jugador
export async function cambiarRolEnRoster (
  rosterId: number,
  jugadorId: number,
  rol: RolEnRoster,
): Promise<void> {
  await api.put(`/rosters/${rosterId}/jugadores/${jugadorId}`, {
    rol_en_roster: rol,
  })
}

// DELETE /rosters/:id/jugadores/:id_jugador
export async function quitarJugador (rosterId: number, jugadorId: number): Promise<void> {
  await api.delete(`/rosters/${rosterId}/jugadores/${jugadorId}`)
}
