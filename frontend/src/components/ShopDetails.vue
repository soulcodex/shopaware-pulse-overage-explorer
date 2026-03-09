<template>
  <aside v-if="shop" class="shop-details" role="dialog" aria-label="Shop details">
    <header class="shop-details__header">
      <h2 class="shop-details__title">{{ shop.name }}</h2>
      <button
        type="button"
        class="shop-details__close"
        aria-label="Close"
        @click="$emit('close')"
      >
        ×
      </button>
    </header>

    <div class="shop-details__body">
      <dl class="shop-details__grid">
        <dt class="shop-details__term">Plan</dt>
        <dd class="shop-details__value">{{ shop.plan }}</dd>

        <dt class="shop-details__term">Status</dt>
        <dd class="shop-details__value">
          <span :class="['shop-details__status', `shop-details__status--${shop.status}`]">
            {{ statusLabel }}
          </span>
        </dd>

        <dt class="shop-details__term">Usage</dt>
        <dd class="shop-details__value">{{ formatNumber(shop.usage) }}</dd>

        <dt class="shop-details__term">Included</dt>
        <dd class="shop-details__value">{{ formatNumber(shop.included_usage) }}</dd>

        <dt class="shop-details__term">Overage charges</dt>
        <dd class="shop-details__value">{{ formatCurrency(shop.overage_charges) }}</dd>

        <dt class="shop-details__term">Created</dt>
        <dd class="shop-details__value">{{ formatDate(shop.created_at) }}</dd>

        <dt class="shop-details__term">Updated</dt>
        <dd class="shop-details__value">{{ formatDate(shop.updated_at) }}</dd>
      </dl>

      <section v-if="shop" class="shop-details__notes" aria-label="Support notes">
        <h3 class="shop-details__notes-title">Notes</h3>
        <ul v-if="notesForShop.length" class="shop-details__notes-list">
          <li
            v-for="note in notesForShop"
            :key="note.id"
            class="shop-details__note"
          >
            <p class="shop-details__note-content">{{ note.content }}</p>
            <span class="shop-details__note-meta">{{ note.author.name }}</span>
          </li>
        </ul>
        <p v-else class="shop-details__notes-empty">No notes yet.</p>
      </section>

      <form class="shop-details__form" @submit.prevent="onSubmit">
        <label class="shop-details__label" :for="noteId">Add a note</label>
        <textarea
          :id="noteId"
          v-model="noteContent"
          class="shop-details__textarea"
          :class="{ 'shop-details__textarea--error': showNoteError }"
          rows="4"
          placeholder="Enter your note…"
          :aria-invalid="showNoteError"
          :aria-describedby="showNoteError ? noteErrorId : undefined"
          @input="showNoteError = false"
        />
        <div class="shop-details__error-wrapper" aria-live="polite">
          <p
            v-if="showNoteError"
            :id="noteErrorId"
            class="shop-details__error"
            role="alert"
          >
            Please enter at least one character.
          </p>
        </div>
        <button type="submit" class="shop-details__submit">
          Submit
        </button>
      </form>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { Shop, TenantId, SupportNote } from '@/services/shopApi';
import { createSupportNote } from '@/services/shopApi';
import notesFixture from '../../fixtures/notes.json';

const props = defineProps<{
  shop: Shop | null;
  tenantId: TenantId;
}>();

defineEmits<{
  close: [];
}>();

const noteId = 'shop-details-note';
const noteErrorId = 'shop-details-note-error';

const noteContent = ref('');
const showNoteError = ref(false);

const notesByShop = notesFixture as Record<string, SupportNote[]>;
const addedNotes = ref<SupportNote[]>([]);

const notesForShop = computed(() => {
  if (!props.shop) return [];
  const fixture = notesByShop[props.shop.id] ?? [];
  return [...fixture, ...addedNotes.value];
});

watch(
  () => props.shop?.id,
  () => {
    addedNotes.value = [];
  },
);

async function onSubmit() {
  const trimmed = noteContent.value.trim();
  if (trimmed.length === 0) {
    showNoteError.value = true;
    return;
  }
  if (!props.shop || !props.tenantId) return;
  const author = { id: 'current-user', name: 'User' };
  try {
    await createSupportNote(
      props.shop.id,
      props.tenantId,
      { author, content: trimmed },
    );
    addedNotes.value.push({
      id: `note-${Date.now()}`,
      author,
      content: trimmed,
    });
    noteContent.value = '';
  } catch {
    // Could show a toast or inline error
  }
}

