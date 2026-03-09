<template>
  <section class="overage-dashboard">
    <div v-if="isLoading" class="overage-dashboard__state">
      Loading shops…
    </div>

    <div v-else-if="hasError" class="overage-dashboard__state overage-dashboard__state--error">
      An error occurred while loading shops.
    </div>

    <MtDataTable
      v-else-if="shops.length"
      title="Shops"
      :data-source="displayShops"
      :columns="columns"
      :current-page="1"
      :pagination-limit="displayShops.length"
      :pagination-total-items="displayShops.length"
      :pagination-options="[displayShops.length]"
      :is-loading="false"
      :enable-reload="false"
      :disable-settings-table="true"
      :disable-edit="true"
      :disable-delete="true"
      @open-details="onShopClick"
    />

    <div v-else class="overage-dashboard__state">
      No shops found.
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { getShops, type Shop, type TenantId } from '@/services/shopApi';

const props = defineProps<{
  tenantId: TenantId;
}>();

const emit = defineEmits<{
  'shop-click': [shop: Shop];
}>();

const shops = ref<Shop[]>([]);

function formatOverageEur(value: number): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

const displayShops = computed(() =>
  shops.value.map((shop) => ({
    ...shop,
    plan_label: shop.plan.charAt(0).toUpperCase() + shop.plan.slice(1),
    overage_eur: formatOverageEur(shop.overage_charges),
  })),
);

const columns = [
  { label: 'Name', property: 'name', renderer: 'text', position: 0, clickable: true },
  { label: 'Plan', property: 'plan_label', renderer: 'text', position: 100 },
  {
    label: 'Status',
    property: 'status',
    renderer: 'badge',
    position: 200,
    rendererOptions: {
      renderItemBadge: (data: Shop) => {
        const s = data.status;
        if (s === 'active') return { variant: 'positive', label: 'Active' };
        if (s === 'past_due') return { variant: 'warning', label: 'Past due' };
        return { variant: 'critical', label: 'Cancelled' };
      },
    },
  },
  { label: 'Usage', property: 'usage', renderer: 'number', position: 300 },
  { label: 'Included', property: 'included_usage', renderer: 'number', position: 400 },
  { label: 'Overage', property: 'overage_eur', renderer: 'text', position: 500 },
];
const isLoading = ref(false);
const hasError = ref(false);

function onShopClick(shop: Shop) {
  emit('shop-click', shop);
}

onMounted(async () => {
  if (!props.tenantId) {
    hasError.value = true;
    return;
  }

  isLoading.value = true;
  hasError.value = false;

  try {
    shops.value = await getShops(props.tenantId);
  } catch {
    hasError.value = true;
  } finally {
    isLoading.value = false;
  }
});
</script>


