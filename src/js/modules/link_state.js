/**
 * Properties related to a content script
 * @typedef {Object} Properties
 * @property {string} portName - The name of the content script
 * @property {RegExp} regexPattern - The regex pattern determining the url that
 *    the content script considers valid
 * @property {(function(TabState): void) []} init_functions -
 *    Functions called when the user navigates to a url matching regexPattern
 * @property {(function(): void) []} cleanup_functions - Functions called when
 *    the user navigates to a url that doesn't match regexPattern
*/

/**
 * @typedef {Object} TabStateDef
 * @property {function(MutationObserver): void} addObserver
 */

/** Class used to keep track of Mutation observer objects in content scripts */
class TabState {

  constructor() {
    /** @private @const @type {MutationObserver[]} */
    this.observers = [];
  }

  /** @param {MutationObserver} observer */
  addObserver(observer) {
    this.observers.push(observer);
  }
}

/**
 * Function called by each content script when it is loaded on to a webpage.
 * It initiates a connection with the navigation.js background script and setups
 * a handler for the navigation messages
 *
 * @param {Properties} properties
 */
export function connect(properties) {
  // Creating a connection to the background script
  const port = browser.runtime.connect({ name: properties.portName });
  const msgHandler = getHandler(properties);
  // @ts-ignore
  port.onMessage.addListener(message => msgHandler(message));
}

/**
 * Initialises and returns the navigation message handler.
 *
 * @param {Properties} properties
 *
 * @returns {function({url: string}): void}
 */
function getHandler(properties) {
  // Keep track of the page the tab user visited and is currently on
  /** @type {?string} */
  let previousLink = null;

  /** @type {?string} */
  let currentLink = null;

  const tabState = new TabState();

  return function handler(message) {
    if (currentLink) previousLink = currentLink;
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
