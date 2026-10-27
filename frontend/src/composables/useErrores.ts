import { ref } from 'vue'

import { leerError } from '@/services/errores'

// Estado reutilizable para mostrar el error que devolvió la API.
export function useErrores () {
  const mensaje = ref('')
  const detalles = ref('')

  function mostrar (error: unknown) {
    const leido = leerError(error)
    mensaje.value = leido.mensaje
    detalles.value = leido.detalles
  }

  function limpiar () {
    mensaje.value = ''
    detalles.value = ''
  }

  return { mensaje, detalles, mostrar, limpiar }
}
