const PORTS = new Map();

// Keeps track of the unique ids representing ports for each content script in
// a particular tab
const IDS_MAP = new Map();

function main() {
  browser.runtime.onConnect.addListener(port => {
    tabId = port.sender.tab.id;

    let unique_id = `${tabId}_${port.name}`;
    let value = IDS_MAP.has(tabId) ? IDS_MAP.get(tabId) : [];
    value.push(unique_id);

    IDS_MAP.set(tabId, value);
    PORTS.set(unique_id, port);
  });

  browser.tabs.onRemoved.addListener(tabId => {
    if (IDS_MAP.has(tabId)) {
      let ids = IDS_MAP.get(tabId);
      for (let id of ids) {
        PORTS.delete(id);
      }
      IDS_MAP.delete(tabId);
    }
  });

  /* beautify preserve:start */
  browser.webNavigation.onHistoryStateUpdated.addListener(
    navigationListener,
    {
      url: [{
        schemes: ['https'],
        hostSuffix: 'watch.lolesports.com'
      },
      {
        schemes: ['https'],
        // This caters for the cases where there's another sub domain apart from
        // watch. e.g. https://watch.euw.lolesports.com
        hostContains: '.lolesports.com'
      }]
    }
  );
  /* beautify preserve:end */
}

function navigationListener(details) {
  let ids = IDS_MAP.get(details.tabId);
  for (let id of ids) {
    let port = PORTS.get(id);
    port.postMessage({ url: details.url });
  }
}

main();