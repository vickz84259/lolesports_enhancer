const PORTS: Map<string, browser.runtime.Port> = new Map();

// Keeps track of the unique ids representing ports for each content script in
// a particular tab
const IDS_MAP: Map<number, string[]> = new Map();

function main() {
  browser.runtime.onConnect.addListener(port => {
    const tabId = port.sender!.tab!.id!;

    const unique_id = `${tabId}_${port.name}`;
    const value = IDS_MAP.has(tabId) ? IDS_MAP.get(tabId)! : [];
    value.push(unique_id);

    IDS_MAP.set(tabId, value);
    PORTS.set(unique_id, port);
  });

  browser.tabs.onRemoved.addListener(tabId => {
    if (IDS_MAP.has(tabId)) {
      const ids = IDS_MAP.get(tabId)!;
      for (const id of ids) {
        PORTS.delete(id);
      }
      IDS_MAP.delete(tabId);
    }
  });

  browser.webNavigation.onHistoryStateUpdated.addListener(
      navigationListener,
      {
        url: [
          {
            schemes: ['https'],
            hostSuffix: 'watch.lolesports.com'
          },
          {
            schemes: ['https'],
            // This caters for the cases where there's another sub domain apart
            // from watch. e.g. https://watch.euw.lolesports.com
            hostContains: '.lolesports.com'
          }
        ]
      }
  );
}


// Contains details about the navigation event.
interface NavigationDetails {
  tabId: number; // The ID of the tab in which the navigation is about to occur.
  url: string; // The URL to which the given frame will navigate.
  processId: number;
  frameId: number;
  timeStamp: number;
  transitionType: browser.webNavigation.TransitionType;
  transitionQualifiers: browser.webNavigation.TransitionQualifier[];
}

/**
 * Callback function to handle onHistoryStateUpdated events
 * The function sends a message to every content script on the particular tab
 * where the link has changed.
 *
 * @param details
 */
function navigationListener(details: NavigationDetails) {
  const ids = IDS_MAP.get(details.tabId)!;
  for (const id of ids) {
    const port = PORTS.get(id)!;
    port.postMessage({ url: details.url });
  }
}

main();

export {};
