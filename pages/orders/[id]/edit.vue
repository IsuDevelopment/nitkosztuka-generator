<template>
  <div class="order-form-layout">
    <!-- Form panel -->
    <section class="order-panel no-print">
      <div class="page-header">
        <div class="flex items-center gap-3">
          <Button icon="pi pi-arrow-left" text @click="router.back()" />
          <h1>{{ $t('action.editOrder') }} · {{ order?.orderNumber }}</h1>
        </div>
      </div>

      <form @submit.prevent="submitOrder">
        <!-- Brand -->
        <div class="form-section-title">{{ $t('field.brand') }}</div>
        <div class="field">
          <label>{{ $t('field.brand') }} *</label>
          <Select v-model="form.brandId" :options="brands" option-label="name" option-value="id" class="w-full" required @change="onBrandChange" />
        </div>

        <!-- Client -->
        <div class="form-section-title">{{ $t('field.client') }}</div>
        <div class="field">
          <label>{{ $t('field.selectOrAddClient') }} *</label>
          <ClientSelect v-model="form.clientId" @client-selected="onClientSelected" />
        </div>

        <!-- Delivery -->
        <div class="form-section-title">{{ $t('section.delivery') }}</div>
        <div class="field">
          <label>{{ $t('field.deliveryMethod') }}</label>
          <Select
            v-model="form.deliveryMethodId"
            :options="deliveryMethods"
            option-label="name"
            option-value="id"
            class="w-full"
            show-clear
            @change="onDeliveryMethodChange"
          />
        </div>
        <div class="field">
          <label>{{ $t('field.deliveryDetails') }}</label>
          <Textarea v-model="form.deliveryDetails" class="w-full" rows="2" :placeholder="$t('placeholder.deliveryDetails')" />
        </div>
        <div class="field-row-2">
          <div class="field">
            <label>{{ $t('field.deliveryCost') }}</label>
            <InputNumber v-model="form.deliveryCost" mode="decimal" :min-fraction-digits="2" :max-fraction-digits="2" :min="0" class="w-full" />
          </div>
          <div class="field">
            <label>{{ $t('field.leadTime') }}</label>
            <InputText v-model="form.leadTime" class="w-full" />
          </div>
        </div>

        <!-- Products -->
        <div class="form-section-title">{{ $t('section.products') }}</div>
        <div v-for="(item, idx) in form.items" :key="idx" class="product-block">
          <div class="product-block-head">
            <span>{{ $t('field.product') }} {{ idx + 1 }}</span>
            <Button icon="pi pi-trash" text rounded size="small" severity="danger" @click="removeItem(idx)" />
          </div>
          <div class="field">
            <label>{{ $t('field.productName') }} *</label>
            <InputText v-model="item.name" class="w-full" required />
          </div>
          <div class="field">
            <label>{{ $t('field.details') }}</label>
            <Textarea v-model="item.details" class="w-full" rows="2" :placeholder="$t('placeholder.productDetails')" />
          </div>
          <div class="field-row-3">
            <div class="field">
              <label>{{ $t('field.quantity') }}</label>
              <InputNumber v-model="item.quantity" :min="1" class="w-full" />
            </div>
            <div class="field">
              <label>{{ $t('field.unitPrice') }}</label>
              <InputNumber v-model="item.unitPrice" mode="decimal" :min-fraction-digits="2" :max-fraction-digits="2" :min="0" class="w-full" />
            </div>
            <div class="field">
              <label>{{ $t('field.materialCost') }}</label>
              <InputNumber v-model="item.materialCost" mode="decimal" :min-fraction-digits="2" :max-fraction-digits="2" :min="0" class="w-full" />
            </div>
          </div>
          <div class="item-total">Razem: <strong>{{ formatMoney(item.unitPrice * item.quantity) }}</strong></div>
        </div>
        <Button type="button" :label="$t('action.addProduct')" icon="pi pi-plus" outlined class="w-full mt-2" @click="addItem" />

        <!-- Deposit -->
        <div class="form-section-title">{{ $t('field.depositAmount') }}</div>
        <div class="field">
          <label>{{ $t('field.depositAmount') }}</label>
          <InputNumber v-model="form.depositAmount" mode="decimal" :min-fraction-digits="2" :max-fraction-digits="2" :min="0" class="w-full" />
        </div>
        <!-- Discount -->
        <div class="form-section-title">{{ $t('section.discount') }}</div>
        <div class="field-row-2">
          <div class="field">
            <label>{{ $t('field.discount') }}</label>
            <InputNumber v-model="form.discount" mode="decimal" :min-fraction-digits="2" :max-fraction-digits="2" :min="0" class="w-full" />
          </div>
          <div class="field">
            <label>{{ $t('field.discountNote') }}</label>
            <InputText v-model="form.discountNote" class="w-full" :placeholder="$t('placeholder.discountNote')" />
          </div>
        </div>

        <!-- Tax -->
        <div class="form-section-title">{{ $t('section.tax') }}</div>
        <div class="field">
          <label>{{ $t('field.taxRate') }}</label>
          <Select v-model="form.taxRateId" :options="taxRates" option-label="name" option-value="id" class="w-full" show-clear />
        </div>

        <!-- Payment -->
        <div class="form-section-title">{{ $t('section.payment') }}</div>
        <div class="field">
          <label>{{ $t('field.paymentText') }}</label>
          <Textarea v-model="form.paymentText" class="w-full" rows="3" />
        </div>
        <div class="field">
          <label>{{ $t('field.handmadeText') }}</label>
          <Textarea v-model="form.handmadeText" class="w-full" rows="3" />
        </div>

        <!-- Internal -->
        <div class="form-section-title">{{ $t('section.internalNotes') }}</div>
        <div class="field">
          <label>{{ $t('field.notes') }}</label>
          <Textarea v-model="form.notes" class="w-full" rows="2" :placeholder="$t('placeholder.internalNotes')" />
        </div>

        <div class="flex gap-3 mt-4">
          <Button type="button" :label="$t('action.cancel')" outlined class="flex-1" @click="router.back()" />
          <Button type="submit" :label="$t('action.saveOrder')" class="flex-1" :loading="saving" />
        </div>
      </form>
    </section>

    <!-- Live preview -->
    <section class="order-preview-column">
      <div class="paper">
        <OrderPreview v-if="previewOrder" :order="previewOrder" />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const { t: $t } = useI18n()
