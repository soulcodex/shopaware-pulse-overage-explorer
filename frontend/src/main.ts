import { createApp } from 'vue';
import { createI18n } from 'vue-i18n';
import App from './App.vue';
import './style.css';
import { MtDataTable } from '@shopware-ag/meteor-component-library';

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages: {
    en: {},
  },
});

const app = createApp(App);
app.use(i18n);
app.component('MtDataTable', MtDataTable);
app.mount('#app');
