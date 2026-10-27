export type RolJugador = 'Top' | 'Jungle' | 'Mid' | 'ADC' | 'Support'
export type EstadoJugador = 'activo' | 'inactivo'
export type TipoRoster = 'Principal' | 'Academy'
export type RolEnRoster = 'Titular' | 'Suplente'

export interface Jugador {
  id: number
  nickname: string
  nombre_real: string | null
  pais: string | null
  rol: RolJugador
  estado: EstadoJugador
}

export interface JugadorEnRoster extends Jugador {
  rol_en_roster: RolEnRoster
}

export interface Roster {
  id: number
  nombre: string
  juego: string
  tipo: TipoRoster
  temporada: string
  cantidadJugadores: number
  cantidadTitulares: number
}

export interface RosterDetalle {
  id: number
  nombre: string
  juego: string
  tipo: TipoRoster
  temporada: string
  jugadores: JugadorEnRoster[]
}

export interface FiltrosJugadores {
  rol?: RolJugador
  estado?: EstadoJugador
  search?: string
}

export interface FiltrosRosters {
  tipo?: TipoRoster
  temporada?: string
}

export interface DatosJugador {
  nickname: string
  nombre_real: string | null
  pais: string | null
  rol: RolJugador
  estado: EstadoJugador
}

export interface DatosRoster {
  nombre: string
  juego: string
  tipo: TipoRoster
  temporada: string
}

export interface DatosAsignacion {
  jugador_id: number
  rol_en_roster: RolEnRoster
}
