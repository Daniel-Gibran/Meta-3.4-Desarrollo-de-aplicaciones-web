<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'

import ConfirmarDialog from '@/components/ConfirmarDialog.vue'
import MensajeError from '@/components/MensajeError.vue'
import { useErrores } from '@/composables/useErrores'
import {
  actualizarJugador,
  crearJugador,
  eliminarJugador,
  listarJugadores,
  obtenerJugador,
} from '@/services/jugadores'
import { useAuth } from '@/stores/auth'
import type {
  DatosJugador,
  EstadoJugador,
  FiltrosJugadores,
  Jugador,
  RolJugador,
} from '@/types'
import { ESTADOS, ROLES } from '@/utils/catalogos'

const route = useRoute()
const { esAdmin } = useAuth()
const { mensaje, detalles, mostrar, limpiar } = useErrores()

// Las acciones solo aparecen en /admin. En /consulta todo es lectura.
const puedeGestionar = computed(() => esAdmin.value && route.path.startsWith('/admin'))

const headers = [
  { title: 'Nickname', key: 'nickname' },
  { title: 'Nombre real', key: 'nombre_real' },
  { title: 'País', key: 'pais' },
  { title: 'Rol', key: 'rol' },
  { title: 'Estado', key: 'estado' },
  { title: 'Acciones', key: 'acciones', sortable: false },
]

// Lista y filtros de la pantalla.
const jugadores = ref<Jugador[]>([])
const cargando = ref(false)
const filtros = reactive<{
  search: string
  rol: RolJugador | null
  estado: EstadoJugador | null
}>({
  search: '',
  rol: null,
  estado: null,
})

// Mensajes de éxito.
const snackbar = ref(false)
const snackbarTexto = ref('')

// Diálogo de detalle.
const dialogoDetalle = ref(false)
const detalle = ref<Jugador | null>(null)
const cargandoDetalle = ref(false)

// Diálogo de alta y edición.
const dialogoForm = ref(false)
const modo = ref<'crear' | 'editar'>('crear')
const jugadorEditando = ref<Jugador | null>(null)
const guardando = ref(false)
const form = reactive({
  nickname: '',
  nombre_real: '',
  pais: '',
  rol: 'Mid' as RolJugador,
  estado: 'activo' as EstadoJugador,
})

// Confirmación de borrado.
const dialogoEliminar = ref(false)
const jugadorAEliminar = ref<Jugador | null>(null)
const eliminando = ref(false)

function notificar (texto: string) {
  snackbarTexto.value = texto
  snackbar.value = true
}

function construirFiltros (): FiltrosJugadores {
  const params: FiltrosJugadores = {}

  if (filtros.search.trim() !== '') params.search = filtros.search.trim()
  if (filtros.rol) params.rol = filtros.rol
  if (filtros.estado) params.estado = filtros.estado

  return params
}

// RF-02 y RF-06: listado con búsqueda y filtros.
async function listar () {
  cargando.value = true
  limpiar()

  try {
    jugadores.value = await listarJugadores(construirFiltros())
  } catch (e) {
    mostrar(e)
  } finally {
    cargando.value = false
  }
}

function limpiarFiltros () {
  filtros.search = ''
  filtros.rol = null
  filtros.estado = null
  void listar()
}

// RF-03: el detalle se consulta de nuevo a la API.
async function verDetalle (jugador: Jugador) {
  detalle.value = null
  dialogoDetalle.value = true
  cargandoDetalle.value = true
  limpiar()

  try {
    detalle.value = await obtenerJugador(jugador.id)
  } catch (e) {
    mostrar(e)
    dialogoDetalle.value = false
  } finally {
    cargandoDetalle.value = false
  }
}

function abrirCrear () {
  modo.value = 'crear'
  jugadorEditando.value = null
  form.nickname = ''
  form.nombre_real = ''
  form.pais = ''
  form.rol = 'Mid'
  form.estado = 'activo'
  limpiar()
  dialogoForm.value = true
}

