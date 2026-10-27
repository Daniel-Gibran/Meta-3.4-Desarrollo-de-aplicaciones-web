import api from './api'

import type { DatosJugador, FiltrosJugadores, Jugador } from '@/types'

// GET /jugadores con filtros opcionales por rol, estado y búsqueda.
export async function listarJugadores (filtros: FiltrosJugadores = {}): Promise<Jugador[]> {
  const { data } = await api.get<{ data: Jugador[] }>('/jugadores', { params: filtros })

  return data.data
}

// GET /jugadores/:id
export async function obtenerJugador (id: number): Promise<Jugador> {
  const { data } = await api.get<{ data: Jugador }>(`/jugadores/${id}`)

  return data.data
}

// POST /jugadores
export async function crearJugador (datos: DatosJugador): Promise<Jugador> {
  const { data } = await api.post<{ data: Jugador }>('/jugadores', datos)

  return data.data
}

// PUT /jugadores/:id
export async function actualizarJugador (id: number, datos: DatosJugador): Promise<Jugador> {
  const { data } = await api.put<{ data: Jugador }>(`/jugadores/${id}`, datos)

  return data.data
}

// DELETE /jugadores/:id
export async function eliminarJugador (id: number): Promise<void> {
  await api.delete(`/jugadores/${id}`)
}
