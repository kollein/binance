import Vue from 'vue';
import Vuex, {
  mapState,
  mapMutations,
  mapActions,
  mapGetters,
} from 'vuex';

// BOOTSTRAP VUE & STYLES
import { BootstrapVue, BootstrapVueIcons } from 'bootstrap-vue';

import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-vue/dist/bootstrap-vue.css';

import App from './App.vue';
import store from './store/index';
import router from './router/index';
import i18n from './lang/index';
import currencyFilter from './filters/currency';

// STYLE DESKTOP/MOBILE
import './styles/styles.scss';

Vue.use(BootstrapVue);
Vue.use(BootstrapVueIcons);

// DETECT MOBILE
let isMobile = false;
if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
  isMobile = true;
}

// FILTERS
Vue.filter('currency', currencyFilter);

// VUEX
Vue.config.productionTip = false;
Vue.use(Vuex);

// MIXINS
Vue.mixin({
  methods: {
    ...mapMutations('app', [
      'setByProp',
    ]),
    ...mapActions('app', [
      'updateLastUrl',
      'addStackUrl',
      'updateInterval',
      'updateRounds',
      'updateStorageItem',
      'sendPhoto',
    ]),
  },
  computed: {
    ...mapState('app', [
      'isLoadingApp',
      'homeUrl',
      'statis',
      'statisCounter',
      'intervalList',
      'interval',
      'profitPercent',
      'startAtHour',
      'runningRound',
    ]),
    ...mapGetters('app', [
      'getLastUrlInStorage',
      'getNextTimestamp',
      'getStorageItem',
      'getStopProfitAtPrice',
      'getProfitInPercent',
    ]),
    isMobile() {
      return isMobile;
    },
  },
});

// INIT
new Vue({
  store,
  router,
  i18n,
  render: (h) => h(App),
}).$mount('#app');