const route = useRoute()
const router = useRouter()
const toast = useToast()

const id = route.params.id as string

const { data: order } = await useFetch<Record<string, unknown>>(`/api/orders/${id}`)
const { data: brandsData } = await useFetch('/api/brands')
const { data: taxRatesData } = await useFetch('/api/tax-rates')

const brands = computed(() => (brandsData.value as { id: string; name: string }[] | null) ?? [])
const taxRates = computed(() => (taxRatesData.value as { id: string; name: string }[] | null) ?? [])

const deliveryMethods = ref<{ id: string; name: string; defaultCost: number }[]>([])
const selectedBrand = ref<Record<string, unknown> | null>(null)
const selectedClient = ref<Record<string, unknown> | null>(null)

interface ItemForm {
  id?: string
  name: string
  details: string
  quantity: number
  unitPrice: number
  materialCost: number
  sortOrder?: number
}

const form = reactive({
  brandId: '',
  clientId: null as string | null,
  deliveryMethodId: null as string | null,
  deliveryDetails: '',
  deliveryCost: 0,
  leadTime: '',
  discount: 0,
  discountNote: '',
  taxRateId: null as string | null,
  paymentText: '',
  handmadeText: '',
  notes: '',
  depositAmount: null as number | null,
  items: [] as ItemForm[],
})

// Pre-fill form from existing order
if (order.value) {
  const o = order.value
  form.brandId = o.brandId as string
  form.clientId = o.clientId as string
  form.deliveryMethodId = (o.deliveryMethodId as string | null) ?? null
  form.deliveryDetails = (o.deliveryDetails as string) ?? ''
  form.deliveryCost = Number(o.deliveryCost ?? 0)
  form.leadTime = (o.leadTime as string) ?? ''
  form.discount = Number(o.discount ?? 0)
  form.discountNote = (o.discountNote as string) ?? ''
  form.taxRateId = (o.taxRateId as string | null) ?? null
  form.paymentText = (o.paymentText as string) ?? ''
  form.handmadeText = (o.handmadeText as string) ?? ''
  form.notes = (o.notes as string) ?? ''
  form.depositAmount = o.depositAmount !== undefined ? Number(o.depositAmount) : null
  form.items = (o.items as ItemForm[] ?? []).map(i => ({
    id: i.id,
    name: i.name,
    details: (i.details as string) ?? '',
    quantity: Number(i.quantity),
    unitPrice: Number(i.unitPrice),
    materialCost: Number(i.materialCost ?? 0),
    sortOrder: i.sortOrder,
  }))
  selectedBrand.value = o.brand as Record<string, unknown> | null
  selectedClient.value = o.client as Record<string, unknown> | null
}

// Load delivery methods for current brand
onMounted(async () => {
  if (form.brandId) {
    const methods = await $fetch<typeof deliveryMethods.value>('/api/delivery-methods', {
      query: { brandId: form.brandId, activeOnly: 'true' },
    })
    deliveryMethods.value = methods
  }
})

