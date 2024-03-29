<template>
  <div class="home-page">
    <div class="action-wrapper">
      <div class="row mx-0">
        <div class="col-md-4 col-12 action-box">
          <b-button class="mr-1" v-b-modal.modal-code>Code</b-button>
          <b-button class="mr-1" v-b-modal.modal-future>Future</b-button>
          <b-button class="mr-1" @click="showChart()">Show</b-button>
          <b-button-group class="mt-md-0 mt-1">
            <b-button
              v-for="(item, index) in intervalList"
              :key="index"
              @click="updateStorageItem({ name: 'interval', value: item })"
              :class="{ active: item === interval }"
            >
              {{ item }}
            </b-button>
          </b-button-group>
        </div>
        <div class="col-md-3 col-12 mt-md-0 mt-4 tool-box">
          <div class="row">
            <div class="col-6">
              <b-form-input
                v-model="buyPrice"
                placeholder="Enter your buy price"
              ></b-form-input>
              <b-form-input
                v-model="sellPrice"
                placeholder="Enter your sell price"
                class="mt-1"
              ></b-form-input>
            </div>
            <div class="col-6">
              <div>
                {{ sellPriceNow }}
                <b-badge variant="info">Sell price</b-badge>
              </div>
              <div>
                {{ profitInPercent.toFixed(2) }}
                <b-badge variant="info">%Profit</b-badge>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-3 col-12 mt-md-0 mt-4 counter-box">
          <b-button class="mr-1">Total: {{ statisCounter.total }}</b-button>
          <b-button class="mr-1">Win: {{ statisCounter.win }}</b-button>
          <b-button class="mr-1">Lose: {{ statisCounter.lose }}</b-button>
        </div>
        <div class="col-md-2 col-12 mt-md-0 mt-4 options-box row">
          <div class="time-wrapper col-6">
            <b-form-select
              v-model="selectedTime"
              :options="timeOptions"
            ></b-form-select>
          </div>
          <div class="profit-wrapper col-6">
            <b-form-select
              v-model="selectedProfit"
              :options="profitOptions"
            ></b-form-select>
          </div>
        </div>
      </div>
    </div>
    <div class="time-line d-flex flex-nowrap mt-1">
      <div
        class="group-wrapper d-flex text-nowrap"
        v-for="(group, i) in statis"
        :key="i"
      >
        <div
          class="item"
          v-for="(item, index) in group"
          :key="index"
          :class="[item.isWin ? 'is-win' : 'is-loss', item.name]"
        >
          <template v-if="item.name === 'itemStart'">
            <div class="date">{{ item.name }}</div>
            <div class="date">{{ item.startAt }}</div>
            <div class="price">
              {{ item.high }} <b-badge variant="success">Buy price</b-badge>
            </div>
            <div class="price">
              {{ item.stopProfitAtPrice }}
              <b-badge variant="danger">Sell price</b-badge>
            </div>
          </template>
          <template v-else-if="item.name === 'itemMiddle'">
            <div class="date">{{ item.name }}</div>
            <div class="date">{{ item.startAt }}</div>
            <div class="price">{{ item.high }}</div>
            <div class="price">{{ item.profitInPercentFact }}%</div>
          </template>
          <template v-else>
            <div class="date">{{ item.name }}</div>
            <div class="date">{{ item.startAt }}</div>
            <div class="price">{{ item.high }}</div>
            <div class="price">
              {{ item.highestItem.high }}
              <b-badge
                variant="info"
                v-b-tooltip.hover
                :title="getTooltipInfo(item.highestItem)"
                >Highest/24h</b-badge
              >
              {{ item.lowestItem.low }}
              <b-badge
                variant="info"
                v-b-tooltip.hover
                :title="getTooltipInfo(item.lowestItem, false)"
                >Lowest/24h</b-badge
              >
            </div>
          </template>
        </div>
      </div>
    </div>
    <b-modal id="modal-code" title="Override Instructions">
      <p class="my-4">
        # Require Third-party Setup:
        <a
          href="https://chrome.google.com/webstore/detail/ignore-x-frame-headers/gleekbfjekiniecknbkamfmkohkpodhe"
        >
          Ignore X-Frame headers </a
        ><br />
        # Turn on <b>Override Mode</b> in Google Chrome: Console > Source >
        Override<br />
        # Find a js file to override with this code:
        <a href="/code.js" title="Override Code">Download</a>
      </p>
    </b-modal>

    <b-modal id="modal-future" title="Expectations For Years Later" size="lg">
      <div class="content-wrapper">
        <div class="item-base">
          <b-badge variant="info">28/02/2021</b-badge>
          <h1>Analyse by market</h1>
          <h4>Bitcoin is a standard coin to follow the trace</h4>
          <div class="info-wrapper">
            <div>Current Price: $45K</div>
            <div>Market Cap: $840B</div>
            <div>Max supply: 21M</div>
          </div>
        </div>
        <hr class="my-4" />
        <div
          class="item-expect mb-4"
          v-for="(item, index) in expectedCoins"
          :key="index"
        >
          <h4>{{ item.name }}</h4>
          <b-list-group>
            <b-list-group-item>
              Current Price: ${{ item.price | currency }}
            </b-list-group-item>
            <b-list-group-item>
              Market Cap: ${{ item.marketCap | currency }}
            </b-list-group-item>
            <b-list-group-item>
              Max Supply:
              <template v-if="item.maxSupply > 0">
                {{ item.maxSupply | currency }}
              </template>
              <template v-else>No data</template>
            </b-list-group-item>
            <b-list-group-item>
              <i>
                Expect the {{ item.symbol }}'s Market Cap will increase to
                Bitcoin one with the growth ratio 1:{{ item.growthCore }}
              </i>
            </b-list-group-item>
            <b-list-group-item>
              ({{ bitcoin.marketCap }} / {{ item.marketCap }}) /
              {{ item.growthCore }} = {{ item.xTime }} (time)
            </b-list-group-item>
            <b-list-group-item>
              So, the {{ item.symbol }} future price will be:
            </b-list-group-item>
            <b-list-group-item>
              {{ item.price }} * {{ item.xTime }} =
              <b>${{ item.expectedPrice | currency }}</b>
            </b-list-group-item>
          </b-list-group>
        </div>
      </div>
    </b-modal>
  </div>
