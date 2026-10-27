<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import ConfirmarDialog from '@/components/ConfirmarDialog.vue'
import MensajeError from '@/components/MensajeError.vue'
import { useErrores } from '@/composables/useErrores'
import { listarJugadores } from '@/services/jugadores'
import {
  asignarJugador,
  cambiarRolEnRoster,
  obtenerRoster,
  quitarJugador,
} from '@/services/rosters'
import { useAuth } from '@/stores/auth'
import type {
  Jugador,
  JugadorEnRoster,
  RosterDetalle,
  RolEnRoster,
} from '@/types'
import { ROLES_ROSTER } from '@/utils/catalogos'

const route = useRoute()
const router = useRouter()
const { esAdmin } = useAuth()
const { mensaje, detalles, mostrar, limpiar } = useErrores()

const rosterId = computed(() => Number(route.params.id))
const esRutaAdmin = computed(() => route.path.startsWith('/admin'))
// La vista de consulta siempre es de solo lectura, incluso si entra un Admin.
const puedeGestionar = computed(() => esAdmin.value && esRutaAdmin.value)

const roster = ref<RosterDetalle | null>(null)
const cargando = ref(false)

const snackbar = ref(false)
const snackbarTexto = ref('')

const dialogoAsignar = ref(false)
const jugadoresDisponibles = ref<Jugador[]>([])
const cargandoDisponibles = ref(false)
const asignando = ref(false)
const formAsignar = reactive({
  jugador_id: null as number | null,
  rol_en_roster: 'Suplente' as RolEnRoster,
})

const dialogoQuitar = ref(false)
const jugadorAQuitar = ref<JugadorEnRoster | null>(null)
const quitando = ref(false)
const cambiandoRolId = ref<number | null>(null)

const titulares = computed(() =>
  roster.value?.jugadores.filter((j) => j.rol_en_roster === 'Titular').length ?? 0
)

const headers = computed(() => {
  const columnas = [
    { title: 'Nickname', key: 'nickname' },
    { title: 'Nombre real', key: 'nombre_real' },
    { title: 'Rol de juego', key: 'rol' },
    { title: 'Condición', key: 'rol_en_roster' },
  ]

  if (puedeGestionar.value) {
    columnas.push({ title: 'Acciones', key: 'acciones' })
  }

  return columnas
})

const opcionesJugadores = computed(() =>
  jugadoresDisponibles.value.map((j) => ({
    title: `${j.nickname} · ${j.rol} · ${j.estado}`,
    value: j.id,
  }))
)

function notificar (texto: string) {
  snackbarTexto.value = texto
  snackbar.value = true
}

function volver () {
  router.push(esRutaAdmin.value ? '/admin/rosters' : '/consulta/rosters')
}

// RF-09: carga el roster y sus jugadores asignados.
async function cargar () {
  if (!Number.isInteger(rosterId.value) || rosterId.value <= 0) {
    mensaje.value = 'El id del roster no es válido.'
    detalles.value = ''
    return
  }

  cargando.value = true
  limpiar()

  try {
    roster.value = await obtenerRoster(rosterId.value)
  } catch (e) {
    roster.value = null
    mostrar(e)
  } finally {
    cargando.value = false
  }
}

// Solo se ofrecen jugadores que todavía no pertenecen al roster.
async function abrirAsignar () {
  formAsignar.jugador_id = null
  formAsignar.rol_en_roster = 'Suplente'
  dialogoAsignar.value = true
  limpiar()
  cargandoDisponibles.value = true

  try {
    const todos = await listarJugadores()
    const asignados = new Set((roster.value?.jugadores ?? []).map((j) => j.id))
    jugadoresDisponibles.value = todos.filter((j) => !asignados.has(j.id))
  } catch (e) {
    mostrar(e)
  } finally {
    cargandoDisponibles.value = false
  }
}

// RF-12: asignar un jugador como Titular o Suplente.
async function asignar () {
  if (!formAsignar.jugador_id) {
    mensaje.value = 'Selecciona un jugador.'
    detalles.value = ''
    return
  }

  asignando.value = true
  limpiar()

  try {
    await asignarJugador(rosterId.value, {
      jugador_id: formAsignar.jugador_id,
      rol_en_roster: formAsignar.rol_en_roster,
    })

    notificar(`Jugador asignado como ${formAsignar.rol_en_roster} (201).`)
    dialogoAsignar.value = false
    await cargar()
  } catch (e) {
    // 409 por máximo de titulares, rol duplicado o jugador ya asignado.
    mostrar(e)
  } finally {
    asignando.value = false
  }
}

// RF-12: cambiar entre Titular y Suplente.
async function alternarRol (jugador: JugadorEnRoster) {
  const nuevoRol: RolEnRoster = jugador.rol_en_roster === 'Titular'
    ? 'Suplente'
    : 'Titular'

  cambiandoRolId.value = jugador.id
  limpiar()

  try {
    await cambiarRolEnRoster(rosterId.value, jugador.id, nuevoRol)
    notificar(`Condición actualizada a ${nuevoRol} (200).`)
    await cargar()
  } catch (e) {
    // Se recarga para que la tabla no quede con un valor que el backend rechazó.
    // El error se muestra después de recargar porque `cargar` limpia el mensaje.
    await cargar()
    mostrar(e)
  } finally {
    cambiandoRolId.value = null
  }
}

