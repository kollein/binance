import Vue from 'vue';
import VueI18n from 'vue-i18n';
import vn from './vn';

Vue.use(VueI18n);

const i18n = new VueI18n({
  messages: { vn },
  fallbackLocale: 'vn',
  silentFallbackWarn: true,
});

export default i18n;
