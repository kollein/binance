// develop-2 change
const base = '';

const globalSassValues = [
  `$ASSETS_URL: "${base}/"`,
  '@import "@/styles/_variables.scss"',
];

module.exports = {
  outputDir: 'dist/',
  transpileDependencies: ['dom7'],
  filenameHashing: false,
  chainWebpack: (config) => {
    // src
    config.module
      .rule('vue')
      .use('vue-loader')
      .loader('vue-loader')
      .tap((options) => {
        const optionsClone = { ...options };
        optionsClone.transformAssetUrls = {
          img: 'src',
          image: 'xlink:href',
          'b-avatar': 'src',
          'b-img': 'src',
          'b-img-lazy': ['src', 'blank-src'],
          'b-card': 'img-src',
          'b-card-img': 'src',
          'b-card-img-lazy': ['src', 'blank-src'],
          'b-carousel-slide': 'img-src',
          'b-embed': 'src',
        };

        return optionsClone;
      });
  },
  css: {
    loaderOptions: {
      scss: {
        prependData: `${globalSassValues.map((src) => `${src};`).join('\n')}`,
      },
    },
  },
};
