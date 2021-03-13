# binance-demo

## HOME PAGE:

## Tool for analyse the crypto currency to trade on the webpage: binance.com

## Require Third-party Setup:
```
Ignore X-Frame headers
https://chrome.google.com/webstore/detail/ignore-x-frame-headers/gleekbfjekiniecknbkamfmkohkpodhe
```

## Override Mode on Google Chrome Console:

Because we dont know the parameters to call the api
So we need to embed the webpage into our Application then we detect the parameters 
and send it to our app. At that time, we can call the api
## The detection script looks like:

```
console.log('Override Detection!!!');

(function () {
  var proxied = window.XMLHttpRequest.prototype.open;
  window.XMLHttpRequest.prototype.open = function () {
    const method = arguments[0];
    const url = arguments[1];
    const isChartRequest = url.indexOf('api/v1/klines?symbol=') > -1;
    if (isChartRequest) {
      console.log('An ajax request was made', url, isChartRequest);
      // send the new request url to the localhost
      const action = 'BI-new-chart-request';
      const mixed = {
        requestUrl: url,
        timestamp: new Date().getTime(),
      };
      biPostMessage(action, mixed);
    }
    return proxied.apply(this, [].slice.call(arguments));
  };
})();

const biPostMessage = (action, mixed) => {
  const data = {
    action,
    mixed,
  };

  window.parent.postMessage(
    data,
    '*',
  );
};

let prevUrl = '';
setInterval(() => {
  const curUrl = window.location.href;
  if (prevUrl !== curUrl) {
    console.log('Send: BI-url-changed');
    // send to the localhost
    const action = 'BI-url-changed';
    const mixed = {
      prevUrl,
      curUrl,
    };
    biPostMessage(action, mixed);
    prevUrl = curUrl;
  }
}, 100);
```

## REALTIME PAGE

### Where to show you the real-time interest of your coin by entering the buy price.

```
https://github.com/binance/binance-spot-api-docs/blob/master/web-socket-streams.md
```


## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Lints and fixes files
```
npm run lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
