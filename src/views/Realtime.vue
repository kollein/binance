<template>
  <div class="about">
    <h1 class="text-center">Realtime price:</h1>
    <div class="d-flex flex-wrap">
      <div
        class="col-md-4 col-sm-6 col-12 mt-4"
        v-for="(item, index) in slots"
        :key="index"
        :ref="`card${index}`"
      >
        <b-card>
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
              placeholder="Enter your buy price"
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
                  placeholder="Enter your sell price"
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
            <div class="mt-4 d-flex justify-content-between">
              <b-button variant="success" @click="show()"> Show </b-button>
              <div class="position-relative">
                <b-overlay
                  :show="isLoadingApp"
                  rounded
                  opacity="0.6"
                  spinner-small
                  spinner-variant="primary"
                  class="d-flex"
                >
                  <b-button variant="info" @click="sendReport(index)">
                    @Send
                  </b-button>
                </b-overlay>
              </div>
            </div>
          </b-card-text>
        </b-card>
      </div>
    </div>
  </div>
</template>

<script>
import html2canvas from 'html2canvas';

export default {
  name: 'Realtime',
  data() {
    return {
      error: null,
      wss: null,
      slots: [],
      isEntering: false,
      detailStream: '@trade',
      streamList: [],
      numberPair: 2,
      profitOptions: [{ value: 0.2, text: '0.2%' }, { value: 0.3, text: '0.3%' }, { value: 0.4, text: '0.4%' }, { value: 0.5, text: '0.5%' }, { value: 1, text: '1%' }, { value: 2, text: '2%' }, { value: 3, text: '3%' }, { value: 4, text: '4%' }, { value: 5, text: '5%' }, { value: 6, text: '6%' }, { value: 7, text: '7%' }, { value: 8, text: '8%' }, { value: 9, text: '9%' }, { value: 10, text: '10%' }, { value: 11, text: '11%' }, { value: 12, text: '12%' }, { value: 13, text: '13%' }, { value: 14, text: '14%' }, { value: 15, text: '15%' }, { value: 16, text: '16%' }, { value: 17, text: '17%' }, { value: 18, text: '18%' }, { value: 19, text: '19%' }, { value: 20, text: '20%' }, { value: 30, text: '30%' }, { value: 40, text: '40%' }, { value: 50, text: '50%' }, { value: 60, text: '60%' }, { value: 70, text: '70%' }, { value: 80, text: '80%' }, { value: 90, text: '90%' }, { value: 100, text: '100%' }, { value: 150, text: '150%' }, { value: 200, text: '200%' }, { value: 250, text: '250%' }, { value: 300, text: '300%' }],
    };
  },
  methods: {
    connect() {
      this.streamList = this.slots.map((item) => {
        if (item.status !== 'open') return null;

        return `${item.pairOfCoins}${this.detailStream}`;
      }).filter((x) => x);

      // init
      if (!this.wss) {
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

        return;
      }

      // list the current streams to reset
      const paramList = {
        method: 'LIST_SUBSCRIPTIONS',
        id: 3,
      };
      this.wss.send(JSON.stringify(paramList));
    },
    onResult(res) {
      const { id, result } = res;
      // console.log('onResult', id, result);
      // list subscriptions
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
          item.pairOfCoins = pairOfCoinsWithHyphen.replace(/\s*/g, '').replace('-', '');
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
      // console.log('show');
      this.updateSlots();
      this.connect();
    },
    getCardElement(index) {
      const element = this.$refs[`card${index}`];
      const cardEle = Array.isArray(element) ? element[0] : element;
      return cardEle;
    },
    async sendReport(index) {
      const element = this.getCardElement(index);
      // console.log('element', element);
      try {
        const canvas = await html2canvas(element);
        // document.body.append(canvas);
        canvas.toBlob(async (blob) => {
          const formData = new FormData();
          // @TestBot group
          // formData.append('chat_id', -471634458);
          // @GForces - Cryptocurrency group
          formData.append('chat_id', -1001482443540);
          formData.append('photo', blob);

          await this.sendPhoto(formData);
        }, 'image/jpeg', 0.6);
      } catch (e) {
        console.log('render error', e);
      }
      // console.log('sent!');
    },
  },
  created() {
    let hasLocalSlots = false;

    try {
      let localSlots = localStorage.getItem('slots');
      localSlots = JSON.parse(localSlots);
      if (localSlots.length) {
        hasLocalSlots = true;
        this.slots = localSlots;
      }
    } catch (e) {
      this.error = e;
    }

    if (hasLocalSlots) return;

    this.slots = [...new Array(this.numberPair)].map((x, index) => {
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
};
</script>
