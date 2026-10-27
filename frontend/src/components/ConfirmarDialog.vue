<script setup lang="ts">
withDefaults(defineProps<{
  modelValue: boolean
  titulo: string
  mensaje: string
  cargando?: boolean
  textoConfirmar?: string
}>(), {
  cargando: false,
  textoConfirmar: 'Eliminar',
})

defineEmits<{
  'update:modelValue': [valor: boolean]
  confirmar: []
}>()
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    max-width="460"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card>
      <v-card-title>{{ titulo }}</v-card-title>

      <v-card-text>{{ mensaje }}</v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="$emit('update:modelValue', false)">
          Cancelar
        </v-btn>
        <v-btn color="error" :loading="cargando" @click="$emit('confirmar')">
          {{ textoConfirmar }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
