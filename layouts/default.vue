<template>
  <div class="app-layout">
    <aside :class="['sidebar', { 'sidebar--collapsed': sidebarCollapsed }]">
      <div class="sidebar-brand">
        <span class="sidebar-logo">NS</span>
        <span v-if="!sidebarCollapsed" class="sidebar-name">Nitko Sztuka</span>
      </div>

      <nav class="sidebar-nav">
        <NuxtLink to="/" class="nav-item" active-class="nav-item--active">
          <i class="pi pi-home" />
          <span v-if="!sidebarCollapsed">{{ $t('nav.dashboard') }}</span>
        </NuxtLink>
        <NuxtLink to="/orders" class="nav-item" active-class="nav-item--active">
          <i class="pi pi-file-edit" />
          <span v-if="!sidebarCollapsed">{{ $t('nav.orders') }}</span>
        </NuxtLink>
        <NuxtLink to="/clients" class="nav-item" active-class="nav-item--active">
          <i class="pi pi-users" />
          <span v-if="!sidebarCollapsed">{{ $t('nav.clients') }}</span>
        </NuxtLink>

        <div v-if="!sidebarCollapsed" class="nav-section-label">{{ $t('nav.settings') }}</div>

        <NuxtLink to="/brands" class="nav-item" active-class="nav-item--active">
          <i class="pi pi-tag" />
          <span v-if="!sidebarCollapsed">{{ $t('nav.brands') }}</span>
        </NuxtLink>
        <NuxtLink to="/delivery-methods" class="nav-item" active-class="nav-item--active">
          <i class="pi pi-truck" />
          <span v-if="!sidebarCollapsed">{{ $t('nav.deliveryMethods') }}</span>
        </NuxtLink>
        <NuxtLink to="/tax-rates" class="nav-item" active-class="nav-item--active">
          <i class="pi pi-percentage" />
          <span v-if="!sidebarCollapsed">{{ $t('nav.taxRates') }}</span>
        </NuxtLink>
        <NuxtLink to="/users" class="nav-item" active-class="nav-item--active">
          <i class="pi pi-user" />
          <span v-if="!sidebarCollapsed">{{ $t('nav.users') }}</span>
        </NuxtLink>
        <NuxtLink to="/audit" class="nav-item" active-class="nav-item--active">
          <i class="pi pi-history" />
          <span v-if="!sidebarCollapsed">{{ $t('nav.audit') }}</span>
        </NuxtLink>
      </nav>

      <button class="sidebar-toggle" @click="sidebarCollapsed = !sidebarCollapsed">
        <i :class="sidebarCollapsed ? 'pi pi-angle-right' : 'pi pi-angle-left'" />
      </button>
    </aside>

    <div class="main-area">
      <header class="topbar">
        <button class="topbar-mobile-menu" @click="sidebarCollapsed = !sidebarCollapsed">
          <i class="pi pi-bars" />
        </button>
        <div class="topbar-spacer" />
        <div class="topbar-user">
          <NuxtLink to="/profile" class="topbar-user-name" :title="$t('nav.profile')">{{ user?.name }}</NuxtLink>
          <Button icon="pi pi-sign-out" text rounded size="small" :title="$t('action.logout')" :loading="logoutLoading" :disabled="logoutLoading" @click="logout" />
        </div>
      </header>

      <main class="page-content">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t: $t } = useI18n()
const toast = useToast()
const { user, fetch: refreshSession } = useUserSession()
const sidebarCollapsed = ref(false)
const logoutLoading = ref(false)

async function logout() {
  if (logoutLoading.value) return
  logoutLoading.value = true
  try {
    await $fetch('/api/auth/logout', { method: 'POST' })
    await refreshSession()
    await navigateTo('/login', { replace: true })
  } catch {
    toast.add({ severity: 'error', summary: $t('error.generic'), life: 3000 })
  } finally {
    logoutLoading.value = false
  }
}
</script>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
  background: var(--bg);
}

.sidebar {
  width: 220px;
  min-height: 100vh;
  background: #fff;
  border-right: 1px solid var(--line);
  display: flex;
  flex-direction: column;
  transition: width 0.2s;
  flex-shrink: 0;
}

.sidebar--collapsed {
  width: 58px;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 18px 14px 12px;
  border-bottom: 1px solid var(--line);
  overflow: hidden;
  white-space: nowrap;
}

.sidebar-logo {
  font-size: 18px;
  font-weight: 900;
  color: var(--accent-dark);
  flex-shrink: 0;
  width: 30px;
  text-align: center;
}

.sidebar-name {
  font-weight: 800;
  font-size: 14px;
  color: var(--text);
}

.sidebar-nav {
  flex: 1;
  padding: 10px 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
}

.nav-section-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--muted);
  letter-spacing: 0.08em;
  padding: 10px 8px 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  text-decoration: none;
  white-space: nowrap;
  transition: background 0.15s, color 0.15s;
}

.nav-item:hover {
  background: var(--soft);
}

.nav-item--active {
  background: var(--accent);
  color: #fff;
}

.nav-item .pi {
  flex-shrink: 0;
  font-size: 15px;
  width: 18px;
  text-align: center;
}

.sidebar-toggle {
  margin: 8px;
  padding: 8px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  color: var(--muted);
  font-size: 13px;
}

.main-area {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.topbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 20px;
  height: 56px;
  background: #fff;
  border-bottom: 1px solid var(--line);
  flex-shrink: 0;
}

.topbar-mobile-menu {
  display: none;
  border: none;
  background: none;
  font-size: 18px;
  cursor: pointer;
  color: var(--text);
}

.topbar-spacer { flex: 1; }

.topbar-user {
  display: flex;
  align-items: center;
  gap: 8px;
}

.topbar-user-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--text);
  text-decoration: none;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background 0.15s;
}

.topbar-user-name:hover {
  background: var(--line);
}

.page-content {
  flex: 1;
  padding: 24px;
  overflow: auto;
}

@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    z-index: 100;
    height: 100vh;
    transform: translateX(0);
  }

  .sidebar--collapsed {
    transform: translateX(-100%);
    width: 220px;
  }

  .topbar-mobile-menu {
    display: block;
  }

  .page-content {
    padding: 16px;
  }
}
</style>
