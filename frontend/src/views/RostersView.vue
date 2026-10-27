<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import ConfirmarDialog from '@/components/ConfirmarDialog.vue'
import MensajeError from '@/components/MensajeError.vue'
import { useErrores } from '@/composables/useErrores'
import {
  actualizarRoster,
  crearRoster,
  eliminarRoster,
  listarRosters,
} from '@/services/rosters'
import { useAuth } from '@/stores/auth'
import type {
  DatosRoster,
  FiltrosRosters,
  Roster,
  TipoRoster,
} from '@/types'
import { TIPOS_ROSTER } from '@/utils/catalogos'

const route = useRoute()
const router = useRouter()
const { esAdmin } = useAuth()
const { mensaje, detalles, mostrar, limpiar } = useErrores()

// Las acciones solo aparecen en /admin. En /consulta todo es lectura.
const puedeGestionar = computed(() => esAdmin.value && route.path.startsWith('/admin'))

const headers = [
  { title: 'Nombre', key: 'nombre' },
  { title: 'Juego', key: 'juego' },
  { title: 'Tipo', key: 'tipo' },
  { title: 'Temporada', key: 'temporada' },
  { title: 'Jugadores', key: 'cantidadJugadores' },
  { title: 'Titulares', key: 'cantidadTitulares' },
  { title: 'Acciones', key: 'acciones', sortable: false },
]

const rosters = ref<Roster[]>([])
const cargando = ref(false)
const filtros = reactive<{
  tipo: TipoRoster | null
  temporada: string
}>({
  tipo: null,
  temporada: '',
})

const snackbar = ref(false)
const snackbarTexto = ref('')

const dialogoForm = ref(false)
const modo = ref<'crear' | 'editar'>('crear')
const rosterEditando = ref<Roster | null>(null)
const guardando = ref(false)
const form = reactive({
  nombre: '',
  juego: 'League of Legends',
  tipo: 'Principal' as TipoRoster,
  temporada: String(new Date().getFullYear()),
})

const dialogoEliminar = ref(false)
const rosterAEliminar = ref<Roster | null>(null)
const eliminando = ref(false)

// La misma vista se usa en /admin y en /consulta; el detalle se abre en la
// sección correspondiente.
const baseDetalle = computed(() =>
  route.path.startsWith('/admin') ? '/admin/rosters' : '/consulta/rosters'
)

function notificar (texto: string) {
  snackbarTexto.value = texto
  snackbar.value = true
}

function construirFiltros (): FiltrosRosters {
  const params: FiltrosRosters = {}

  if (filtros.tipo) params.tipo = filtros.tipo
  if (filtros.temporada.trim() !== '') params.temporada = filtros.temporada.trim()

  return params
}

async function listar () {
  cargando.value = true
  limpiar()

  try {
    rosters.value = await listarRosters(construirFiltros())
  } catch (e) {
    mostrar(e)
  } finally {
    cargando.value = false
  }
}

function limpiarFiltros () {
  filtros.tipo = null
  filtros.temporada = ''
  void listar()
}

function verDetalle (roster: Roster) {
  router.push(`${baseDetalle.value}/${roster.id}`)
}

function abrirCrear () {
  modo.value = 'crear'
  rosterEditando.value = null
  form.nombre = ''
  form.juego = 'League of Legends'
  form.tipo = 'Principal'
  form.temporada = String(new Date().getFullYear())
  limpiar()
  dialogoForm.value = true
}

function abrirEditar (roster: Roster) {
  modo.value = 'editar'
  rosterEditando.value = roster
  form.nombre = roster.nombre
  form.juego = roster.juego
  form.tipo = roster.tipo
  form.temporada = roster.temporada
  limpiar()
  dialogoForm.value = true
}

