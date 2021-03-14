import Vue from 'vue';
import VueRouter from 'vue-router';
import Realtime from '../views/Realtime.vue';

Vue.use(VueRouter);

const routes = [
  {
    path: '/',
    name: 'Realtime',
    component: Realtime,
  },
];

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes,
});

export default router;