function abrirEditar (jugador: Jugador) {
  modo.value = 'editar'
  jugadorEditando.value = jugador
  form.nickname = jugador.nickname
  form.nombre_real = jugador.nombre_real ?? ''
  form.pais = jugador.pais ?? ''
  form.rol = jugador.rol
  form.estado = jugador.estado
  limpiar()
  dialogoForm.value = true
}

function editarDesdeDetalle () {
  if (!detalle.value) return

  const jugador = detalle.value
  dialogoDetalle.value = false
  abrirEditar(jugador)
}

// RF-01 y RF-04: crear o actualizar según el modo.
async function guardar () {
  if (form.nickname.trim() === '') {
    mensaje.value = 'El nickname es obligatorio.'
    detalles.value = ''
    return
  }

  guardando.value = true
  limpiar()

  const datos: DatosJugador = {
    nickname: form.nickname.trim(),
    nombre_real: form.nombre_real.trim() || null,
    pais: form.pais.trim() || null,
    rol: form.rol,
    estado: form.estado,
  }

  try {
    if (modo.value === 'crear') {
      await crearJugador(datos)
      notificar('Jugador creado correctamente (201).')
    } else if (jugadorEditando.value) {
      await actualizarJugador(jugadorEditando.value.id, datos)
      notificar('Jugador actualizado correctamente (200).')
    }

    dialogoForm.value = false
    await listar()
  } catch (e) {
    mostrar(e)
  } finally {
    guardando.value = false
  }
}

function pedirEliminar (jugador: Jugador) {
  jugadorAEliminar.value = jugador
  dialogoEliminar.value = true
  limpiar()
}

// RF-05: si el jugador tiene rosters, el backend responde 409 y se muestra el motivo.
async function confirmarEliminar () {
  if (!jugadorAEliminar.value) return

  eliminando.value = true
  limpiar()

  try {
    await eliminarJugador(jugadorAEliminar.value.id)
    notificar('Jugador eliminado correctamente (204).')
    dialogoEliminar.value = false
    await listar()
  } catch (e) {
    mostrar(e)
    dialogoEliminar.value = false
  } finally {
    eliminando.value = false
  }
}

onMounted(listar)
</script>