</template>

<script>
// import Result from '@/components/global/desktop/Result';

export default {
  name: 'Home',
  components: {
    // Result,
  },
  data() {
    return {
      error: '',
      selectedProfit: 1,
      profitOptions: [{ value: 0.2, text: '0.2%' }, { value: 0.3, text: '0.3%' }, { value: 0.4, text: '0.4%' }, { value: 0.5, text: '0.5%' }, { value: 1, text: '1%' }, { value: 2, text: '2%' }, { value: 3, text: '3%' }, { value: 4, text: '4%' }, { value: 5, text: '5%' }, { value: 6, text: '6%' }, { value: 7, text: '7%' }, { value: 8, text: '8%' }, { value: 9, text: '9%' }, { value: 10, text: '10%' }, { value: 11, text: '11%' }, { value: 12, text: '12%' }, { value: 13, text: '13%' }, { value: 14, text: '14%' }, { value: 15, text: '15%' }, { value: 16, text: '16%' }, { value: 17, text: '17%' }, { value: 18, text: '18%' }, { value: 19, text: '19%' }, { value: 20, text: '20%' }, { value: 50, text: '50%' }, { value: 100, text: '100%' }],
      selectedTime: 12,
      timeOptions: [{ value: '00', text: '00:00' }, { value: '01', text: '01:00' }, { value: '02', text: '02:00' }, { value: '03', text: '03:00' }, { value: '04', text: '04:00' }, { value: '05', text: '05:00' }, { value: '06', text: '06:00' }, { value: '07', text: '07:00' }, { value: '08', text: '08:00' }, { value: '09', text: '09:00' }, { value: '10', text: '10:00' }, { value: '11', text: '11:00' }, { value: '12', text: '12:00' }, { value: '13', text: '13:00' }, { value: '14', text: '14:00' }, { value: '15', text: '15:00' }, { value: '16', text: '16:00' }, { value: '17', text: '17:00' }, { value: '18', text: '18:00' }, { value: '19', text: '19:00' }, { value: '20', text: '20:00' }, { value: '21', text: '21:00' }, { value: '22', text: '22:00' }, { value: '23', text: '23:00' }],
      buyPrice: 0,
      sellPrice: 0,
      bitcoin: {
        price: 45000,
        marketCap: 840000000000,
        maxSupply: 21000000,
      },
    };
  },
  computed: {
    sellPriceNow() {
      return this.getStopProfitAtPrice(this.buyPrice, this.profitPercent);
    },
    profitInPercent() {
      return this.getProfitInPercent(this.buyPrice, this.sellPrice);
    },
    expectedCoins() {
      const coinList = [
        {
          name: 'Ethereum',
          symbol: 'ETH',
          price: 1400,
          marketCap: 160000000000,
          maxSupply: 0,
          xTime: 0,
          expectedPrice: 0,
          growthCore: 1, // highest
        },
        {
          name: 'Litecoin',
          symbol: 'LTC',
          price: 160,
          marketCap: 10000000000,
          maxSupply: 84000000,
          xTime: 0,
          expectedPrice: 0,
          growthCore: 10,
        },
        {
          name: 'Ripple',
          symbol: 'XRP',
          price: 0.4,
          marketCap: 18000000000,
          maxSupply: 100000000000,
          xTime: 0,
          expectedPrice: 0,
          growthCore: 20,
        },
      ];

      const coins = coinList.map((x) => {
        const item = { ...x };
        // why minus for 5 (because the growth of each coin is different)
        item.xTime = (this.bitcoin.marketCap / x.marketCap) / x.growthCore;
        item.expectedPrice = item.xTime * x.price;
        return item;
      });
      return coins;
    },
  },
  watch: {
    selectedTime(newVal) {
      this.updateStorageItem({ name: 'startAtHour', value: newVal });
    },
    selectedProfit(newVal) {
      this.updateStorageItem({ name: 'profitPercent', value: newVal });
    },
  },
  methods: {
    async showChart() {
      console.log('showChart');
      // at the first time, we need to call the chart request manually
      // because the request detection can not work at the beginning
      const params = {
        url: 'https://www.binance.com/api/v1/klines',
        isFirst: true,
      };
      await this.addStackUrl(params);
      await this.updateRounds();
    },
    getTooltipInfo(item, isHigh = true) {
      const price = isHigh ? item.high : item.low;
      const info = `${item.startAt} | ${price}`;
      return info;
    },
  },
  created() {
    this.selectedTime = this.startAtHour;
    this.selectedProfit = this.profitPercent;
  },
};
</script>
