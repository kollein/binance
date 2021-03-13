<template>
  <div class="about">
    <h1 class="text-center">Realtime price:</h1>
    <div class="d-flex flex-wrap">
      <div
        class="col-md-4 col-12 mt-4"
        v-for="(item, index) in slots"
        :key="index"
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
            <b-button class="mt-4" variant="success" @click="show()"
              >Show</b-button
            >
          </b-card-text>
        </b-card>
      </div>
    </div>
  </div>
</template>

<script>
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
      numberPair: 6,
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
        id: 312,
      };
      this.wss.send(JSON.stringify(paramUnsubscribe));

      // subscribe all
      const paramSubscribe = {
        method: 'SUBSCRIBE',
        params: this.streamList,
        id: 1,
      };
      this.wss.send(JSON.stringify(paramSubscribe));
    },
    updateSlots() {
      // console.log('updateSlots');
      // avoid infinite watcher looping
      this.isEntering = false;

      this.slots = this.slots.map((x) => {
        const item = { ...x };
        let { buyPrice } = x;
        buyPrice = parseFloat(buyPrice);
        const { pairOfCoinsWithHyphen } = x;
        item.status = 'closed';

        if (pairOfCoinsWithHyphen.length >= 5 && buyPrice > 0) {
          item.status = 'open';
          item.pairOfCoins = pairOfCoinsWithHyphen.replace(/\s*/g, '').replace('-', '');
          item.buyPrice = buyPrice;
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
      };
      return item;
    });
  },
};
</script>