function pedirQuitar (jugador: JugadorEnRoster) {
  jugadorAQuitar.value = jugador
  dialogoQuitar.value = true
  limpiar()
}

// RF-13: quitar al jugador del roster sin borrarlo del sistema.
async function confirmarQuitar () {
  if (!jugadorAQuitar.value) return

  quitando.value = true
  limpiar()

  try {
    await quitarJugador(rosterId.value, jugadorAQuitar.value.id)
    notificar('Jugador removido del roster (204).')
    dialogoQuitar.value = false
    await cargar()
  } catch (e) {
    mostrar(e)
    dialogoQuitar.value = false
  } finally {
    quitando.value = false
  }
}

onMounted(cargar)
watch(rosterId, () => { void cargar() })
</script>

<template>
  <v-container>
    <div class="d-flex align-center ga-2 mb-4">
      <v-btn
        icon="mdi-arrow-left"
        variant="text"
        title="Volver a rosters"
        @click="volver"
      />

      <div>
        <h1 class="text-h5">Detalle del roster</h1>
        <p class="text-body-2 text-medium-emphasis mb-0">
          Jugadores asignados y su condición dentro del equipo.
        </p>
      </div>
    </div>

    <MensajeError :mensaje="mensaje" :detalles="detalles" @cerrar="limpiar" />

    <v-progress-linear v-if="cargando" indeterminate class="mb-4" />

    <template v-else-if="roster">
      <v-card class="mb-4">
        <v-card-item>
          <div class="d-flex flex-wrap align-center ga-3">
            <div>
              <div class="text-h6">{{ roster.nombre }}</div>
              <div class="text-body-2 text-medium-emphasis">
                {{ roster.juego }} · Temporada {{ roster.temporada }}
              </div>
            </div>

            <v-chip variant="tonal">{{ roster.tipo }}</v-chip>
            <v-chip color="primary" variant="tonal">
              Titulares {{ titulares }} / 5
            </v-chip>
            <v-chip variant="tonal">
              Jugadores {{ roster.jugadores.length }}
            </v-chip>

            <v-spacer />

            <v-btn
              v-if="puedeGestionar"
              color="primary"
              prepend-icon="mdi-account-plus"
              @click="abrirAsignar"
            >
              Asignar jugador
            </v-btn>
          </div>
        </v-card-item>
      </v-card>

      <v-card>
        <v-data-table
          :headers="headers"
          :items="roster.jugadores"
          :items-per-page="10"
          item-value="id"
          no-data-text="Este roster todavía no tiene jugadores asignados"
        >
          <template #item.rol="{ item }">
            <v-chip size="small" variant="tonal">{{ item.rol }}</v-chip>
          </template>

          <template #item.rol_en_roster="{ item }">
            <v-chip
              size="small"
              :color="item.rol_en_roster === 'Titular' ? 'primary' : 'default'"
            >
              {{ item.rol_en_roster }}
            </v-chip>
          </template>

          <template #item.acciones="{ item }">
            <v-btn
              size="small"
              variant="text"
              :loading="cambiandoRolId === item.id"
              @click="alternarRol(item)"
            >
              {{ item.rol_en_roster === 'Titular' ? 'Hacer suplente' : 'Hacer titular' }}
            </v-btn>

            <v-btn
              icon="mdi-delete"
              size="small"
              variant="text"
              color="error"
              title="Quitar del roster"
              @click="pedirQuitar(item)"
            />
          </template>
        </v-data-table>
      </v-card>
    </template>

    <v-alert v-else-if="!cargando" type="info" variant="tonal">
      No se encontró el roster solicitado.
    </v-alert>

    <!-- Asignación de jugador -->
    <v-dialog v-model="dialogoAsignar" max-width="560" persistent>
      <v-card>
        <v-card-title>Asignar jugador</v-card-title>

        <v-card-text>
          <MensajeError :mensaje="mensaje" :detalles="detalles" @cerrar="limpiar" />

          <v-progress-linear v-if="cargandoDisponibles" indeterminate class="mb-4" />

          <v-select
            v-model="formAsignar.jugador_id"
            :items="opcionesJugadores"
            item-title="title"
            item-value="value"
            label="Jugador *"
            :disabled="cargandoDisponibles"
            class="mb-1"
          />

          <v-select
            v-model="formAsignar.rol_en_roster"
            :items="ROLES_ROSTER"
            label="Condición *"
          />

          <div class="text-caption text-medium-emphasis">
            Máximo 5 titulares y un titular por rol de juego.
          </div>

          <v-alert
            v-if="!cargandoDisponibles && jugadoresDisponibles.length === 0"
            type="info"
            variant="tonal"
            density="compact"
            class="mt-3"
          >
            Todos los jugadores ya están asignados a este roster.
          </v-alert>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dialogoAsignar = false">Cancelar</v-btn>
          <v-btn
            color="primary"
            :loading="asignando"
            :disabled="jugadoresDisponibles.length === 0"
            @click="asignar"
          >
            Asignar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <ConfirmarDialog
      v-model="dialogoQuitar"
      titulo="Quitar jugador del roster"
      :mensaje="`¿Quitar a ${jugadorAQuitar?.nickname ?? ''} de este roster? El jugador no se elimina del sistema.`"
      :cargando="quitando"
      texto-confirmar="Quitar"
      @confirmar="confirmarQuitar"
    />

    <v-snackbar v-model="snackbar" color="success" timeout="3000">
      {{ snackbarTexto }}
    </v-snackbar>
  </v-container>
</template>
