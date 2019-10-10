const PORTS = new Map();

function main() {
  browser.runtime.onConnect.addListener(port => {
    tabId = port.sender.tab.id;
    PORTS.set(tabId, port);
  });

  browser.tabs.onRemoved.addListener(tabId => {
    PORTS.delete(tabId);
    browser.storage.local.remove(tabId.toString());
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
  let port = PORTS.get(details.tabId);

  let message = {
    // Since the tabId is already being used to track the different connection
    // ports, sending it to content scripts to use in storage keys helps when
    // it comes to cleanup.
    tabId: details.tabId,
    url: details.url
  };
  port.postMessage(message);
}

main();