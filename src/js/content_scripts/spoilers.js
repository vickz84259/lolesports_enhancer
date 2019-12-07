'use strict';

import * as link_state from '../modules/link_state.js';
import * as mutation from '../modules/mutation.js';

/**
 * Function that does the actual UI changes to hide spoilers
 *
 * @param {Element} match
 */
function hideSpoiler(match) {
  const link = match.querySelector('a.past');

  if (link !== null) {
    const result = link.querySelector('.teams');

    const classList = result.classList;
    (classList.contains('winner-team2')) ?
      classList.add('winner-team1') : classList.add('winner-team2');

    /**
     * @todo Revisit the logic exhibited here
     *
     * @type {Element}
     */
    let score = result.querySelector('.score');
    if (score === null) {
      score = result.querySelector('.versus');
    } else {
      score.classList.replace('score', 'versus');
    }

    score.textContent = 'VS';

    const teams = link.getElementsByClassName('team');
    for (const team of teams) {
      const matchHistory = team.querySelector('.team-info .winloss');
      if (matchHistory !== null) {
        matchHistory.remove();
      }

      const teamName = team.querySelector('.team-info h2');
      teamName.setAttribute('style', 'color: #555d64');
    }
  }
}


/**
 * This observer is used after the page has loaded and the initial schedule
 * list has been displayed. It only keeps track of changes to the Events list
 * and its children.
 *
 * @returns {MutationObserver}
 */
function observeMatches() {
  const observer = new MutationObserver(mutationRecords => {
    for (const mutationRecord of mutationRecords) {

      /** @type {Element} */
      const event = (mutationRecord.target);
      for (const eventMatch of event.getElementsByClassName('EventMatch')) {
        hideSpoiler(eventMatch);
      }
    }
  });

  const targetElement = document.body.querySelector('.Schedule .events .Event');
  observer.observe(targetElement, { childList: true });

  return observer;
}

/**
 * Processes the spoilers when the DOM is initially loaded.
 *
 * @param {Node} node
 */
function processEventNode(node) {
  for (const match of mutation.filteredNodes(node.childNodes, 'EventMatch')) {
    hideSpoiler(match);
  }
}

/**
 * Initialises the base observer.
 *
 * @param {link_state.TabStateDef} tabState
 */
function initBaseObserver(tabState) {
  // The initial observer looks for changes within the body tag and its
  // descendants. This is only reasonable when first visiting the page.
  const observer = new MutationObserver((mutationRecords, currentObserver) => {
    for (const node of mutation.addedRecordsIterator(mutationRecords, 'Event')
    ) {
      processEventNode(node);

      // Disconnecting this observer and initialising the second one.
      currentObserver.disconnect();
      tabState.addObserver(observeMatches());
      break;
    }
  });

  const config = { childList: true, subtree: true };
  observer.observe(document.body, config);
  tabState.addObserver(observer);
}

const link_regex = /^https:\/\/watch\.(?:\w+\.)?lolesports\.com\/schedule(?:\?\S+)?$/;
const properties = {
  portName: 'spoilers',
  regexPattern: link_regex,
  init_functions: [initBaseObserver],
  cleanup_functions: []
};
link_state.connect(properties);
