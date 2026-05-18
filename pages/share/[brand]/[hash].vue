<template>
  <div class="share-page">
    <div v-if="pending" class="loading">
      <ProgressSpinner style="width: 40px; height: 40px" />
    </div>
    <template v-else-if="order">
      <div class="paper">
        <OrderPreview :order="order" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'public' })

const route = useRoute()

const { data: order, pending } = await useFetch(`/api/share/${route.params.brand}/${route.params.hash}`)
</script>
