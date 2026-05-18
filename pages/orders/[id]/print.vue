<template>
  <div v-if="order">
    <OrderPreview :order="order" />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'public' })

const route = useRoute()
const { data: order } = await useFetch<Record<string, unknown>>(`/api/orders/${route.params.id}`)

onMounted(() => {
  nextTick(() => window.print())
})
</script>

<style>
@media print {
  .public-layout { padding: 0 !important; background: #fff !important; }
  @page { size: A4; margin: 0; }
}
</style>
