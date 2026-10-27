<script setup lang="ts">
defineProps<{
  mensaje: string
  detalles?: string
}>()

defineEmits<{
  cerrar: []
}>()
</script>

<template>
  <v-alert
    v-if="mensaje"
    type="error"
    variant="tonal"
    density="compact"
    closable
    class="mb-4"
    @click:close="$emit('cerrar')"
  >
    <div class="font-weight-medium">{{ mensaje }}</div>
    <div v-if="detalles" class="text-caption mt-1">{{ detalles }}</div>
  </v-alert>
</template>
