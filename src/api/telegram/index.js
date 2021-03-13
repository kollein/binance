import axios from 'axios';

export default axios.create({
  baseURL: `${process.env.VUE_APP_TELEGRAM_API_URL}${process.env.VUE_APP_TELEGRAM_BOT_TOKEN}`,
  headers: {
    Accept: 'application/json',
    // 'Content-Type': 'application/json',
    'Content-Type': 'multipart/form-data',
  },
});
