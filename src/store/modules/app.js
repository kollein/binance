import axios from '@/api';
import * as moment from 'moment/moment';
import groupBy from 'lodash/groupBy';
// import twoDigits from '@/helpers/twoDigits';
// import currency from "@/filters/currency";

export default {
  namespaced: true,
  state: {
    amount: 1, // by day
    range: 1, // by day
    homeUrl: 'https://www.binance.com/',
    iframeSrc: '',
    prevIframeSrc: '',
    lastRequestUrl: '',
    stackRequests: [],
    statis: [],
    statisCounter: {
      total: 0,
      win: 0,
      lose: 0,
    },
    intervalList: ['1m', '5m', '15m'],
    interval: '1m',
    profitPercent: 1,
    startAtHour: 12,
    defaultList: {
      interval: '1m',
      profitPercent: 1,
      startAtHour: 12,
    },
    runningRound: {},
    lastUrl: '',
  },
  mutations: {
    setByProp(state, data) {
      Object.keys(data).forEach((prop) => {
        const value = data[prop];
        state[prop] = value;
      });
    },
  },
  getters: {
    getQueryStr: () => (obj) => {
      // limit=100&status=ENDED&page=0
      let queryStr = '';
      let i = 0;
      Object.entries(obj).forEach(([key, val]) => {
        const ampersand = i > 0 ? '&' : '';
        if (val !== undefined) {
          const editedKey = /^status([0-9]*)$/g.test(key) ? 'status' : key;
          queryStr += `${ampersand}${editedKey}=${val}`;
        }
        i += 1;
      });
      return queryStr;
    },
    getNextRequest: (state) => () => {
      const request = state.stackRequests.find((x) => x.status === 'pending');
      return request;
    },
    getRequestIndexByUrl: (state) => (url) => {
      const request = state.stackRequests.findIndex((x) => x.url === url);
      return request;
    },
    getLastUrlInStorage: () => () => {
      const lastUrlInStorage = localStorage.getItem('lastUrl');
      return lastUrlInStorage;
    },
    getStorageItem: (state) => (name) => {
      // if not exists, use the default value
      const item = localStorage.getItem(name) || state.defaultList[name];
      return item;
    },
    getBaseDate: () => () => {
      const d = moment();
      const h = d.hour();
      const m = d.minute();
      const s = d.second();
      const timeStr = `${h}:${m}:${s}`;
      console.log('timeStr', timeStr);
      const dateObj = {
        YYYY: d.year(),
        MM: d.month(),
        DD: d.date(),
        h: 0, // today.hour(),
        m: 0, // today.minute(),
        s: 0, // today.second(),
        ms: 0, // today.millisecond(),
      };
      return dateObj;
    },
    getNextTimestamp: (state, getters) => () => {
      const baseDate = getters.getBaseDate();
      const {
        YYYY,
        MM,
        DD,
        h,
        m,
        s,
        ms,
      } = baseDate;
      const amount = 0;
      const date = moment([YYYY, MM, DD, h, m, s, ms]).add(amount, 'day');
      // Binance TimeZone -1 to Vietname TimeZone
      const minus1Hour = 0;
      const timestamp = date.unix() - minus1Hour;
      console.log('date', date, timestamp);
      return timestamp;
    },
    getStopProfitAtPrice: () => (buyPrice, percent = 1) => {
      const price = parseFloat(buyPrice.toString().replace(/[^0-9.]/g, ''));
      const percentage = parseFloat(percent);
      const sellPrice = ((percentage * price) / 100) + price;
      // console.log('getStopProfitAtPrice:', sellPrice);
      return sellPrice;
    },
    getProfitInPercent: () => (buyPrice, sellPrice) => {
      const profit = ((sellPrice / buyPrice) - 1) * 100;
      // console.log('getProfitInPercent:', profit);
      return profit;
    },
    getUniqArrOfArrays: () => (arr) => {
      const set = new Set(arr.map(JSON.stringify));
      return Array.from(set).map(JSON.parse);
    },
  },
  actions: {
    updateRounds: ({
      getters, state, commit, dispatch,
    }) => new Promise((resolve, reject) => {
      // find the url which is not done
      const request = getters.getNextRequest();
      return axios.get(request.url)
        .then((res) => {
          const { data } = res;
          const index = getters.getRequestIndexByUrl(request.url);
          const stackRequests = [...state.stackRequests];
          stackRequests[index].result = data;
          stackRequests[index].status = 'done';
          commit('setByProp', { stackRequests });
          dispatch('updateStatis');
          resolve();
        })
        .catch((err) => reject(err));
    }),
    updateRunningRound: ({ state, commit, getters }, payload) => new Promise((resolve) => {
      const round = payload;
      console.log('updateRunningRound', round);
      const start = round[0]; // milisecs
      const end = round[6];
      const high = parseFloat(round[2]);
      const low = parseFloat(round[3]);
      const d = moment(start);
      const startAt = d.format('dddd, MMMM Do YYYY, HH:mm:ss');
      const profitPercent = parseFloat(state.profitPercent);
      const stopProfitAtPrice = getters.getStopProfitAtPrice(high, profitPercent);
      const runningRound = {
        start,
        end,
        high,
        low,
        startAt,
        stopProfitAtPrice,
      };
      commit('setByProp', { runningRound });
      resolve();
    }),
    updateStatis: ({
      state, commit, getters, dispatch,
    }) => new Promise((resolve) => {
      // merged all rounds
      const rounds = state.stackRequests.reduce((acc, cur) => [...cur.result, ...acc], []);
      // old to new
      let sortedRounds = rounds.sort((a, b) => a[0] - b[0]);
      sortedRounds = getters.getUniqArrOfArrays(sortedRounds);
      const runningRound = [...sortedRounds[sortedRounds.length - 1]];
      dispatch('updateRunningRound', runningRound);

      const statis = [];
      const startAtTimeStr = `${state.startAtHour}:00:00:000`;
      const endAtHour = parseInt(state.startAtHour, 10) + (23 - 24);
      const endAtTimeStrMap = {
        '1m': `${endAtHour}:59:00:000`,
        '5m': `${endAtHour}:55:00:000`,
        '15m': `${endAtHour}:45:00:000`,
      };
      const endAtTimeStr = endAtTimeStrMap[state.interval];
      const defaultPrev = [0, '0', '0', '0', '0', '0', 0, '0', 0, '0', '0', '0'];

      let itemStart = { name: 'itemStart' };
      let itemMiddle = { name: 'itemMiddle' }; // stop profit n% at here
      let itemEnd = { name: 'itemEnd' };
      let itemHighest = { name: 'itemHighest' };
      const statisCounter = { ...state.statisCounter };
      statisCounter.total = 0;
      statisCounter.win = 0;
      statisCounter.lose = 0;

      sortedRounds.reduce((prev, x) => {
        const start = x[0]; // milisecs
        const end = x[6];
        const high = parseFloat(x[2]);
        const low = parseFloat(x[3]);
        // current time
        const d = moment(start);
        const timeStr = d.format('HH:mm:ss:SSS');
        const dateStr = d.format('DD/MM/YYYY');
        // prev time
        const prevD = moment(start);
        // const prevTimeStr = prevD.format('HH:mm:ss:SSS');
        const prevDateStr = prevD.format('DD/MM/YYYY');

        // xx:00:00
        const startAt = d.format('dddd, MMMM Do YYYY, HH:mm:ss');
        if (timeStr === startAtTimeStr) {
          // we make sure the bad price is chosen
          itemHighest.high = low;
          console.log('timeStr', timeStr, start, prev);
          const profitPercent = parseFloat(state.profitPercent);
          const stopProfitAtPrice = getters.getStopProfitAtPrice(high, profitPercent);
          const nextStart = d.add(1, 'day'); // milisecs
          console.log('nextStart', nextStart);
          itemStart = {
            name: 'itemStart',
            groupKey: start,
            start,
            nextStart,
            end,
            high,
            low,
            startAt,
            stopProfitAtPrice,
          };
        }

        // we make sure the start item exists
        if (itemStart.start) {
          // highest in 24 hours
          let checkIn24Hours = false;
          // 0h -> 23h
          if (state.startAtHour === 0) {
            checkIn24Hours = prevDateStr === dateStr;
          } else {
            // 'a'h -> (a-1)h of tomorrow
            checkIn24Hours = start < itemStart.nextStart;
          }
          // cache the highest item
          if (checkIn24Hours && high > itemHighest.high) {
            itemHighest = {
              start,
              startAt,
              high,
            };
          }
          // detect the stop profit item at n%(profit)
          if (high - itemStart.stopProfitAtPrice >= 0 && !itemStart.stopProfitAtPriceFact) {
            itemMiddle = {
              name: 'itemMiddle',
              groupKey: itemStart.start,
              start,
              end,
              high,
              low,
              startAt,
              profitInPercentFact: getters.getProfitInPercent(itemStart.high, high),
              isWin: true,
            };
            // update the item start
            itemStart.stopProfitAtPriceFact = high;
          }

          // the day ended here!
          if (timeStr === endAtTimeStr) {
            statis.push(itemStart);
            if (!itemMiddle.groupKey) {
              itemMiddle.groupKey = itemStart.groupKey;
              itemMiddle.isWin = false;
              itemMiddle.start = itemHighest.start;
              itemMiddle.startAt = itemHighest.startAt;
              itemMiddle.high = itemHighest.high;
            }
            statis.push(itemMiddle);
            itemEnd = {
              name: 'itemEnd',
              groupKey: itemStart.start,
              start,
              end,
              high,
              low,
              startAt,
              highestItem: itemHighest,
            };
            statis.push(itemEnd);
            // update counter
            statisCounter.total += 1;
            const profitPercent = parseFloat(state.profitPercent);
            if (itemMiddle.profitInPercentFact >= profitPercent) {
              statisCounter.win += 1;
            } else {
              statisCounter.lose += 1;
              // not meet the willing profit
              // but we calculate how much it was the best fit for us
              itemMiddle.profitInPercentFact = getters
                .getProfitInPercent(itemStart.high, itemHighest.high);
            }
            // reset all items
            itemStart = { name: 'itemStart' };
            itemMiddle = { name: 'itemMiddle' };
            itemEnd = { name: 'itemEnd' };
            itemHighest = { name: 'itemHighest' };
          }
        }

        return x;
      }, defaultPrev);

      const groupedStatis = groupBy(statis, 'groupKey');
      commit('setByProp', { statisCounter });
      commit('setByProp', { statis: groupedStatis });
      resolve();
    }),
    updateLastUrl: ({ commit }, payload) => {
      const lastUrl = payload;
      localStorage.setItem('lastUrl', lastUrl);
      commit('setByProp', { lastUrl });
    },
    updateStorageItem: ({ commit }, payload) => {
      const { name, value } = payload;
      // set to the local storage
      localStorage.setItem(name, value);
      // set to the vuex store
      const obj = {};
      obj[name] = value;
      commit('setByProp', obj);
    },
    addStackUrl: ({ state, getters, commit }, payload) => new Promise((resolve) => {
      const { url, isFirst = false } = payload;
      let newUrl = url;
      if (isFirst) {
        // iframeSrc: https://www.binance.com/vi/trade/BURGER_BNB?layout=pro
        let symbol = state.iframeSrc.split('trade/')[1];
        symbol = symbol.split('?')[0].replace('_', '');
        const queries = {
          symbol,
          interval: state.interval,
        };
        // https://www.binance.com/api/v1/klines?symbol=BURGERBNB&interval=1m
        const queryStr = getters.getQueryStr(queries);
        newUrl = `${url}?${queryStr}`;
      }

      const index = getters.getRequestIndexByUrl(newUrl);
      if (index > 0) return;

      const stackRequests = [...state.stackRequests];
      const item = {
        url: newUrl,
        result: [],
        status: 'pending',
        isFirst,
        timestamp: new Date().getTime(),
      };
      stackRequests.push(item);
      console.log('item', item);
      commit('setByProp', { stackRequests });
      resolve();
    }),
  },
};
