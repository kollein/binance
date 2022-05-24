/* eslint-disable no-use-before-define */
/* eslint-disable prefer-rest-params */
/* eslint-disable func-names */
console.log('Override Detection!!!');

(function () {
  const proxied = window.XMLHttpRequest.prototype.open;
  window.XMLHttpRequest.prototype.open = function () {
    const url = arguments[1];
    const isChartRequest = url.indexOf('api/v3/klines?symbol=') > -1;
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
}());

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



const checkOtAttr = (event) => {
  const path = event.path || (event.composedPath && event.composedPath());

  return !!path.find((el) => {
    if (el.id === "footer_menu_item_ba-one-trust-cookie") {
      return true;
    }
    if (el && el.getAttribute) {
      return el.getAttribute("data-ot-trigger") === "true";
    }
    return false;
  });
};
document.addEventListener("click", (event) => {
  if (checkOtAttr(event)) {
    if (!window.OneTrust) {
      console.error("please load oneTrust chunk first");
    } else {
      window.OneTrust.ToggleInfoDisplay();
    }

    event.preventDefault();
  }
});

window.addEventListener("DOMContentLoaded", (event) => {
  const sy = document.createElement("style");
  sy.innerHTML = `#ot-sdk-btn-floating {
    display: none;
}`;
  document.body.append(sy);
});
