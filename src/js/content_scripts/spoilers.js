'use strict';

import * as link_state from '../modules/link_state.js';
import * as mutation from '../modules/mutation.js';

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

    score.textContent = 'VS';

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
  let observer = new MutationObserver(mutationRecords => {
    for (let mutationRecord of mutationRecords) {
      let event = mutationRecord.target;
      for (let eventMatch of event.getElementsByClassName('EventMatch')) {
        hideSpoiler(eventMatch);
      }
    }
  });

  let targetElement = document.body.querySelector('.Schedule .events .Event');
  observer.observe(targetElement, { childList: true });

  return observer;
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
  let observer = new MutationObserver((mutationRecords, currentObserver) => {
    for (let node of mutation.addedRecordsIterator(mutationRecords)) {
      if (node.classList.contains('Event')) {
        processEventNode(node);

        // Disconnecting this observer and initialising the second one.
        currentObserver.disconnect();
        tabState.addObserver(observeMatches());
        break;
      }
    }
  });

  let config = { childList: true, subtree: true };
  observer.observe(document.body, config);
  tabState.addObserver(observer);
}

let link_regex = /^https:\/\/watch\.(?:\w+\.)?lolesports\.com\/schedule(?:\?\S+)?$/;
let properties = {
  portName: 'spoilers',
  regexPattern: link_regex,
  init_functions: [initBaseObserver],
  cleanup_functions: []
};
link_state.connect(properties);