import * as utils from './utils.js';

export class Info {

  constructor(regexPattern) {
    // The tab the content script is currently running in
    this.tabId = null;

    // Keep track of the page the tab user visited and is currently on
    this._previousLink = null;
    this._currentLink = null;

    this._regexPattern = regexPattern;
  }

  handleMessage(message) {
    if (!this.tabId) this.tabId = message.tabId.toString();

    if (this._currentLink) this._previousLink = this._currentLink;
    this._currentLink = message.url;

    let matchesPrevious = this._regexPattern.test(this._previousLink);
    let matchesCurrent = this._regexPattern.test(this._currentLink);

    let value = {};
    if (!matchesPrevious && matchesCurrent) {
      // This means the user has navigated to the page of interest
      value = { status: 'initial' };
    } else if (matchesPrevious && !matchesCurrent) {
      // This means the user has navigated away from the page of interest
      value = { status: 'disconnect' };
    }
    if (!utils.isEmpty(value)) utils.setToStorage(this.tabId, value);
  }
}