async function onBrandChange() {
  const brand = brands.value.find(b => b.id === form.brandId) as Record<string, string> | undefined
  if (!brand) return
  selectedBrand.value = brand as Record<string, unknown>
  const methods = await $fetch<typeof deliveryMethods.value>('/api/delivery-methods', {
    query: { brandId: form.brandId, activeOnly: 'true' },
  })
  deliveryMethods.value = methods
}

function onDeliveryMethodChange() {
  const method = deliveryMethods.value.find(m => m.id === form.deliveryMethodId)
  if (method) form.deliveryCost = Number(method.defaultCost)
}

function onClientSelected(client: { id?: string; firstName?: string; lastName?: string; fullName?: string; email?: string; phone?: string; defaultAddress?: string }) {
  selectedClient.value = client as Record<string, unknown>
}

function addItem() {
  form.items.push({ name: '', details: '', quantity: 1, unitPrice: 0, materialCost: 0 })
}

function removeItem(idx: number) {
  form.items.splice(idx, 1)
}

function formatMoney(v: number) {
  return Number(v).toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' zł'
}

const previewOrder = computed(() => ({
  orderNumber: (order.value?.orderNumber as string) ?? 'PODGLĄD',
  createdAt: (order.value?.createdAt as string) ?? new Date().toISOString(),
  brand: (selectedBrand.value ?? brands.value.find(b => b.id === form.brandId)) as { name?: string; subtitle?: string } | undefined,
  client: selectedClient.value as { firstName?: string; lastName?: string; email?: string; phone?: string } | null | undefined,
  deliveryMethod: deliveryMethods.value.find(m => m.id === form.deliveryMethodId) as { name?: string } | undefined,
  deliveryMethodName: deliveryMethods.value.find(m => m.id === form.deliveryMethodId)?.name ?? '',
  deliveryDetails: form.deliveryDetails,
  deliveryCost: form.deliveryCost,
  discount: form.discount,
  discountNote: form.discountNote,
  leadTime: form.leadTime,
  paymentText: form.paymentText,
  handmadeText: form.handmadeText,
  paymentStatus: (order.value?.paymentStatus as string) ?? 'PENDING',
  items: form.items.map((item, idx) => ({ id: item.id ?? String(idx), name: item.name, details: item.details, quantity: item.quantity, unitPrice: item.unitPrice, materialCost: item.materialCost })),
}))

const saving = ref(false)

async function submitOrder() {
  if (!form.clientId) {
    toast.add({ severity: 'warn', summary: 'Wybierz klienta', life: 3000 })
    return
  }
  if (!form.items.length) {
    toast.add({ severity: 'warn', summary: 'Dodaj co najmniej jeden produkt', life: 3000 })
    return
  }

  saving.value = true
  try {
    const payload = {
      ...form,
      depositAmount: form.depositAmount ?? undefined,
      items: form.items.map(({ id, name, details, quantity, unitPrice, materialCost, sortOrder }) => ({
        id,
        name,
        details,
        quantity,
        unitPrice,
        materialCost,
        sortOrder,
      })),
    }
    await $fetch(`/api/orders/${id}`, { method: 'PUT', body: payload })
    toast.add({ severity: 'success', summary: 'Zamówienie zapisane', life: 3000 })
    router.push(`/orders/${id}`)
  } catch (err: unknown) {
    const e = err as { data?: { message?: string } }
    toast.add({ severity: 'error', summary: e?.data?.message ?? 'Błąd', life: 4000 })
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.order-form-layout {
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 860px;
}

.order-panel {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 18px;
  padding: 22px;
}

.order-preview-column {
  /* below the form */
}

.form-section-title {
  margin: 20px 0 10px;
  padding-top: 14px;
  border-top: 1px solid var(--line);
  color: var(--accent-dark);
  font-weight: 800;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.field { display: flex; flex-direction: column; gap: 5px; margin-bottom: 10px; }
.field label { font-size: 12px; font-weight: 700; }

.field-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.field-row-3 { display: grid; grid-template-columns: 80px 1fr 1fr; gap: 10px; }

.product-block {
  padding: 12px;
  background: var(--soft);
  border: 1px solid var(--line);
  border-radius: 12px;
  margin-bottom: 10px;
}

.product-block-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: var(--accent-dark);
  font-weight: 800;
  font-size: 13px;
  margin-bottom: 8px;
}

.item-total {
  text-align: right;
  font-size: 12px;
  color: var(--muted);
  margin-top: 4px;
}


</style>