const statusLabel = computed(() => {
  if (!props.shop) return '';
  const s = props.shop.status;
  if (s === 'active') return 'Active';
  if (s === 'past_due') return 'Past due';
  return 'Cancelled';
});

function formatNumber(n: number) {
  return new Intl.NumberFormat().format(n);
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    dateStyle: 'medium',
  });
}
</script>

<style scoped>
.shop-details {
  width: 100%;
  min-width: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--shop-details-bg, #1a1a1a);
  border-left: 1px solid var(--shop-details-border, #333);
  box-shadow: -4px 0 12px rgba(0, 0, 0, 0.2);
}

.shop-details__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--shop-details-border, #333);
  flex-shrink: 0;
}

.shop-details__title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.shop-details__close {
  flex-shrink: 0;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  font-size: 1.5rem;
  line-height: 1;
  color: inherit;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.shop-details__close:hover {
  background: rgba(255, 255, 255, 0.08);
}

.shop-details__close:focus-visible {
  outline: 2px solid #646cff;
  outline-offset: 2px;
}

.shop-details__body {
  padding: 1.25rem;
  overflow: auto;
  flex: 1;
  min-height: 0;
}

.shop-details__grid {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.5rem 1.5rem;
  margin: 0;
}

.shop-details__term {
  margin: 0;
  color: var(--shop-details-muted, #888);
  font-size: 0.875rem;
}

.shop-details__value {
  margin: 0;
  font-size: 0.9375rem;
}

.shop-details__status {
  display: inline-block;
  padding: 0.2em 0.5em;
  border-radius: 4px;
  font-size: 0.8125rem;
  font-weight: 500;
}

.shop-details__status--active {
  background: rgba(55, 208, 70, 0.2);
  color: #37d046;
}

.shop-details__status--past_due {
  background: rgba(255, 152, 0, 0.2);
  color: #ff9800;
}

.shop-details__status--cancelled {
  background: rgba(222, 41, 76, 0.2);
  color: #de294c;
}

.shop-details__notes {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--shop-details-border, #333);
}

.shop-details__notes-title {
  margin: 0 0 0.75rem;
  font-size: 1rem;
  font-weight: 600;
}

.shop-details__notes-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.shop-details__note {
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  background: var(--shop-details-note-bg, #252525);
  border-radius: 6px;
  border: 1px solid var(--shop-details-border, #333);
}

.shop-details__note-content {
  margin: 0 0 0.5rem;
  font-size: 0.9375rem;
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: break-word;
}

.shop-details__note-meta {
  font-size: 0.8125rem;
  color: var(--shop-details-muted, #888);
}

.shop-details__notes-empty {
  margin: 0;
  font-size: 0.875rem;
  color: var(--shop-details-muted, #888);
}

.shop-details__form {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--shop-details-border, #333);
}

.shop-details__label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.shop-details__textarea {
  width: 100%;
  padding: 0.5rem 0.75rem;
  font: inherit;
  font-size: 0.9375rem;
  line-height: 1.4;
  color: inherit;
  background: var(--shop-details-input-bg, #2a2a2a);
  border: 1px solid var(--shop-details-border, #333);
  border-radius: 6px;
  resize: vertical;
  box-sizing: border-box;
}

.shop-details__textarea--error {
  border-color: #de294c;
}

.shop-details__textarea:focus {
  outline: none;
  border-color: #646cff;
  box-shadow: 0 0 0 2px rgba(100, 108, 255, 0.3);
}

.shop-details__error {
  margin: 0.5rem 0 0;
  font-size: 0.875rem;
  color: #de294c;
}

.shop-details__submit {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  font: inherit;
  font-size: 0.9375rem;
  font-weight: 500;
  color: #fff;
  background: #646cff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.shop-details__submit:hover {
  background: #535bf2;
}

.shop-details__submit:focus-visible {
  outline: 2px solid #646cff;
  outline-offset: 2px;
}

@media (prefers-color-scheme: light) {
  .shop-details {
    --shop-details-bg: #f5f5f5;
    --shop-details-border: #e0e0e0;
  }

  .shop-details__term {
    --shop-details-muted: #666;
  }

  .shop-details__close:hover {
    background: rgba(0, 0, 0, 0.06);
  }

  .shop-details__textarea {
    --shop-details-input-bg: #eee;
  }

  .shop-details__note {
    --shop-details-note-bg: #eee;
  }
}
</style>
