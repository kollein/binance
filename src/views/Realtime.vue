<template>
  <div class="about">
    <div class="text-center">
      <h1>Realtime price:</h1>
      <div class="d-flex justify-content-center">
        <div class="col-md-3 col-4 px-0">
          <b-form-select
            v-model="numberSlots"
            :options="numberSlotsOptions"
          ></b-form-select>
        </div>
        <b-button class="ml-2" variant="success" @click="clearSlots()"
          >Clear</b-button
        >
      </div>
    </div>

    <div class="d-flex flex-wrap">
      <div
        class="col-md-4 col-sm-6 col-12 mt-4"
        v-for="(item, index) in slots"
        :key="index"
      >
        <b-card :ref="`card${index}`">
          <template #header>
            <span class="text-uppercase">{{ item.pairOfCoinsWithHyphen }}</span>
            <b-badge variant="info" class="ml-1">{{ item.status }}</b-badge>
          </template>
          <b-card-text>
            <b-form-input
              v-model="slots[index].pairOfCoinsWithHyphen"
              placeholder="Enter your pair of coins: btc-usdt"
              spellcheck="false"
            ></b-form-input>
            <b-form-input
              v-model="slots[index].buyPrice"
              placeholder="Enter buy price"
              spellcheck="false"
              class="mt-2"
            ></b-form-input>
            <b-form-input
              v-model="slots[index].amount"
              placeholder="Enter amount"
              spellcheck="false"
              class="mt-2"
            ></b-form-input>
            <div class="mt-2">
              <span>{{ item.curPrice }}</span>
              <b-badge variant="info">Current price</b-badge>
            </div>
            <div class="mt-2">
              <span>{{ item.profitInPercent }}</span>
              <b-badge :class="[item.isWin ? 'badge-success' : 'badge-danger']"
                >%Profit</b-badge
              >
            </div>
            <div class="mt-2">
              <span>{{ item.PNL }}</span>
              <b-badge :class="[item.isWin ? 'badge-success' : 'badge-danger']"
                >PNL</b-badge
              >
            </div>
            <h6 class="mt-3">Calculate how much profit on your way:</h6>
            <div class="d-flex mt-2 mx-n3">
              <div class="col-6">
                <b-form-input
                  v-model="slots[index].sellPrice"
                  placeholder="Sell price"
                  spellcheck="false"
                ></b-form-input>
              </div>
              <div class="col-6">
                <span>{{ item.willingProfitInPercent }}</span>
                <b-badge variant="info">%Profit</b-badge>
              </div>
            </div>
            <div class="d-flex mt-2 mx-n3">
              <div class="col-6">
                <b-form-select
                  v-model="slots[index].selectedProfitInPercent"
                  :options="profitOptions"
                ></b-form-select>
              </div>
              <div class="col-6">
                <span>{{ item.willingSellPrice }}</span>
                <b-badge variant="info">Sell price</b-badge>
              </div>
            </div>
            <div class="mt-2 action-wrapper">
              <b-overlay
                :show="isLoadingApp"
                rounded
                opacity="0.6"
                spinner-small
                spinner-variant="primary"
                class="py-2"
              >
                <div class="d-flex justify-content-between">
                  <b-button variant="success" @click="show()">Show</b-button>

                  <b-button variant="info" @click="sendReport(index)">
                    @Send
                  </b-button>
                </div>
              </b-overlay>
            </div>
          </b-card-text>
        </b-card>
      </div>
    </div>
    <b-alert
      v-model="showTopAlert"
      class="position-fixed fixed-top m-0 rounded-0"
      style="z-index: 2000"
      variant="success"
      dismissible
    >
      {{ error }}
    </b-alert>
  </div>
</template>

<script>
import * as moment from 'moment/moment';
// import html2canvas from 'html2canvas';

