import type { EstadoJugador, RolEnRoster, RolJugador, TipoRoster } from '@/types'

// Copia de los catálogos del backend. La API vuelve a validarlos, así que aquí
// solo sirven para construir selects y filtros.
export const ROLES: RolJugador[] = ['Top', 'Jungle', 'Mid', 'ADC', 'Support']
export const ESTADOS: EstadoJugador[] = ['activo', 'inactivo']
export const TIPOS_ROSTER: TipoRoster[] = ['Principal', 'Academy']
export const ROLES_ROSTER: RolEnRoster[] = ['Titular', 'Suplente']
