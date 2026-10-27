<script setup lang="ts">
import axios from 'axios'
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useAuth } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const { esAdmin, iniciarSesion, cerrarSesion } = useAuth()

const email = ref('admin@esports.local')
const password = ref('Admin123!')
const cargando = ref(false)
const error = ref('')

function mensajeDeError (e: unknown): string {
  if (axios.isAxiosError(e)) {
    return e.response?.data?.message ?? 'No se pudo iniciar sesión'
  }
  return 'Ocurrió un error inesperado'
}

async function enviar () {
  error.value = ''
  cargando.value = true

  try {
    await iniciarSesion(email.value, password.value)

    // El backend autentica a cualquier usuario, pero el panel es solo Admin.
    if (!esAdmin.value) {
      await cerrarSesion()
      error.value = 'Esta cuenta no tiene permisos de administrador.'
      return
    }

    const destino = typeof route.query.redirect === 'string'
      ? route.query.redirect
      : '/admin'

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
                <div class="text-h6">Rosters · Admin</div>
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

            <div class="text-caption text-medium-emphasis">
              Cuenta de prueba:
              <code>admin@esports.local</code> / <code>Admin123!</code>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
