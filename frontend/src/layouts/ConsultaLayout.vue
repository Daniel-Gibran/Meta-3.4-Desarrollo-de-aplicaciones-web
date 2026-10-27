<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useAuth } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const { usuario, esAdmin, cerrarSesion } = useAuth()

const drawer = ref(true)
const saliendo = ref(false)

// Si no hay sesión, manda al login conservando la página actual.
function irAlLogin () {
  router.push({ name: 'login', query: { redirect: route.fullPath } })
}

// Cierra la sesión y se queda en la vista pública.
async function salir () {
  saliendo.value = true

  try {
    await cerrarSesion()
  } finally {
    saliendo.value = false
    await router.push('/consulta/jugadores')
  }
}
</script>

<template>
  <v-app-bar color="primary" flat>
    <v-app-bar-nav-icon @click="drawer = !drawer" />
    <v-app-bar-title>Rosters · Consulta</v-app-bar-title>

    <v-spacer />

    <template v-if="usuario">
      <v-chip class="mr-3" prepend-icon="mdi-account-circle-outline">
        {{ usuario.nombre }} · {{ usuario.rol }}
      </v-chip>

      <v-btn
        v-if="esAdmin"
        class="mr-2"
        variant="text"
        prepend-icon="mdi-shield-account"
        to="/admin/jugadores"
      >
        Panel Admin
      </v-btn>

      <v-btn
        variant="text"
        prepend-icon="mdi-logout"
        :loading="saliendo"
        @click="salir"
      >
        Salir
      </v-btn>
    </template>

    <v-btn
      v-else
      variant="text"
      prepend-icon="mdi-login"
      @click="irAlLogin"
    >
      Iniciar sesión
    </v-btn>
  </v-app-bar>

  <v-navigation-drawer v-model="drawer">
    <v-list nav>
      <v-list-item
        prepend-icon="mdi-account-group"
        title="Jugadores"
        to="/consulta/jugadores"
      />
      <v-list-item
        prepend-icon="mdi-account-multiple"
        title="Rosters"
        to="/consulta/rosters"
      />
    </v-list>
  </v-navigation-drawer>

  <v-main>
    <router-view />
  </v-main>
</template>
