<template>
  <div id="app" v-if="isReady">
    <div class="page-container">
      <router-view></router-view>
    </div>
  </div>
</template>

<script>
export default {
  name: 'app',
  data() {
    return {
      error: '',
      socket: null,
      isReady: true,
      isChangeTab: false,
    };
  },
  methods: {
    handleVisibilityChange() {
      if (document.hidden) {
        this.isChangeTab = true;
      } else {
        if (!this.isChangeTab) return;

        window.location.reload();
      }
    },
  },
  async created() {
    // detect if browser tab is unfocus
    document.addEventListener('visibilitychange', this.handleVisibilityChange, false);
  },
};
</script>