export default {
  name: 'Realtime',
  data() {
    return {
      error: null,
      showTopAlert: false,
      wss: null,
      slots: [],
      isEntering: false,
      detailStream: '@trade',
      streamList: [],
      numberSlots: 2,
      profitOptions: [{ value: 0.2, text: '0.2%' }, { value: 0.3, text: '0.3%' }, { value: 0.4, text: '0.4%' }, { value: 0.5, text: '0.5%' }, { value: 1, text: '1%' }, { value: 2, text: '2%' }, { value: 3, text: '3%' }, { value: 4, text: '4%' }, { value: 5, text: '5%' }, { value: 6, text: '6%' }, { value: 7, text: '7%' }, { value: 8, text: '8%' }, { value: 9, text: '9%' }, { value: 10, text: '10%' }, { value: 11, text: '11%' }, { value: 12, text: '12%' }, { value: 13, text: '13%' }, { value: 14, text: '14%' }, { value: 15, text: '15%' }, { value: 16, text: '16%' }, { value: 17, text: '17%' }, { value: 18, text: '18%' }, { value: 19, text: '19%' }, { value: 20, text: '20%' }, { value: 30, text: '30%' }, { value: 40, text: '40%' }, { value: 50, text: '50%' }, { value: 60, text: '60%' }, { value: 70, text: '70%' }, { value: 80, text: '80%' }, { value: 90, text: '90%' }, { value: 100, text: '100%' }, { value: 150, text: '150%' }, { value: 200, text: '200%' }, { value: 250, text: '250%' }, { value: 300, text: '300%' }],
      numberSlotsOptions: [{ value: 1, text: '1 slot' }, { value: 2, text: '2 slots' }, { value: 3, text: '3 slots' }, { value: 4, text: '4 slots' }, { value: 5, text: '5 slots' }, { value: 6, text: '6 slots' }, { value: 7, text: '7 slots' }, { value: 8, text: '8 slots' }, { value: 9, text: '9 slots' }, { value: 10, text: '10 slots' }],
    };
  },
  methods: {
    connect() {
      this.filterSlots();
      // init
      const streamListStr = this.streamList.join('/');
      this.wss = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streamListStr}`);
      // console.log(this.wss);

      this.wss.onmessage = (evt) => {
        // console.log('onmessage', evt);
        try {
          const data = JSON.parse(evt.data);

          // on result
          if (data.id) {
            this.onResult(data);
          }

          // on stream
          if (data.stream) {
            this.onStream(data);
          }
        } catch (e) {
          // console.log('Unknown message: ', evt.data, e);
        }
      };

      this.wss.onclose = () => {
        console.log('WebSocket is closed now. Re-conmnect!');
        this.connect();
      };
    },
    filterSlots() {
      this.streamList = this.slots.map((item) => {
        if (item.status !== 'open') return null;

        return `${item.pairOfCoins}${this.detailStream}`;
      }).filter((x) => x);
    },
    onResult(res) {
      const { id, result } = res;
      // console.log('onResult', id, result);
      // subscribe success
      if (id === 1) {
        this.setByProp({ isLoadingApp: false });
      }
      // list subscriptions success
      if (id === 3) {
        // streams are subscribing
        const curStreamList = result;
        this.reset(curStreamList);
      }
    },
    onStream(res) {
      const { stream, data } = res;
      const curPrice = data.p;
      // console.log('onStream', stream, data);
      this.slots = this.slots.map((x) => {
        const item = { ...x };
        const { status, buyPrice } = x;
        const pairOfCoinsFilled = `${x.pairOfCoins}${this.detailStream}`;
        if (pairOfCoinsFilled === stream && status === 'open') {
          const profitInPercent = this.getProfitInPercent(buyPrice, curPrice);
          item.profitInPercent = profitInPercent.toFixed(2);
          item.curPrice = curPrice;
          item.isWin = item.profitInPercent > 0;
          item.isGood = item.profitInPercent > 0 && item.profitInPercent < 10;
          item.isExcellent = item.profitInPercent > 10;
          const PNL = ((item.amount * item.buyPrice) * item.profitInPercent) / 100;
          item.PNL = PNL;
          const willingProfitInPercent = this.getProfitInPercent(buyPrice, item.sellPrice);
          item.willingProfitInPercent = willingProfitInPercent.toFixed(2);
          const willingSellPrice = this
            .getStopProfitAtPrice(buyPrice, item.selectedProfitInPercent);
          item.willingSellPrice = willingSellPrice;
        }
        return item;
      });
    },
    reset(curStreamList) {
      this.filterSlots();
      // console.log('streamList', this.streamList);
      // console.log('curStreamList', curStreamList);

      // unsubscribe all
      const paramUnsubscribe = {
        method: 'UNSUBSCRIBE',
        params: curStreamList,
        id: 312, // unique identifier
      };
      this.wss.send(JSON.stringify(paramUnsubscribe));

      // subscribe all
      const paramSubscribe = {
        method: 'SUBSCRIBE',
        params: this.streamList,
        id: 1, // unique identifier
      };
      this.wss.send(JSON.stringify(paramSubscribe));
    },
    updateSlots() {
      // console.log('updateSlots');
      // avoid infinite watcher looping
      this.isEntering = false;

      this.slots = this.slots.map((x) => {
        const item = { ...x };
        let { buyPrice, amount, sellPrice } = x;
        buyPrice = parseFloat(buyPrice);
        sellPrice = parseFloat(sellPrice);
        amount = parseFloat(amount);
        const { pairOfCoinsWithHyphen } = x;
        item.status = 'closed';

        if (pairOfCoinsWithHyphen.length >= 5 && buyPrice > 0) {
          item.status = 'open';
          item.pairOfCoins = pairOfCoinsWithHyphen.replace(/\s*/g, '').replace('-', '').toLowerCase();
          item.buyPrice = buyPrice;
          item.sellPrice = sellPrice;
          item.amount = amount;
        }
        return item;
      });
      // save
      localStorage.setItem('slots', JSON.stringify(this.slots));
    },
    show() {
      this.setByProp({ isLoadingApp: true });
      this.updateSlots();
      this.subscribe();
    },
    getCardElement(index) {
      const element = this.$refs[`card${index}`];
      const cardEle = Array.isArray(element) ? element[0] : element;
      return cardEle;
    },
    // async sendImageReport(index) {
    //   const element = this.getCardElement(index);
    //   // console.log('element', element);
    //   try {
    //     const canvas = await html2canvas(element);
    //     // document.body.append(canvas);
    //     canvas.toBlob(async (blob) => {
    //       const formData = new FormData();
    //       // @TestBot group
    //       // formData.append('chat_id', -471634458);
    //       // @GForces - Cryptocurrency group
    //       formData.append('chat_id', -1001482443540);
    //       formData.append('photo', blob);

    //       await this.sendPhoto(formData);
    //     }, 'image/jpeg', 0.6);
    //   } catch (e) {
    //     console.log('render error', e);
    //   }
    //   // console.log('sent!');
    // },
    async sendReport(index) {
      const card = this.slots[index];
      const today = moment().format('dddd, MMMM Do YYYY, HH:mm:ss');
      let markdownV2Content = '```';
      const sparkles = '✨';
      const rocket = '🚀';
      const bath = '🛀';
      const dollarSign = '💵';
      markdownV2Content += `
${card.pairOfCoinsWithHyphen.toUpperCase()}: ${today}
${sparkles}Buy price: ${this.$options.filters.currency(card.buyPrice)}
${sparkles}Amount: ${this.$options.filters.currency(card.amount)}
${sparkles}Current Price: ${this.$options.filters.currency(card.curPrice)}
${sparkles}Profit: ${card.profitInPercent}% ${card.isWin ? rocket : bath}
${sparkles}PNL: ${this.$options.filters.currency(card.PNL)} ${card.isWin ? dollarSign : bath}

Calculate how much profit on your way:
${sparkles}Sell price: ${this.$options.filters.currency(card.sellPrice)} - ${card.willingProfitInPercent}%
${sparkles}Profit: ${card.selectedProfitInPercent}% - ${this.$options.filters.currency(card.willingSellPrice)}
`;
      markdownV2Content += '```';
      markdownV2Content += '[See more](https://binance2021.web.app/)';

      try {
        console.log('VUE_APP_TELEGRAM_CHAT_GROUP_ID', process.env.VUE_APP_TELEGRAM_CHAT_GROUP_ID);
        const formData = new FormData();
        formData.append('chat_id', process.env.VUE_APP_TELEGRAM_CHAT_GROUP_ID);
        formData.append('text', markdownV2Content);
        formData.append('parse_mode', 'MarkdownV2');

        await this.sendMessage(formData);
      } catch (e) {
        this.error = e.message;
        this.showTopAlert = true;
      }
    },
    clearSlots() {
      localStorage.setItem('slots', '');
      this.initSlots();
      this.updateSlots();
    },
    initSlots() {
      let hasLocalSlots = false;

      try {
        // eslint-disable-next-line max-len
        // [{"id":0,"status":"open","buyPrice":0.03189,"pairOfCoinsWithHyphen":"gto-usdt","amount":757351,"sellPrice":0.1,"selectedProfitInPercent":100,"pairOfCoins":"gtousdt","profitInPercent":"5.83","curPrice":"0.03375000","isWin":true,"isGood":true,"isExcellent":false,"PNL":0.1859187,"willingProfitInPercent":"213.58","willingSellPrice":0.06378},{"id":1,"status":"open","buyPrice":1700,"pairOfCoinsWithHyphen":"eth-usdt","amount":100,"sellPrice":3000,"selectedProfitInPercent":50,"pairOfCoins":"ethusdt","profitInPercent":"10.78","curPrice":"1883.21000000","isWin":true,"isGood":false,"isExcellent":true,"PNL":18326,"willingProfitInPercent":"76.47","willingSellPrice":2550}]
        let localSlots = localStorage.getItem('slots');
        localSlots = JSON.parse(localSlots);
        const slotsLength = localSlots.length;
        if (slotsLength) {
          hasLocalSlots = true;
          this.slots = localSlots;
          this.numberSlots = slotsLength;
        }
      } catch (e) {
        this.error = e;
      }

      if (hasLocalSlots) return;

      this.slots = [...new Array(this.numberSlots)].map((x, index) => {
        const item = {
          id: index,
          status: 'closed',
          buyPrice: '',
          pairOfCoinsWithHyphen: '',
          amount: '',
          sellPrice: '',
          selectedProfitInPercent: 1,
        };
        return item;
      });
    },
    subscribe() {
      // list the current streams then reset
      // by onResult
      const paramList = {
        method: 'LIST_SUBSCRIPTIONS',
        id: 3,
      };
      this.wss.send(JSON.stringify(paramList));
    },
  },
  created() {
    this.initSlots();
    if (this.wss) return;

    this.connect();
  },
};
</script>
