import * as announcer from '../modules/announcer.js';


/** /**
 * @typedef {object} Message
 * @property {string} destination - The background script meant to receive a
 *    particular message
 * @property {string} data - The data to be sent
 */

function main() {
  browser.browserAction.onClicked.addListener(() => {
    browser.runtime.openOptionsPage();
  });

  browser.runtime.onMessage.addListener(/** @param {Message} msg */ msg => {
    if (msg.destination === 'settings' &&
        msg.data === 'settings_updated') {
      announcer.checkFiles();
    }
  });
}

main();
