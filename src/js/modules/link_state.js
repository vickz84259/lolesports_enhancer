class TabState {

  constructor() {
    this.observers = [];
  }

  addObserver(observer) {
    this.observers.push(observer);
  }
}

export function connect(properties) {
  // Creating a connection to the background script
  let port = browser.runtime.connect({ name: properties.portName });
  let msgHandler = getHandler(properties);
  port.onMessage.addListener(message => msgHandler(message));
}

function getHandler(properties) {
  // Keep track of the page the tab user visited and is currently on
  let previousLink = null;
  let currentLink = null;

  let tabState = new TabState();

  return function(message) {
    if (currentLink) previousLink = currentLink;
    currentLink = message.url;

    let matchesPrevious = properties.regexPattern.test(previousLink);
    let matchesCurrent = properties.regexPattern.test(currentLink);

    if (!matchesPrevious && matchesCurrent) {
      // This means the user has navigated to the page of interest
      tabState.action = 'initialise';
    } else if (matchesPrevious && !matchesCurrent) {
      // This means the user has navigated away from the page of interest
      tabState.action = 'disconnect';

      if (tabState.observers.length > 0) {
        for (let observer of tabState.observers) observer.disconnect();

        // Remove the observers
        tabState.observers.splice(0, tabState.observers.length);
      }
    }
    properties.handler(tabState);
    tabState.action = '';
  }
}