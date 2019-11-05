'use strict';

import * as link_state from '../modules/link_state.js';
import * as stats from '../modules/stats.js';
import * as sidebar from '../modules/layout/sidebar.js';
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

let link_regex = /https:\/\/watch\.(?:\w+\.)?lolesports\.com\/vod\/\d+\/\d{1}(?:\/[a-zA-Z0-9_\-]{11})?/;
let properties = {
  portName: 'vod',
  regexPattern: link_regex,
  init_functions: [sidebar.init, stats.init],
  cleanup_functions: []
};
link_state.connect(properties);