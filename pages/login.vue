<template>
  <div class="login-root">
    <div class="login-card">
      <div class="login-brand">
        <div class="login-logo">NS</div>
        <div class="login-title">Nitko Sztuka</div>
        <div class="login-subtitle">Panel zarządzania zamówieniami</div>
      </div>

      <form class="login-form" @submit.prevent="handleLogin">
        <div class="field">
          <label for="login">Login</label>
          <InputText
            id="login"
            v-model="form.login"
            autocomplete="username"
            :class="{ 'p-invalid': error }"
            placeholder="Twój login"
          />
        </div>
        <div class="field">
          <label for="password">Hasło</label>
          <Password
            id="password"
            v-model="form.password"
            :feedback="false"
            toggle-mask
            autocomplete="current-password"
            :class="{ 'p-invalid': error }"
            placeholder="Twoje hasło"
          />
        </div>
        <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
        <Button
          type="submit"
          label="Zaloguj się"
          class="w-full"
          :loading="loading"
        />
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const { fetch: refreshSession } = useUserSession()
const router = useRouter()

const form = reactive({ login: '', password: '' })
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: { login: form.login, password: form.password },
    })
    await refreshSession()
    router.push('/')
  } catch (err: unknown) {
    const e = err as { data?: { message?: string } }
    error.value = e?.data?.message ?? 'Błąd logowania'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-root {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg);
  padding: 24px;
}

.login-card {
  width: 100%;
  max-width: 380px;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 20px;
  padding: 36px 32px;
  box-shadow: 0 14px 36px rgba(60, 45, 35, 0.1);
}

.login-brand {
  text-align: center;
  margin-bottom: 28px;
}

.login-logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: var(--accent);
  color: #fff;
  font-size: 20px;
  font-weight: 900;
  margin-bottom: 12px;
}

.login-title {
  font-size: 22px;
  font-weight: 900;
  color: var(--accent-dark);
}

.login-subtitle {
  font-size: 13px;
  color: var(--muted);
  margin-top: 4px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field label {
  font-size: 13px;
  font-weight: 700;
  color: var(--text);
}

.field :deep(.p-inputtext),
.field :deep(.p-password-input) {
  width: 100%;
}

.field :deep(.p-password) {
  width: 100%;
}
</style>
