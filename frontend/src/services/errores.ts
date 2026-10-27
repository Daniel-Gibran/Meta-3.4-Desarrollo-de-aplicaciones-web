import axios from 'axios'

export interface ErrorApi {
  status?: number
  mensaje: string
  detalles: string
}

const MENSAJES_POR_STATUS: Record<number, string> = {
  400: 'La petición tiene datos inválidos.',
  401: 'Tu sesión no es válida o expiró. Inicia sesión de nuevo.',
  403: 'No tienes permisos para realizar esta acción.',
  404: 'El recurso solicitado no existe.',
  409: 'La operación choca con una regla del sistema.',
  413: 'El cuerpo de la petición es demasiado grande.',
  500: 'Ocurrió un error interno en el servidor.',
}

// Convierte el objeto `details` del backend en una línea legible.
function formatearDetalles (detalles: unknown): string {
  if (!detalles || typeof detalles !== 'object') return ''

  return Object.entries(detalles as Record<string, unknown>)
    .map(([clave, valor]) => {
      const texto = typeof valor === 'object' && valor !== null
        ? JSON.stringify(valor)
        : String(valor)

      return `${clave}: ${texto}`
    })
    .join(' · ')
}

// Lee la respuesta de error de la API y devuelve algo que la interfaz pueda mostrar.
export function leerError (error: unknown): ErrorApi {
  if (axios.isAxiosError(error)) {
    // Sin respuesta significa que el backend no está disponible.
    if (!error.response) {
      return {
        mensaje: 'No se pudo conectar con el servidor.',
        detalles: 'Revisa que el backend esté corriendo en http://localhost:3000',
      }
    }

    const status = error.response.status
    const data = error.response.data as { message?: string; details?: unknown } | undefined

    return {
      status,
      mensaje: data?.message ?? MENSAJES_POR_STATUS[status] ?? 'No se pudo completar la operación.',
      detalles: formatearDetalles(data?.details),
    }
  }

  return {
    mensaje: 'Ocurrió un error inesperado.',
    detalles: '',
  }
}
