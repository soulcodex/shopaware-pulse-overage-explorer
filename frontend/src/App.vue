<template>
  <div class="app">
    <header class="app-header">
      <h1 class="app-title">Pulse Overage Explorer</h1>
    </header>

    <main class="app-main">
      <div class="app-main__content">
        <OverageDashboard :tenant-id="tenantId" @shop-click="selectedShop = $event" />
      </div>
      <div v-if="selectedShop" class="app-main__panel">
        <ShopDetails :shop="selectedShop" :tenant-id="tenantId" @close="selectedShop = null" />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import OverageDashboard from '@/components/OverageDashboard.vue';
  import ShopDetails from '@/components/ShopDetails.vue';
  import type { Shop } from '@/services/shopApi';

  const tenantId = '123';
  const selectedShop = ref<Shop | null>(null);
</script>

<style scoped>
  .app {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    width: 100%;
    text-align: left;
  }

  .app-main {
    display: flex;
    flex: 1;
    min-height: 0;
    width: 100%;
  }

  .app-main__content {
    flex: 1;
    min-width: 0;
    overflow: auto;
  }

  .app-main__panel {
    width: min(420px, 40%);
    flex-shrink: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  .app-title {
    font-size: 2rem;
    font-weight: 600;
    margin: 0;
    padding: 0;
    text-align: center;
    margin-block-end: 2rem;
  }
</style>
