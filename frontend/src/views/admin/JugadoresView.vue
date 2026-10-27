<script setup lang="ts">
import axios from 'axios'
import { onMounted, reactive, ref } from 'vue'

import api from '@/services/api'

interface Jugador {
  id: number
  nickname: string
  nombre_real: string | null
  pais: string | null
  rol: string
  estado: string
}

// Columnas que mostrará la tabla.
const headers = [
  { title: 'Nickname', key: 'nickname' },
  { title: 'Nombre real', key: 'nombre_real' },
  { title: 'País', key: 'pais' },
  { title: 'Rol', key: 'rol' },
  { title: 'Estado', key: 'estado' },
]

// Valores permitidos por el catálogo del backend.
const roles = ['Top', 'Jungle', 'Mid', 'ADC', 'Support']
const estados = ['activo', 'inactivo']

// Estado de la pantalla: datos, carga y mensaje de error.
const jugadores = ref<Jugador[]>([])
const cargando = ref(false)
const error = ref('')

// Estado del formulario de alta.
const dialogo = ref(false)
const guardando = ref(false)
const snackbar = ref(false)
const mensajeSnackbar = ref('')

// Datos que se capturan en el formulario.
const form = reactive({
  nickname: '',
  nombre_real: '',
  pais: '',
  rol: 'Mid',
  estado: 'activo',
})

// Traduce el error de axios a un mensaje que se pueda mostrar.
function mensajeDeError (e: unknown): string {
  if (axios.isAxiosError(e)) {
    return e.response?.data?.message ?? 'No se pudo completar la operación'
  }
  return 'Ocurrió un error inesperado'
}

// GET público: no necesita sesión ni token CSRF.
async function listar () {
  cargando.value = true
  error.value = ''

  try {
    const { data } = await api.get<{ data: Jugador[] }>('/jugadores')
    jugadores.value = data.data
  } catch (e) {
    error.value = mensajeDeError(e)
  } finally {
    cargando.value = false
  }
}

// Limpia el formulario y abre el diálogo.
function abrirDialogo () {
  form.nickname = ''
  form.nombre_real = ''
  form.pais = ''
  form.rol = 'Mid'
  form.estado = 'activo'
  dialogo.value = true
}

// POST protegido. El interceptor de axios agrega la cabecera x-csrf-token.
async function guardar () {
  if (form.nickname.trim() === '') {
    error.value = 'El nickname es obligatorio'
    return
  }

  guardando.value = true
  error.value = ''

  try {
    await api.post('/jugadores', {
      nickname: form.nickname.trim(),
      nombre_real: form.nombre_real.trim() || null,
      pais: form.pais.trim() || null,
      rol: form.rol,
      estado: form.estado,
    })

    // Si el backend responde 201, se cierra el diálogo y se recarga la tabla.
    dialogo.value = false
    mensajeSnackbar.value = 'Jugador creado correctamente'
    snackbar.value = true
    await listar()
  } catch (e) {
    error.value = mensajeDeError(e)
  } finally {
    guardando.value = false
  }
}

// Al entrar a la pantalla se carga la lista.
onMounted(listar)
</script>

<template>
  <v-container>
    <div class="d-flex align-center mb-4">
      <div>
        <h1 class="text-h5">Jugadores</h1>
        <p class="text-body-2 text-medium-emphasis mb-0">
          Lectura pública · escritura solo para Admin
        </p>
      </div>

      <v-spacer />

      <v-btn color="primary" prepend-icon="mdi-plus" @click="abrirDialogo">
        Nuevo jugador
      </v-btn>
    </div>

    <v-alert
      v-if="error"
      type="error"
      variant="tonal"
      density="compact"
      closable
      class="mb-4"
      @click:close="error = ''"
    >
      {{ error }}
    </v-alert>

    <v-card>
      <v-data-table
        :headers="headers"
        :items="jugadores"
        :loading="cargando"
        item-value="id"
        no-data-text="No hay jugadores registrados"
      >
        <template #item.estado="{ item }">
          <v-chip
            size="small"
            :color="item.estado === 'activo' ? 'success' : 'default'"
          >
            {{ item.estado }}
          </v-chip>
        </template>
      </v-data-table>
    </v-card>

    <v-dialog v-model="dialogo" max-width="520">
      <v-card>
        <v-card-title>Nuevo jugador</v-card-title>

        <v-card-text>
          <v-text-field v-model="form.nickname" label="Nickname" class="mb-1" />
          <v-text-field v-model="form.nombre_real" label="Nombre real" class="mb-1" />
          <v-text-field v-model="form.pais" label="País" class="mb-1" />
          <v-select v-model="form.rol" :items="roles" label="Rol" class="mb-1" />
          <v-select v-model="form.estado" :items="estados" label="Estado" />
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dialogo = false">Cancelar</v-btn>
          <v-btn color="primary" :loading="guardando" @click="guardar">
            Guardar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar" color="success" timeout="2500">
      {{ mensajeSnackbar }}
    </v-snackbar>
  </v-container>
</template>
