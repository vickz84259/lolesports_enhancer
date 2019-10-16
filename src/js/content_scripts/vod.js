'use strict';

import * as link_state from '../modules/link_state.js';
import * as mutation from '../modules/mutation.js';
import { getElementBySelector } from '../modules/DOM_utils.js';

/* Currently the function works as intended but there are improvements that needed.
TODO:
  Find how to restore cookie button to previous state
  Fix issue where "Login for watch rewards" popup removes the button in its new
    position*/
async function moveCookieButton() {
  let cookieButton = getElementBySelector('.riotbar-cookie-policy-v2.cookie-link');
  let streamSelector = getElementBySelector('.stream-selector');

  let nav = await getElementBySelector('.nav-details .nav');
  nav.insertBefore((await cookieButton), (await streamSelector));
}

async function setLayoutOptions(optionsList) {
  for (let element of optionsList.childNodes) {
    let firstChild = element.firstChild;
    if (firstChild.textContent === 'Sidebar') {
      // Renaming the previous option as Sidebar Left
      firstChild.textContent = 'Sidebar Left';
    }
  }

  // Creating the extra layout option
  let newOption = document.createElement('li');
  newOption.setAttribute('class', 'option');

  let label = document.createElement('span');
  label.setAttribute('class', 'label');
  label.textContent = 'Sidebar Right';

  newOption.appendChild(label);
  optionsList.appendChild(newOption);

  let url = browser.runtime.getURL('src/img/right_sidebar.svg');
  let sidebarSVG = await (await fetch(url)).text();

  newOption.insertAdjacentHTML('beforeend', DOMPurify.sanitize(sidebarSVG));
}

async function setUpLayoutObserver(tabState) {
  // This observer checks if the user has opened the options to switch the stats
  // layout which triggers a mutation.
  tabState.observer = new MutationObserver(mutationRecords => {
    for (let element of mutation.recordsIterator(mutationRecords)) {
      if (element.className === 'WatchOptionsLayout') {
        let optionsList = element.querySelector('.layouts.options-list');
        setLayoutOptions(optionsList);
      }
    }
  });

  let targetElement = getElementBySelector('.watch-options');
  tabState.observer.observe((await targetElement), { childList: true });
}

function statusHandler(tabState) {
  if (tabState.action === 'initialise') {
    // moveCookieButton();

    setUpLayoutObserver(tabState);
  } else if (tabState.action === 'disconnect') {
    tabState.observer.disconnect();
    tabState.observer = null;
  }
}

let link_regex = /https:\/\/watch\.(?:\w+\.)?lolesports\.com\/vod\/\d+\/\d{1}(?:\/[a-zA-Z0-9_\-]{11})?/;
let properties = {
  portName: 'vod',
  regexPattern: link_regex,
  handler: statusHandler
};
link_state.connect(properties);