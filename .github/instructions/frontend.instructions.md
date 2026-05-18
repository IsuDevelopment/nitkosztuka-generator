---
description: "Frontend pages, components, PrimeVue usage, i18n, and styling conventions."
applyTo: "pages/**,components/**,layouts/**,assets/**,i18n/**"
---

# Frontend Module

## Technology
- Vue 3 Composition API (`<script setup lang="ts">`)
- PrimeVue 4 (Aura preset, custom `NitkoTheme` warm palette)
- Tailwind CSS v4 (utility classes)
- Custom CSS vars in `assets/css/main.css`

## Page Template
```vue
<template>
  <div>
    <div class="page-header">
      <h1>{{ $t('nav.pageName') }}</h1>
      <Button icon="pi pi-plus" :label="$t('action.create')" @click="..." />
    </div>
    <!-- content -->
  </div>
</template>

<script setup lang="ts">
const { t: $t } = useI18n()
const router = useRouter()
const toast = useToast()
// ...
</script>

<style scoped>
/* use custom properties from assets/css/main.css */
</style>
```

## Mandatory Conventions

### useI18n
Every page and component with user-visible text MUST declare:
```ts
const { t: $t } = useI18n()
```
at the top of `<script setup>`. This provides proper typing. Do NOT use `useNuxtApp().$t`.

### PrimeVue Components
Preferred components (auto-imported via `@primevue/nuxt-module`):
- Layout: `Divider`, `Card`, `Panel`
- Data: `DataTable`, `Column`, `Tag`, `ProgressSpinner`
- Form: `InputText`, `InputNumber`, `Textarea`, `Select`, `AutoComplete`, `DatePicker`, `Checkbox`
- Actions: `Button`, `Dialog`, `ConfirmDialog`
- Feedback: `Toast` (via `useToast()`)
- Charts: `Chart` (Chart.js wrapper)

### Data Fetching
```ts
// For SSR-compatible fetch:
const { data, pending, refresh } = await useFetch<ResponseType>('/api/endpoint')

// For client-side actions:
await $fetch('/api/endpoint', { method: 'POST', body: { ... } })
```

### Event Handlers in Templates
When passing `refresh` or similar functions to PrimeVue events that emit event objects:
```vue
<!-- WRONG: type mismatch -->
<Select @change="refresh" />

<!-- CORRECT: wrap in arrow function -->
<Select @change="() => refresh()" />
```

### SSR Safety
- Never access `window`, `document`, or `navigator` without `process.client` guard.
- Use `globalThis.location` inside `process.client` blocks only.

## i18n

### File: `i18n/pl.json`
Flat structure with dot-prefixed sections:
```json
{
  "nav.dashboard": "Panel główny",
  "nav.orders": "Zamówienia",
  "field.firstName": "Imię",
  "action.save": "Zapisz",
  "info.shareDisabled": "Link jest wyłączony"
}
```
Sections: `nav.*`, `field.*`, `action.*`, `section.*`, `info.*`, `status.*`, `placeholder.*`.

### Adding a New Translation
1. Add key-value to `i18n/pl.json`.
2. Use in template: `$t('section.newKey')`.
3. Keep keys alphabetically sorted within their section.

## CSS Architecture

### Custom Properties (assets/css/main.css)
```css
:root {
  --accent: #b48a72;
  --accent-dark: #8c6250;
  --bg: #fbf7f3;
  --surface: #ffffff;
  --text: #2d2825;
  --muted: #9c807a;
  --line: #e9ded6;
}
```

### Utility Classes
- `.page-header` — flex row, title + actions
- `.dialog-form` — form layout inside Dialog
- `.paper` — A4-style print container
- `.no-print` — hidden when printing
- `.loading` — centered spinner

### Print Styles
Pages with printable content use `.no-print` on sidebar, header, and action buttons.
The `OrderPreview.vue` component is the print target.

## Component Patterns

### Form Dialog Pattern
```vue
<Dialog :visible="visible" @update:visible="$emit('update:visible', $event)" :header="..." modal>
  <form @submit.prevent="save">
    <!-- fields -->
    <div class="dialog-footer">
      <Button type="button" :label="$t('action.cancel')" severity="secondary" text @click="$emit('update:visible', false)" />
      <Button type="submit" :label="$t('action.save')" :loading="saving" />
    </div>
  </form>
</Dialog>
```

### Existing Components
| Component | Purpose | Used In |
|-----------|---------|---------|
| `OrderPreview.vue` | A4 order summary (no materialCost) | orders/[id], orders/new, share/[hash] |
| `OrderStatusBadge.vue` | Colored Tag for status display | orders/index, orders/[id] |
| `ClientFormDialog.vue` | Create/edit client modal | clients/index, clients/[id], ClientSelect |
| `ClientSelect.vue` | AutoComplete + inline create | orders/new |

## Layouts
- `layouts/default.vue` — Admin: sidebar (collapsible) + topbar with logout. Used by all admin pages.
- `layouts/public.vue` — Minimal: no sidebar, centered content. Used by `share/[hash].vue`.
- `pages/login.vue` — Uses `definePageMeta({ layout: false })`.