async function guardar () {
  if (form.nombre.trim() === '') {
    mensaje.value = 'El nombre es obligatorio.'
    detalles.value = ''
    return
  }

  if (!/^\d{4}$/.test(form.temporada.trim())) {
    mensaje.value = 'La temporada debe ser un año de cuatro dígitos.'
    detalles.value = 'Ejemplo: 2026'
    return
  }

  guardando.value = true
  limpiar()

  const datos: DatosRoster = {
    nombre: form.nombre.trim(),
    juego: form.juego.trim() || 'League of Legends',
    tipo: form.tipo,
    temporada: form.temporada.trim(),
  }

  try {
    if (modo.value === 'crear') {
      await crearRoster(datos)
      notificar('Roster creado correctamente (201).')
    } else if (rosterEditando.value) {
      await actualizarRoster(rosterEditando.value.id, datos)
      notificar('Roster actualizado correctamente (200).')
    }

    dialogoForm.value = false
    await listar()
  } catch (e) {
    mostrar(e)
  } finally {
    guardando.value = false
  }
}

function pedirEliminar (roster: Roster) {
  rosterAEliminar.value = roster
  dialogoEliminar.value = true
  limpiar()
}

async function confirmarEliminar () {
  if (!rosterAEliminar.value) return

  eliminando.value = true
  limpiar()

  try {
    await eliminarRoster(rosterAEliminar.value.id)
    notificar('Roster eliminado correctamente (204).')
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
        <h1 class="text-h5">Rosters</h1>
        <p class="text-body-2 text-medium-emphasis mb-0">
          {{ puedeGestionar
            ? 'Crear, editar, eliminar rosters y gestionar sus jugadores.'
            : 'Consulta de rosters en modo lectura.' }}
        </p>
      </div>

      <v-spacer />

      <v-btn
        v-if="puedeGestionar"
        color="primary"
        prepend-icon="mdi-plus"
        @click="abrirCrear"
      >
        Nuevo roster
      </v-btn>
    </div>

    <v-card class="mb-4">
      <v-card-text>
        <v-row dense>
          <v-col cols="12" sm="4">
            <v-select
              v-model="filtros.tipo"
              :items="TIPOS_ROSTER"
              label="Tipo"
              clearable
              hide-details
              @update:model-value="listar"
            />
          </v-col>

          <v-col cols="12" sm="3">
            <v-text-field
              v-model="filtros.temporada"
              label="Temporada"
              maxlength="4"
              placeholder="2026"
              hide-details
              @keyup.enter="listar"
            />
          </v-col>

          <v-col cols="12" sm="5" class="d-flex align-center ga-2">
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
        :items="rosters"
        :loading="cargando"
        :items-per-page="10"
        item-value="id"
        no-data-text="No hay rosters que coincidan con los filtros"
      >
        <template #item.tipo="{ item }">
          <v-chip size="small" variant="tonal">{{ item.tipo }}</v-chip>
        </template>

        <template #item.cantidadJugadores="{ item }">
          {{ item.cantidadJugadores }}
        </template>

        <template #item.cantidadTitulares="{ item }">
          {{ item.cantidadTitulares }} / 5
        </template>

        <template #item.acciones="{ item }">
          <v-btn
            icon="mdi-eye"
            size="small"
            variant="text"
            title="Ver roster"
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

    <v-dialog v-model="dialogoForm" max-width="560" persistent>
      <v-card>
        <v-card-title>
          {{ modo === 'crear' ? 'Nuevo roster' : 'Editar roster' }}
        </v-card-title>

        <v-card-text>
          <MensajeError :mensaje="mensaje" :detalles="detalles" @cerrar="limpiar" />

          <v-text-field
            v-model="form.nombre"
            label="Nombre *"
            maxlength="100"
            counter
            class="mb-1"
          />
          <v-text-field
            v-model="form.juego"
            label="Juego"
            maxlength="100"
            class="mb-1"
          />

          <v-row>
            <v-col cols="12" sm="6">
              <v-select v-model="form.tipo" :items="TIPOS_ROSTER" label="Tipo *" />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="form.temporada"
                label="Temporada *"
                maxlength="4"
                placeholder="2026"
              />
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
      titulo="Eliminar roster"
      :mensaje="`¿Eliminar el roster ${rosterAEliminar?.nombre ?? ''}? Se borrarán sus asignaciones, pero los jugadores seguirán existiendo.`"
      :cargando="eliminando"
      @confirmar="confirmarEliminar"
    />

    <v-snackbar v-model="snackbar" color="success" timeout="3000">
      {{ snackbarTexto }}
    </v-snackbar>
  </v-container>
</template>
