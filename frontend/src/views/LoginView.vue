<script setup lang="ts">
import axios from 'axios'
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useAuth } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const { esAdmin, iniciarSesion, restaurarSesion, usuario } = useAuth()

// Meta 4.1: el backend redirige aquí con ?oauth=ok|error|cancelado|state|inactivo
const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1'
const urlGoogle = `${apiUrl}/auth/google/login`

const MENSAJES_OAUTH: Record<string, string> = {
  cancelado: 'Cancelaste el inicio de sesión con Google.',
  state: 'La sesión de Google expiró. Inténtalo de nuevo.',
  error: 'No se pudo completar el inicio de sesión con Google.',
  inactivo: 'La cuenta está desactivada.',
}

// Datos del formulario y estado de la petición.
const email = ref('admin@esports.local')
const password = ref('Admin123!')
const cargando = ref(false)
const error = ref('')

// Al volver de Google, el backend ya dejó las cookies de sesión. Solo hay que
// recuperar el usuario y entrar al panel que le corresponde.
onMounted(async () => {
  const resultado = route.query.oauth

  if (typeof resultado !== 'string') return

  if (resultado === 'ok') {
    await restaurarSesion()

    if (usuario.value) {
      await router.replace(esAdmin.value ? '/admin/jugadores' : '/consulta/jugadores')
    }
    return
  }

  error.value = MENSAJES_OAUTH[resultado] ?? 'No se pudo iniciar sesión con Google.'
})

// Toma el mensaje que manda el backend y lo deja listo para mostrar.
function mensajeDeError (e: unknown): string {
  if (axios.isAxiosError(e)) {
    return e.response?.data?.message ?? 'No se pudo iniciar sesión'
  }
  return 'Ocurrió un error inesperado'
}

// Envía las credenciales y, si son correctas, entra al panel.
async function enviar () {
  error.value = ''
  cargando.value = true

  try {
    await iniciarSesion(email.value, password.value)

    // Admin entra al panel de gestión; Público entra a la vista de solo lectura.
    const redireccion = typeof route.query.redirect === 'string'
      ? route.query.redirect
      : ''

    const destino = esAdmin.value
      ? (redireccion.startsWith('/admin') ? redireccion : '/admin/jugadores')
      : '/consulta/jugadores'

    await router.push(destino)
  } catch (e) {
    error.value = mensajeDeError(e)
  } finally {
    cargando.value = false
  }
}
</script>

<template>
  <v-container class="fill-height">
    <v-row justify="center" align="center" class="w-100">
      <v-col cols="12" sm="8" md="5" lg="4">
        <v-card class="pa-2" elevation="4">
          <v-card-item>
            <div class="d-flex align-center ga-3">
              <v-avatar color="primary" size="44">
                <v-icon icon="mdi-shield-account" size="26" />
              </v-avatar>
              <div>
                <div class="text-h6">Rosters · Acceso</div>
                <div class="text-caption text-medium-emphasis">
                  Meta 4.1 · JWT + cookies + CSRF + Google OAuth
                </div>
              </div>
            </div>
          </v-card-item>

          <v-card-text>
            <v-alert
              v-if="error"
              type="error"
              variant="tonal"
              density="compact"
              class="mb-4"
            >
              {{ error }}
            </v-alert>

            <v-form @submit.prevent="enviar">
              <v-text-field
                v-model="email"
                label="Correo"
                type="email"
                prepend-inner-icon="mdi-email-outline"
                autocomplete="username"
                class="mb-1"
              />

              <v-text-field
                v-model="password"
                label="Contraseña"
                type="password"
                prepend-inner-icon="mdi-lock-outline"
                autocomplete="current-password"
                class="mb-3"
              />

              <v-btn
                type="submit"
                color="primary"
                block
                size="large"
                :loading="cargando"
              >
                Iniciar sesión
              </v-btn>
            </v-form>

            <v-divider class="my-5" />

            <v-btn
              block
              variant="outlined"
              prepend-icon="mdi-google"
              :href="urlGoogle"
              class="mb-2"
            >
              Continuar con Google
            </v-btn>

            <div class="text-caption text-medium-emphasis mb-3">
              <div class="mb-1"><strong>Admin:</strong> <code>admin@esports.local</code> / <code>Admin123!</code></div>
              <div><strong>Público:</strong> <code>publico@esports.local</code> / <code>Publico123!</code></div>
            </div>

            <v-btn
              variant="text"
              block
              prepend-icon="mdi-database-eye-outline"
              to="/consulta/jugadores"
            >
              Consultar sin iniciar sesión
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
