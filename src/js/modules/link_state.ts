/** Class used to keep track of Mutation observer objects in content scripts */
export class TabState {
  readonly observers: MutationObserver[];

  constructor() {
    this.observers = [];
  }

  addObserver(observer: MutationObserver) {
    this.observers.push(observer);
  }
}

// Properties related to a content script
interface Properties {
  portName: string, // The name of the content script

  // The regex pattern determining the url that the content script considers
  // valid
  regexPattern: RegExp,

  // Functions called when the user navigates to a url matching regexPattern
  init_functions: ((tabState: TabState) => void)[] // eslint-disable-line

  // Functions called when the user navigates to a url that doesn't match
  // regexPattern
  cleanup_functions: (() => void)[]
}

interface Message {
  url: string
}

/**
 * Function called by each content script when it is loaded on to a webpage.
 * It initiates a connection with the navigation.js background script and setups
 * a handler for the navigation messages
 */
export function connect(properties: Properties) {
  // Creating a connection to the background script
  const port = browser.runtime.connect({ name: properties.portName });
  const msgHandler = getHandler(properties);

  port.onMessage.addListener((message: any) => msgHandler(message));
}

/**
 * Initialises and returns the navigation message handler.
 */
function getHandler(properties: Properties) {
  // Keep track of the page the tab user visited and is currently on
  let previousLink = '';
  let currentLink = '';

  const tabState = new TabState();

  return function handler(message: Message) {
    previousLink = currentLink;
    currentLink = message.url;

    const matchesPrevious = properties.regexPattern.test(previousLink);
    const matchesCurrent = properties.regexPattern.test(currentLink);

    if (!matchesPrevious && matchesCurrent) {
      // This means the user has navigated to the page of interest
      for (const handler of properties.init_functions) {
        handler(tabState);
      }

    } else if (matchesPrevious && !matchesCurrent) {
      // This means the user has navigated away from the page of interest
      if (tabState.observers.length > 0) {
        for (const observer of tabState.observers) observer.disconnect();

        // Remove the observers
        tabState.observers.splice(0, tabState.observers.length);
      }

      for (const handler of properties.cleanup_functions) {
        handler();
      }
    }
  };
}
