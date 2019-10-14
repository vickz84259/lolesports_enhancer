export function connect(regexPattern, statusHandler) {
  // Creating a connection to the background script
  let port = browser.runtime.connect();
  let msgHandler = getHandler(regexPattern, statusHandler);
  port.onMessage.addListener(message => msgHandler(message));
}

function getHandler(regexPattern, statusHandler) {
  // Keep track of the page the tab user visited and is currently on
  let previousLink = null;
  let currentLink = null;

  let tabState = {};

  return function(message) {
    if (currentLink) previousLink = currentLink;
    currentLink = message.url;

    console.log(currentLink);

    let matchesPrevious = regexPattern.test(previousLink);
    let matchesCurrent = regexPattern.test(currentLink);

    if (!matchesPrevious && matchesCurrent) {
      // This means the user has navigated to the page of interest
      tabState.action = 'initialise';
    } else if (matchesPrevious && !matchesCurrent) {
      // This means the user has navigated away from the page of interest
      tabState.action = 'disconnect';
    }
    statusHandler(tabState);
  }
}