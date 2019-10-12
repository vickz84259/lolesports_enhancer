'use strict';

import { Info } from './script_info.js';
import * as mutation from './mutation.js';
import * as utils from './utils.js';

const LINK_REGEX = /^https:\/\/watch\.(?:\w+\.)?lolesports\.com\/schedule(?:\?\S+)?$/;
const INFO = new Info(LINK_REGEX);

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

    // TODO: Change this as it is not recommended
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
  // This observer is used after the page has loaded and the initial schedule
  // list has been displayed. It only keeps track of changes to the Events list
  // and its children.
  INFO.observer = new MutationObserver(mutationRecords => {
    for (let mutationRecord of mutationRecords) {
      let event = mutationRecord.target;
      for (let eventMatch of event.getElementsByClassName('EventMatch')) {
        hideSpoiler(eventMatch);
      }
    }
  });

  let targetElement = document.body.querySelector('.Schedule .events .Event');
  INFO.observer.observe(targetElement, { childList: true });
}

function processEventNode(node) {
  for (let match of mutation.filteredNodes(node.childNodes)) {
    if (match.classList.contains('EventMatch')) {
      hideSpoiler(match);
    }
  }
}

function init() {
  let port = browser.runtime.connect();
  port.onMessage.addListener(message => INFO.handleMessage(message));

  browser.storage.onChanged.addListener(changes => {
    if (INFO.tabId in changes) {
      let newValue = JSON.parse(changes[INFO.tabId].newValue);
      let status = newValue.status;

      if (status === 'initial') {
        initBaseObserver();

      } else if (status === 'connect') {
        INFO.observer.disconnect();
        observeMatches();

      } else if (status === 'disconnect') {
        INFO.observer.disconnect();
        INFO.observer = null;
      }
    }
  });
}

function initBaseObserver() {
  // The initial observer looks for changes within the body tag and its
  // descendants. This is only reasonable when first visiting the page.
  INFO.observer = new MutationObserver(mutationRecords => {
    for (let node of mutation.recordsIterator(mutationRecords)) {
      if (node.classList.contains('Event')) {
        processEventNode(node);

        // Status message to have this observer disconnected and the second
        // observer connected.
        utils.setToStorage(INFO.tabId, { status: 'connect' });
        break;
      }
    }
  });

  let config = { childList: true, subtree: true };
  INFO.observer.observe(document.body, config);
}

init();