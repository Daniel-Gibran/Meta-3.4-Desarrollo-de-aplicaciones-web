<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

import { useAuth } from '@/stores/auth'

const router = useRouter()
const { limpiarSesionLocal } = useAuth()

// Si el backend responde 401 en una petición de datos, se cierra la sesión
// local y, si estaba en el panel, se manda al login.
function alExpirarSesion () {
  limpiarSesionLocal()

  if (router.currentRoute.value.path.startsWith('/admin')) {
    router.push({
      name: 'login',
      query: { redirect: router.currentRoute.value.fullPath },
    })
  }
}

onMounted(() => window.addEventListener('auth:expirado', alExpirarSesion))
onUnmounted(() => window.removeEventListener('auth:expirado', alExpirarSesion))
</script>

<template>
  <v-app>
    <router-view />
  </v-app>
</template>
