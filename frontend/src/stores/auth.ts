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
  const esAdmin = computed(() => usuario.value?.rol === 'admin')

  async function iniciarSesion (email: string, password: string) {
    usuario.value = await authApi.login(email, password)
  }

  async function cerrarSesion () {
    try {
      await authApi.logout()
    } finally {
      usuario.value = null
    }
  }

  /**
   * Al recargar la página se perdió el estado en memoria, pero la cookie JWT
   * sigue ahí. Esta llamada la valida contra el backend.
   */
  async function restaurarSesion () {
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
