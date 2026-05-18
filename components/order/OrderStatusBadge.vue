<template>
  <Tag :value="label" :severity="severity" />
</template>

<script setup lang="ts">
const props = defineProps<{ type: 'acceptance' | 'payment' | 'delivery'; value: string }>()

const configs: Record<string, Record<string, { label: string; severity: string }>> = {
  acceptance: {
    PENDING: { label: 'Oczekuje', severity: 'warn' },
    ACCEPTED: { label: 'Zaakceptowane', severity: 'success' },
  },
  payment: {
    PENDING: { label: 'Do opłacenia', severity: 'warn' },
    DEPOSIT_PAID: { label: 'Zaliczka', severity: 'info' },
    PAID: { label: 'Opłacone', severity: 'success' },
  },
  delivery: {
    PENDING: { label: 'Oczekuje', severity: 'secondary' },
    IN_PRODUCTION: { label: 'W trakcie', severity: 'warn' },
    IN_DELIVERY: { label: 'W dostawie', severity: 'info' },
    DELIVERED: { label: 'Dostarczone', severity: 'success' },
    COMPLETED: { label: 'Zakończone', severity: 'contrast' },
  },
}

const config = computed(() => configs[props.type]?.[props.value] ?? { label: props.value, severity: 'secondary' })
const label = computed(() => config.value.label)
const severity = computed(() => config.value.severity)
</script>
