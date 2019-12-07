'use strict';

import * as link_state from '../modules/link_state.js';
import * as stats from '../modules/stats.js';
import * as sidebar from '../modules/layout/sidebar.js';
import { getElementBySelector } from '../modules/DOM_utils.js';


/* Currently the function works as intended but there are improvements that are
needed.
TODO:
  Find how to restore cookie button to previous state
  Fix issue where "Login for watch rewards" popup removes the button in its new
    position*/
// eslint-disable-next-line
async function moveCookieButton() {
  const btn = getElementBySelector('.riotbar-cookie-policy-v2.cookie-link');
  const streamSelector = getElementBySelector('.stream-selector');

  const nav = await getElementBySelector('.nav-details .nav');
  nav.insertBefore((await btn), (await streamSelector));
}

const link_regex = /https:\/\/watch\.(?:\w+\.)?lolesports\.com\/vod\/\d+\/\d{1}(?:\/[a-zA-Z0-9_-]{11})?/;
const properties = {
  portName: 'vod',
  regexPattern: link_regex,
  init_functions: [sidebar.init, stats.init],
  cleanup_functions: [stats.disconnect]
};
link_state.connect(properties);
