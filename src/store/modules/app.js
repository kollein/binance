import axiosTelegram from '@/api/telegram';

export default {
  namespaced: true,
  state: {
    isLoadingApp: false,
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
    sendMessage: ({ commit }, payload) => new Promise((resolve, reject) => {
      commit('setByProp', { isLoadingApp: true });
      const formData = payload;
      // console.log('formData', formData);
      return axiosTelegram.post('/sendMessage', formData)
        .then((res) => {
          // console.log('sendMessage res', res);
          commit('setByProp', { isLoadingApp: false });
          resolve(res);
        })
        .catch((err) => reject(err));
    }),
    sendPhoto: ({ commit }, payload) => new Promise((resolve, reject) => {
      commit('setByProp', { isLoadingApp: true });
      const formData = payload;
      // console.log('formData', formData);
      return axiosTelegram.post('/sendPhoto', formData)
        .then((res) => {
          // console.log('sendPhoto res', res);
          commit('setByProp', { isLoadingApp: false });
          resolve(res);
        })
        .catch((err) => reject(err));
    }),
    updateStorageItem: ({ commit }, payload) => {
      const { name, value } = payload;
      // set to the local storage
      localStorage.setItem(name, value);
      // set to the vuex store
      const obj = {};
      obj[name] = value;
      commit('setByProp', obj);
    },
  },
};
