'use strict';

class Info {

  constructor() {
    // The tab the content script is currently running in
    this.tabId = null;

    // Keep track of the page the tab user visited and is currently on
    this._previousLink = null;
    this._currentLink = null;

    this._regexPattern = /^https:\/\/watch\.(?:\w+\.)?lolesports\.com\/schedule(?:\?\S+)?$/;
  }

  handleMessage(message) {
    if (!this.tabId) this.tabId = message.tabId.toString();

    if (this._currentLink) this._previousLink = this._currentLink;
    this._currentLink = message.url;

    let matchesPrevious = this._regexPattern.test(this._previousLink);
    let matchesCurrent = this._regexPattern.test(this._currentLink);

    /* beautify preserve:start */
    let value = {};
    if (!matchesPrevious && matchesCurrent) {
      // This means the user has navigated to the page of interest
      value = { status: 'initial' };
    } else if (matchesPrevious && !matchesCurrent) {
      // This means the user has navigated away from the page of interest
      value = { status: 'disconnect' };
    }
    if (!isEmpty(value)) setToStorage(this.tabId, value);
    /* beautify preserve:end */
  }
}

const INFO = new Info();

function hideSpoiler(match) {
  let link = match.querySelector('a.past');

  if (link !== null) {
    let result = link.querySelector('.teams');

    let classList = result.classList;
    /* beautify ignore:start */
    (classList.contains('winner-team2')) ?
      classList.add('winner-team1') : classList.add('winner-team2');
    /* beautify ignore:end */

    let score = result.querySelector('.score');
    if (score !== null) {
      score.classList.replace('score', 'versus');
    } else {
      score = result.querySelector('.versus');
    }
    score.innerHTML = 'VS';

    let teams = link.getElementsByClassName('team');
    for (let team of teams) {
      let matchHistory = team.querySelector('.team-info .winloss');
      if (matchHistory !== null) {
        matchHistory.remove();
      }

      let teamName = team.querySelector('.team-info h2');
      teamName.setAttribute('style', 'color: #555d64');
    }
  }
}

function observeMatches() {
  let observer = new MutationObserver(mutationRecords => {
    for (let mutationRecord of mutationRecords) {
      let event = mutationRecord.target;
      for (let eventMatch of event.getElementsByClassName('EventMatch')) {
        hideSpoiler(eventMatch);
      }
    }
  });

  let config = {
    childList: true,
  };
  let targetElement = document.body.querySelector('.Schedule .events .Event');
  observer.observe(targetElement, config);
}

function* filteredNodes(nodes) {
  for (let node of nodes) {
    if (node.nodeType === 1) {
      yield node;
    }
  }
}

function* recordsIterator(mutationRecords) {
  for (let mutationRecord of mutationRecords) {
    yield* filteredNodes(mutationRecord.addedNodes);
  }
}

function processEventNode(node) {
  for (let match of filteredNodes(node.childNodes)) {
    if (match.classList.contains('EventMatch')) {
      hideSpoiler(match);
    }
  }
}

function init() {
  let observer = new MutationObserver((mutationRecords, observer) => {
    for (let node of recordsIterator(mutationRecords)) {
      if (node.classList.contains('Event')) {
        processEventNode(node);

        observer.disconnect();
        observeMatches();
        break;
      }
    }
  });

  let config = {
    childList: true,
    subtree: true,
  };
  observer.observe(document.body, config);

  let port = browser.runtime.connect();
  port.onMessage.addListener(message => INFO.handleMessage(message));

  browser.storage.onChanged.addListener(changes => console.log(changes));
}

function isEmpty(object) {
  return Object.keys(object).length === 0 && object.constructor === Object;
}

function assertStorageType(storageType) {
  const storageTypes = ['local', 'sync', 'managed'];
  if (!storageTypes.includes(storageType)) throw new Error('Wrong storage type');
}

function getFromStorage(key, defaultValue = 'None', storageType = 'local') {
  /* beautify preserve:start */
  assertStorageType(storageType);
  return browser.storage[storageType].get({ [key]: defaultValue });
  /* beautify preserve:end */
}

function setToStorage(key, value = {}, storageType = 'local') {
  /* beautify preserve:start */
  assertStorageType(storageType);
  browser.storage[storageType].set({ [key]: JSON.stringify(value) });
  /* beautify preserve:end */
}

init();