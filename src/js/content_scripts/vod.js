'use strict';

import * as link_state from '../modules/link_state.js';
import { getElementBySelector } from '../modules/DOM_utils.js';
import { setUpLayoutObserver } from '../modules/layout/sidebar.js';

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