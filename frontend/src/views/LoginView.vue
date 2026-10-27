<script setup lang="ts">
import axios from 'axios'
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useAuth } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const { esAdmin, iniciarSesion } = useAuth()

// Datos del formulario y estado de la petición.
const email = ref('admin@esports.local')
const password = ref('Admin123!')
const cargando = ref(false)
const error = ref('')

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
                  Meta 3.4 · JWT + cookies + CSRF
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
