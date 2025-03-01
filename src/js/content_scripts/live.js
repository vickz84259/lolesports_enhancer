'use strict';

import * as link_state from '../modules/link_state.js';
import * as stats from '../modules/stats.js';


let link_regex = /^https:\/\/watch\.(?:\w+\.)?lolesports\.com\/live(?:\/\w+\/[a-zA-Z0-9_\-]{11})?$/;
let properties = {
  portName: 'live',
  regexPattern: link_regex,
  init_functions: [stats.init],
  cleanup_functions: [stats.disconnect]
};
link_state.connect(properties);