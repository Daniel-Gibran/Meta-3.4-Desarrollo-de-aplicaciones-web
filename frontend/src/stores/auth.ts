import { computed, ref } from 'vue'

import * as authApi from '@/services/auth'
import type { Usuario } from '@/services/auth'

/**
 * Estado de sesión compartido por toda la aplicación.
 *
 * No se usa Pinia a propósito: para un avance de una sola pantalla, un módulo
 * con refs es suficiente y evita una dependencia extra.
 */
const usuario = ref<Usuario | null>(null)
const inicializado = ref(false)

export function useAuth () {
  // true solo cuando el rol es admin.
  const esAdmin = computed(() => usuario.value?.rol === 'admin')

  // Llama al login y guarda el usuario que responde el backend.
  async function iniciarSesion (email: string, password: string) {
    usuario.value = await authApi.login(email, password)
  }

  // Borra las cookies en el backend y limpia el estado local.
  async function cerrarSesion () {
    try {
      await authApi.logout()
    } finally {
      // Aunque falle la petición, la interfaz debe quedar sin sesión.
      usuario.value = null
    }
  }

  /**
   * Al recargar la página se perdió el estado en memoria, pero la cookie JWT
   * sigue ahí. Esta llamada la valida contra el backend.
   */
  async function restaurarSesion () {
    // Solo se consulta una vez por carga de página.
    if (inicializado.value) return

    try {
      usuario.value = await authApi.obtenerSesion()
    } catch {
      usuario.value = null
    } finally {
      inicializado.value = true
    }
  }

  return {
    usuario,
    esAdmin,
    iniciarSesion,
    cerrarSesion,
    restaurarSesion,
  }
}
