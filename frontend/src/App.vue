<template>
  <div class="app">
    <header class="app-header">
      <h1 class="app-title">Pulse Overage Explorer</h1>
    </header>

    <main class="app-main">
      <OverageDashboard :tenant-id="tenantId" />
    </main>
  </div>
</template>

<script setup lang="ts">
  import OverageDashboard from '@/components/OverageDashboard.vue';

  const tenantId = '123';
  
</script>

