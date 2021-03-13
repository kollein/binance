<template>
  <div id="app" v-if="isReady">
    <div class="iframe-container" ref="iframeContainer" v-if="!isMobile && $route.name === 'Home'">
      <iframe
        :src="iframeSrc"
        frameborder="0"
        width="100%"
        height="100%"
      ></iframe>
    </div>
    <div class="page-container">
      <router-view></router-view>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
// import * as moment from 'moment/moment';
// import getUrlParam from '@/helpers/getUrlParam';
// import AlertModal from "@/components/global/AlertModal";

export default {
  name: 'app',
  components: {
    // AlertModal,
  },
  data() {
    return {
      error: '',
      socket: null,
      isReady: false,
    };
  },
  computed: {
    ...mapState('app', ['iframeSrc']),
  },
  watch: {
    // reload the iframe whenever change the url
    // iframeSrc(newVal) {
    //   console.log('watch > iframeSrc:', newVal);
    //   if (!newVal) return;

    //   this.forceReloadIframe = false;
    //   this.reloadCount += 1;
    //   setTimeout(() => {
    //     this.forceReloadIframe = true;
    //   }, 100);
    // },
  },
  methods: {
    async receiveMessage(event) {
      // console.log('receiveMessage');
      const patt = /(?:\/\/localhost)|(?:binance\.com\/?$)/g;
      if (!patt.test(event.origin) || !event.data || !event.data.action) return;
      const { data } = event;
      const { action } = data;
      const { mixed } = data;
      let obj = {};
      let params = {};

      switch (action) {
        case 'BI-url-changed':
          obj = { iframeSrc: mixed.curUrl, prevIframeSrc: mixed.prevUrl };
          console.log('BI-url-changed', obj);
          this.setByProp(obj);
          // update in local storage for the whole page reload
          this.updateLastUrl(mixed.curUrl);
          break;
        case 'BI-new-chart-request':
          obj = { lastRequestUrl: mixed.requestUrl };
          this.setByProp(obj);
          console.log('BI-new-chart-request', obj);
          params = {
            url: mixed.requestUrl,
          };
          await this.addStackUrl(params);
          await this.updateRounds();
          break;

        default:
      }
    },
    async prepareData(isReady = true) {
      // console.log('prepareData');
      try {
        if (!isReady) {
          // iframe source
          const lastUrl = this.getLastUrlInStorage();
          // console.log('lastUrl', lastUrl);
          const iframeSrc = lastUrl || this.homeUrl;
          this.setByProp({ iframeSrc });
          // profit percent
          const profitPercent = this.getStorageItem('profitPercent');
          this.updateStorageItem({ name: 'profitPercent', value: profitPercent });
          // start time
          const startAtHour = this.getStorageItem('startAtHour');
          this.updateStorageItem({ name: 'startAtHour', value: startAtHour });
          // start time
          const interval = this.getStorageItem('interval');
          this.updateStorageItem({ name: 'interval', value: interval });

          this.isReady = true;
        }
      } catch (e) {
        this.isReady = true;
        console.error('error', e.message);
        this.error = e.message;
      }
    },
    async updateStatus() {
      // console.log('updateStatus');
      try {
        await Promise.all([
          this.resetOddsChips(),
          this.updateRounds(),
        ]);
      } catch (e) {
        console.error('error', e.message);
        this.error = e.message;
      }
    },
  },
  async created() {
    // listen to the iframe
    window.addEventListener('message', this.receiveMessage, false);
    // at the first time, we need to prepare the data
    // by the way, we will show the loading screen during the delay
    if (!this.isReady) {
      await this.prepareData(this.isReady);
    }
  },
};
</script>
