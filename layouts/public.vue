<template>
  <div class="public-layout">
    <slot />
  </div>
</template>

<style scoped>
.public-layout {
  min-height: 100vh;
  background: var(--bg);
  padding: 24px 16px;
}
</style>
