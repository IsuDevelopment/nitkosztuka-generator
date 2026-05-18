---
name: add-page
description: "Add a new admin page with PrimeVue components and proper i18n."
---

# Skill: Add Page

## Inputs Required
- Page route (e.g. `/reports`, `/clients/[id]/edit`)
- Page purpose (list, detail, form, dashboard)
- Data source API endpoint

## Steps

1. **Create file** at `pages/{route}.vue` matching Nuxt file-based routing.

2. **Use page template:**
```vue
<template>
  <div>
    <div class="page-header">
      <h1>{{ $t('nav.pageTitle') }}</h1>
      <!-- Optional action buttons -->
    </div>

    <div v-if="pending" class="loading">
      <ProgressSpinner />
    </div>

    <template v-else>
      <!-- Page content -->
    </template>
  </div>
</template>

<script setup lang="ts">
const { t: $t } = useI18n()
const router = useRouter()
const toast = useToast()

const { data, pending, refresh } = await useFetch<ResponseType>('/api/endpoint')
</script>

<style scoped>
/* Use custom properties from assets/css/main.css */
</style>
```

3. **i18n:** Add all user-visible strings to `i18n/pl.json`. Use `$t('section.key')` in template.

4. **Navigation:** Add link to `layouts/default.vue` sidebar menu items array.

5. **Auth:** For public pages, add `definePageMeta({ layout: 'public' })` or `definePageMeta({ layout: false })`.

6. **Data patterns by page type:**

### List Page
```vue
<DataTable :value="items" :loading="pending" striped-rows row-hover @row-click="e => router.push(`/path/${e.data.id}`)">
  <Column field="name" :header="$t('field.name')" />
  <!-- more columns -->
</DataTable>
```

### Detail Page
```vue
const { data: entity, pending, refresh } = await useFetch<EntityType>(`/api/module/${route.params.id}`)
```

### Form Page
```vue
const form = reactive({ field1: '', field2: 0 })
const saving = ref(false)

async function submit() {
  saving.value = true
  try {
    await $fetch('/api/endpoint', { method: 'POST', body: toRaw(form) })
    toast.add({ severity: 'success', summary: 'Zapisano', life: 3000 })
    router.push('/target')
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Błąd', life: 3000 })
  } finally {
    saving.value = false
  }
}
```

## PrimeVue Event Handler Caveat
When binding `refresh` from `useFetch` to PrimeVue events:
```vue
<!-- WRONG -->
<Select @change="refresh" />

<!-- CORRECT -->
<Select @change="() => refresh()" />
```

## SSR Safety
Never access browser APIs without guard:
```ts
const url = computed(() => {
  if (!process.client) return ''
  return globalThis.location.origin + '/path'
})
```

## Checklist
- [ ] `const { t: $t } = useI18n()` at top of script setup
- [ ] All strings in `i18n/pl.json`
- [ ] Loading state handled with `<ProgressSpinner />`
- [ ] Error state handled (toast on catch)
- [ ] Navigation link added to sidebar
- [ ] `npx nuxi typecheck` passes
- [ ] No `window`/`document` access without `process.client` guard
