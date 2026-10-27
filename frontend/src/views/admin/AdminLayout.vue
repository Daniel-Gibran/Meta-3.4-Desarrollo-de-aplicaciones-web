<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import { useAuth } from '@/stores/auth'

const router = useRouter()
const { usuario, cerrarSesion } = useAuth()

const drawer = ref(true)
const saliendo = ref(false)

async function salir () {
  saliendo.value = true

  try {
    await cerrarSesion()
  } finally {
    saliendo.value = false
    await router.push('/login')
  }
}
</script>

<template>
  <v-app-bar color="primary" flat>
    <v-app-bar-nav-icon @click="drawer = !drawer" />
    <v-app-bar-title>Rosters · Panel Admin</v-app-bar-title>

    <v-spacer />

    <v-chip class="mr-3" prepend-icon="mdi-account-circle-outline">
      {{ usuario?.nombre }}
    </v-chip>

    <v-btn
      variant="text"
      prepend-icon="mdi-logout"
      :loading="saliendo"
      @click="salir"
    >
      Salir
    </v-btn>
  </v-app-bar>

  <v-navigation-drawer v-model="drawer">
    <v-list nav>
      <v-list-item
        prepend-icon="mdi-account-group"
        title="Jugadores"
        to="/admin"
        exact
      />
    </v-list>

    <v-divider />

    <div class="pa-4 text-caption text-medium-emphasis">
      <div>{{ usuario?.email }}</div>
      <div>Rol: {{ usuario?.rol }}</div>
    </div>
  </v-navigation-drawer>

  <v-main>
    <router-view />
  </v-main>
</template>
