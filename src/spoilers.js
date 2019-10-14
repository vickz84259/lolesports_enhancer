'use strict';

import * as link_state from './link_state.js';
import * as mutation from './mutation.js';

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

function observeMatches(tabState) {
  // This observer is used after the page has loaded and the initial schedule
  // list has been displayed. It only keeps track of changes to the Events list
  // and its children.
  tabState.observer = new MutationObserver(mutationRecords => {
    for (let mutationRecord of mutationRecords) {
      let event = mutationRecord.target;
      for (let eventMatch of event.getElementsByClassName('EventMatch')) {
        hideSpoiler(eventMatch);
      }
    }
  });

  let targetElement = document.body.querySelector('.Schedule .events .Event');
  tabState.observer.observe(targetElement, { childList: true });
}

function processEventNode(node) {
  for (let match of mutation.filteredNodes(node.childNodes)) {
    if (match.classList.contains('EventMatch')) {
      hideSpoiler(match);
    }
  }
}

function initBaseObserver(tabState) {
  // The initial observer looks for changes within the body tag and its
  // descendants. This is only reasonable when first visiting the page.
  tabState.observer = new MutationObserver(mutationRecords => {
    for (let node of mutation.recordsIterator(mutationRecords)) {
      if (node.classList.contains('Event')) {
        processEventNode(node);

        // Disconnecting this observer and initialising the second one.
        tabState.observer.disconnect();
        observeMatches(tabState);
        break;
      }
    }
  });

  let config = { childList: true, subtree: true };
  tabState.observer.observe(document.body, config);
}

function statusHandler(tabState) {
  if (tabState.action === 'initialise') {
    initBaseObserver(tabState);

  } else if (tabState.action === 'disconnect') {
    tabState.observer.disconnect();
    tabState.observer = null;
  }
}

let link_regex = /^https:\/\/watch\.(?:\w+\.)?lolesports\.com\/schedule(?:\?\S+)?$/;
let properties = {
  portName: 'spoilers',
  regexPattern: link_regex,
  handler: statusHandler
};
link_state.connect(properties);