<template>
  <v-container>
    <div class="d-flex align-center flex-wrap ga-3 mb-4">
      <div>
        <h1 class="text-h5">Jugadores</h1>
        <p class="text-body-2 text-medium-emphasis mb-0">
          {{ puedeGestionar
            ? 'Crear, consultar, editar y eliminar jugadores.'
            : 'Consulta de jugadores en modo lectura.' }}
        </p>
      </div>

      <v-spacer />

      <v-btn
        v-if="puedeGestionar"
        color="primary"
        prepend-icon="mdi-plus"
        @click="abrirCrear"
      >
        Nuevo jugador
      </v-btn>
    </div>

    <!-- Filtros de RF-06 -->
    <v-card class="mb-4">
      <v-card-text>
        <v-row dense>
          <v-col cols="12" md="5">
            <v-text-field
              v-model="filtros.search"
              label="Buscar por nickname"
              prepend-inner-icon="mdi-magnify"
              clearable
              hide-details
              @keyup.enter="listar"
            />
          </v-col>

          <v-col cols="6" md="2">
            <v-select
              v-model="filtros.rol"
              :items="ROLES"
              label="Rol"
              clearable
              hide-details
              @update:model-value="listar"
            />
          </v-col>

          <v-col cols="6" md="2">
            <v-select
              v-model="filtros.estado"
              :items="ESTADOS"
              label="Estado"
              clearable
              hide-details
              @update:model-value="listar"
            />
          </v-col>

          <v-col cols="12" md="3" class="d-flex align-center ga-2">
            <v-btn color="primary" prepend-icon="mdi-magnify" @click="listar">
              Buscar
            </v-btn>
            <v-btn variant="text" prepend-icon="mdi-filter-off" @click="limpiarFiltros">
              Limpiar
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <MensajeError :mensaje="mensaje" :detalles="detalles" @cerrar="limpiar" />

    <v-card>
      <v-data-table
        :headers="headers"
        :items="jugadores"
        :loading="cargando"
        :items-per-page="10"
        item-value="id"
        no-data-text="No hay jugadores que coincidan con los filtros"
      >
        <template #item.rol="{ item }">
          <v-chip size="small" variant="tonal">{{ item.rol }}</v-chip>
        </template>

        <template #item.estado="{ item }">
          <v-chip
            size="small"
            :color="item.estado === 'activo' ? 'success' : 'default'"
          >
            {{ item.estado }}
          </v-chip>
        </template>

        <template #item.acciones="{ item }">
          <v-btn
            icon="mdi-eye"
            size="small"
            variant="text"
            title="Ver detalle"
            @click="verDetalle(item)"
          />

          <template v-if="puedeGestionar">
            <v-btn
              icon="mdi-pencil"
              size="small"
              variant="text"
              title="Editar"
              @click="abrirEditar(item)"
            />
            <v-btn
              icon="mdi-delete"
              size="small"
              variant="text"
              color="error"
              title="Eliminar"
              @click="pedirEliminar(item)"
            />
          </template>
        </template>
      </v-data-table>
    </v-card>

    <!-- Detalle del jugador -->
    <v-dialog v-model="dialogoDetalle" max-width="540">
      <v-card>
        <v-card-title>Detalle del jugador</v-card-title>

        <v-card-text>
          <v-progress-linear v-if="cargandoDetalle" indeterminate class="mb-4" />

          <v-list v-else-if="detalle" lines="two" density="compact">
            <v-list-item title="ID" :subtitle="String(detalle.id)" />
            <v-list-item title="Nickname" :subtitle="detalle.nickname" />
            <v-list-item title="Nombre real" :subtitle="detalle.nombre_real ?? 'Sin dato'" />
            <v-list-item title="País" :subtitle="detalle.pais ?? 'Sin dato'" />
            <v-list-item title="Rol" :subtitle="detalle.rol" />
            <v-list-item title="Estado" :subtitle="detalle.estado" />
          </v-list>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn
            v-if="puedeGestionar && detalle"
            color="primary"
            variant="text"
            prepend-icon="mdi-pencil"
            @click="editarDesdeDetalle"
          >
            Editar
          </v-btn>
          <v-btn variant="text" @click="dialogoDetalle = false">Cerrar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Alta y edición -->
    <v-dialog v-model="dialogoForm" max-width="560" persistent>
      <v-card>
        <v-card-title>
          {{ modo === 'crear' ? 'Nuevo jugador' : 'Editar jugador' }}
        </v-card-title>

        <v-card-text>
          <MensajeError :mensaje="mensaje" :detalles="detalles" @cerrar="limpiar" />

          <v-text-field
            v-model="form.nickname"
            label="Nickname *"
            maxlength="50"
            counter
            class="mb-1"
          />
          <v-text-field
            v-model="form.nombre_real"
            label="Nombre real"
            maxlength="100"
            class="mb-1"
          />
          <v-text-field
            v-model="form.pais"
            label="País"
            maxlength="60"
          />

          <v-row>
            <v-col cols="12" sm="6">
              <v-select v-model="form.rol" :items="ROLES" label="Rol *" />
            </v-col>
            <v-col cols="12" sm="6">
              <v-select v-model="form.estado" :items="ESTADOS" label="Estado" />
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dialogoForm = false">Cancelar</v-btn>
          <v-btn color="primary" :loading="guardando" @click="guardar">
            Guardar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <ConfirmarDialog
      v-model="dialogoEliminar"
      titulo="Eliminar jugador"
      :mensaje="`¿Eliminar a ${jugadorAEliminar?.nickname ?? ''}? Si está asignado a un roster, la API rechazará la operación.`"
      :cargando="eliminando"
      @confirmar="confirmarEliminar"
    />

    <v-snackbar v-model="snackbar" color="success" timeout="3000">
      {{ snackbarTexto }}
    </v-snackbar>
  </v-container>
</template>
